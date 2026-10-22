/**
 * Tiny, dependency-free physics used by the hero scene.
 *
 *  - BalloonSystem: every balloon is its own rigid body (position, velocity,
 *    orientation, angular velocity). Balloons are tied to the bouquet knot by
 *    a string (rope constraint applied at the balloon's knot, so pushing a
 *    balloon makes it tilt and pivot like a real one), float on helium
 *    (buoyancy bob + breeze), collide with each other (restitution + friction,
 *    so spin is transferred), and react to the pointer (air cushion, surface
 *    friction that spins them, taps that bounce them away).
 *
 *  - SwingingPendulum: a damped 2-axis pendulum for the hanging disco balls,
 *    with a gentle breeze so it always sways a little, and pointer coupling.
 *
 * Everything works in plain numbers so it can be unit-tested headlessly. The
 * three.js side only reads the resulting positions / quaternions.
 */

export interface V3 {
  x: number;
  y: number;
  z: number;
}

export interface Q4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

// ──────────────────────────────────────────────────────────────
// Small vector / quaternion helpers
// ──────────────────────────────────────────────────────────────
const v3 = (x = 0, y = 0, z = 0): V3 => ({ x, y, z });
const add = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: V3, b: V3): V3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (a: V3, s: number): V3 => v3(a.x * s, a.y * s, a.z * s);
const dot = (a: V3, b: V3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 =>
  v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const len = (a: V3): number => Math.sqrt(dot(a, a));
const norm = (a: V3, fallback: V3 = v3(0, 1, 0)): V3 => {
  const l = len(a);
  return l > 1e-9 ? mul(a, 1 / l) : fallback;
};

const qIdentity = (): Q4 => ({ x: 0, y: 0, z: 0, w: 1 });
const qMul = (a: Q4, b: Q4): Q4 => ({
  x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
  y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
  z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
});
const qNormalize = (q: Q4): Q4 => {
  const l = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) || 1;
  return { x: q.x / l, y: q.y / l, z: q.z / l, w: q.w / l };
};
/** Rotate vector by quaternion. */
const qRotate = (q: Q4, p: V3): V3 => {
  const u = v3(q.x, q.y, q.z);
  const t = mul(cross(u, p), 2);
  return add(add(p, mul(t, q.w)), cross(u, t));
};
/** Quaternion for a small rotation vector (axis * angle). */
const qFromRotVec = (r: V3): Q4 => {
  const a = len(r);
  if (a < 1e-9) return qIdentity();
  const s = Math.sin(a / 2) / a;
  return { x: r.x * s, y: r.y * s, z: r.z * s, w: Math.cos(a / 2) };
};
/** Apply a world-space rotation vector to an orientation. */
const qApplyRotVec = (q: Q4, r: V3): Q4 => qNormalize(qMul(qFromRotVec(r), q));

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const smoothstep01 = (s: number) => {
  const t = clamp(s, 0, 1);
  return t * t * (3 - 2 * t);
};

// ──────────────────────────────────────────────────────────────
// Pointer
// ──────────────────────────────────────────────────────────────
/** A ray in the same space the bodies live in. */
export interface PointerRay {
  origin: V3;
  dir: V3; // unit
  active: boolean;
}

// ──────────────────────────────────────────────────────────────
// Balloons
// ──────────────────────────────────────────────────────────────
export interface BalloonSpec {
  /** Rest position of the balloon centre. */
  center: V3;
  /** Rest position of the balloon knot (where the string is tied). */
  knot: V3;
  /** Collision / hit radius. */
  radius: number;
  mass?: number;
}

export interface BalloonTuning {
  homeStiffness: number; // 1/s^2  - how strongly a balloon returns to its spot
  linearDamping: number; // 1/s
  angularStiffness: number;
  angularDamping: number;
  buoyancyBob: number; // units/s^2 amplitude of helium bobbing
  breeze: number; // units/s^2 amplitude of idle breeze
  pushAccel: number; // pointer "air cushion" acceleration
  handCoupling: number; // 1/s, how quickly a swiping hand drags a balloon
  maxHandSpeed: number; // units/s
  restitution: number;
  friction: number;
  maxDisplacement: number;
  tapImpulse: number;
}

export const DEFAULT_BALLOON_TUNING: BalloonTuning = {
  homeStiffness: 30,
  linearDamping: 2.3,
  angularStiffness: 38,
  angularDamping: 2.8,
  buoyancyBob: 380,
  breeze: 430,
  pushAccel: 2800,
  handCoupling: 16,
  maxHandSpeed: 3200,
  restitution: 0.62,
  friction: 0.35,
  maxDisplacement: 420,
  tapImpulse: 520,
};

export interface BalloonBody {
  // constants
  restCenter: V3;
  knotLocal: V3; // knot offset from the centre, in the body frame
  radius: number;
  mass: number;
  inertia: number;
  stringLength: number;
  bobFreq: number;
  bobPhase: number;
  windPhase: number;
  // state
  pos: V3;
  vel: V3;
  rot: Q4; // rotation relative to the authored pose
  angVel: V3;
  /** Jelly "puff" (squash/stretch) spring, 0 at rest. */
  puff: number;
  puffVel: number;
}

export interface StringNode {
  ctrl: V3; // mid-string control point (a little particle of its own)
  vel: V3;
}

export class BalloonSystem {
  bodies: BalloonBody[];
  strings: StringNode[];
  anchor: V3;
  tuning: BalloonTuning;
  /** 0 disables idle motion (prefers-reduced-motion). Interactions still work. */
  idleMotion = 1;
  time = 0;
  /** Index of the balloon currently under the pointer, or -1. */
  hover = -1;

  private pairMin: number[][];
  private handPrev: V3 | null = null;
  private handVel: V3 = v3();
  private lastRay: PointerRay | null = null;

  constructor(specs: BalloonSpec[], anchor: V3, tuning: Partial<BalloonTuning> = {}) {
    this.anchor = anchor;
    this.tuning = { ...DEFAULT_BALLOON_TUNING, ...tuning };

    this.bodies = specs.map((s, i) => {
      const mass = s.mass ?? 1;
      const knotWorld = s.knot;
      return {
        restCenter: { ...s.center },
        knotLocal: sub(knotWorld, s.center),
        radius: s.radius,
        mass,
        inertia: 0.4 * mass * s.radius * s.radius,
        stringLength: len(sub(knotWorld, anchor)),
        bobFreq: 1.15 + (i % 5) * 0.21,
        bobPhase: i * 1.37,
        windPhase: i * 0.91 + 0.5,
        pos: { ...s.center },
        vel: v3(),
        rot: qIdentity(),
        angVel: v3(),
        puff: 0,
        puffVel: 0,
      };
    });

    this.strings = this.bodies.map((b) => {
      const mid = mul(add(add(b.restCenter, b.knotLocal), anchor), 0.5);
      return { ctrl: mid, vel: v3() };
    });

    // Balloons in the authored bouquet touch each other. Make the contact
    // distance never larger than the authored spacing, so the starting pose is
    // never "in collision" and nothing pops apart on load.
    this.pairMin = this.bodies.map((a) =>
      this.bodies.map((b) => {
        const rest = len(sub(a.restCenter, b.restCenter));
        return Math.min(a.radius + b.radius, rest * 0.94);
      })
    );
  }

  /** World position of a body's knot. */
  knotWorld(b: BalloonBody): V3 {
    return add(b.pos, qRotate(b.rot, b.knotLocal));
  }

  /** Reset everything to the authored pose. */
  reset() {
    this.bodies.forEach((b) => {
      b.pos = { ...b.restCenter };
      b.vel = v3();
      b.rot = qIdentity();
      b.angVel = v3();
      b.puff = 0;
      b.puffVel = 0;
    });
  }

  /** Largest speed of any balloon (useful to know when the scene is idle). */
  maxSpeed(): number {
    let m = 0;
    for (const b of this.bodies) m = Math.max(m, len(b.vel), len(b.angVel) * b.radius);
    return m;
  }

  // ────────────────────────────────────────────────────────
  step(frameDt: number, ray: PointerRay | null) {
    const dtFrame = clamp(frameDt, 0, 1 / 30);
    if (dtFrame <= 0) return;
    const SUB = 2;
    const dt = dtFrame / SUB;

    // Hand tracking (pointer velocity at the bouquet's depth)
    this.updateHand(ray, dtFrame);
    this.lastRay = ray && ray.active ? ray : null;
    this.hover = this.lastRay ? this.pickFront(this.lastRay, 1.0) : -1;

    for (let s = 0; s < SUB; s++) {
      this.time += dt;
      this.integrate(dt);
      for (const b of this.bodies) this.solveTether(b);
      this.solveCollisions();
    }
    this.updateStrings(dtFrame);
  }

  /** A tap / click: bounce whatever is under the pointer. Returns number of balloons hit. */
  tap(ray: PointerRay): number {
    const { tapImpulse } = this.tuning;
    let hits = 0;
    const hit = this.pickFront(ray, 1.15);
    this.bodies.forEach((b, i) => {
      const info = this.rayInfo(ray, b);
      const isFront = hit === i;
      const within = info.dist < b.radius * 1.2;
      if (!within) return;
      hits++;
      const weight = isFront ? 1 : 0.4;
      // away from the pointer's axis, and away from the camera
      const away = norm(info.w, cross(ray.dir, v3(0, 1, 0)));
      const j = norm(add(mul(away, 0.85), mul(ray.dir, 0.5)));
      const speed = tapImpulse * weight;
      b.vel = add(b.vel, mul(j, speed));
      // an off-centre hit also sets it spinning
      const r = mul(away, -b.radius);
      const spinKick = mul(cross(r, mul(j, speed)), 1 / b.inertia);
      b.angVel = add(b.angVel, spinKick);
      b.angVel = add(
        b.angVel,
        mul(v3(Math.sin(i * 12.9898) * 3, Math.sin(i * 78.233) * 3, Math.sin(i * 37.719) * 3), weight)
      );
      b.puffVel += 5.5 * weight;
    });
    return hits;
  }

  // ────────────────────────────────────────────────────────
  // Pointer helpers
  private rayInfo(ray: PointerRay, b: BalloonBody) {
    const toC = sub(b.pos, ray.origin);
    const t = Math.max(0, dot(toC, ray.dir));
    const closest = add(ray.origin, mul(ray.dir, t));
    const w = sub(b.pos, closest); // from the ray to the balloon centre
    return { t, closest, w, dist: len(w) };
  }

  /** Index of the front-most balloon that the ray actually hits, or -1. */
  private pickFront(ray: PointerRay, scale = 1): number {
    let best = -1;
    let bestT = Infinity;
    this.bodies.forEach((b, i) => {
      const info = this.rayInfo(ray, b);
      if (info.dist < b.radius * scale && info.t < bestT) {
        best = i;
        bestT = info.t;
      }
    });
    return best;
  }

  private updateHand(ray: PointerRay | null, dt: number) {
    if (!ray || !ray.active) {
      this.handPrev = null;
      this.handVel = mul(this.handVel, Math.exp(-dt * 12));
      return;
    }
    // point of the ray at the depth of the bouquet centre
    let cx = 0,
      cy = 0,
      cz = 0;
    for (const b of this.bodies) {
      cx += b.restCenter.x;
      cy += b.restCenter.y;
      cz += b.restCenter.z;
    }
    const n = this.bodies.length || 1;
    const centroid = v3(cx / n, cy / n, cz / n);
    const t = dot(sub(centroid, ray.origin), ray.dir);
    const p = add(ray.origin, mul(ray.dir, t));
    if (this.handPrev) {
      const raw = mul(sub(p, this.handPrev), 1 / dt);
      const sp = len(raw);
      const capped = sp > this.tuning.maxHandSpeed ? mul(raw, this.tuning.maxHandSpeed / sp) : raw;
      const a = 1 - Math.exp(-dt * 22);
      this.handVel = add(mul(this.handVel, 1 - a), mul(capped, a));
    }
    this.handPrev = p;
  }

  // ────────────────────────────────────────────────────────
  private integrate(dt: number) {
    const T = this.tuning;
    const idle = this.idleMotion;
    const ray = this.lastRay;
    const front = ray ? this.pickFront(ray, 1.0) : -1;

    this.bodies.forEach((b, i) => {
      // 1. Spring back to the authored arrangement (shape memory of the bunch)
      let acc = mul(sub(b.restCenter, b.pos), T.homeStiffness);
      acc = sub(acc, mul(b.vel, T.linearDamping));

      // 2. Helium bobbing + soft breeze (independent per balloon)
      const t = this.time;
      acc.y += idle * T.buoyancyBob * Math.sin(t * b.bobFreq + b.bobPhase);
      acc.x += idle * T.breeze * (Math.sin(t * 0.63 + b.windPhase) + 0.5 * Math.sin(t * 1.31 + b.windPhase * 2));
      acc.z += idle * T.breeze * 0.7 * Math.sin(t * 0.47 + b.windPhase * 1.7);

      // 3. Orientation spring (balloon wants to return upright) + drag
      let angAcc = sub(mul(qToRotVec(b.rot), -T.angularStiffness), mul(b.angVel, T.angularDamping));
      // a little wind-driven wobble
      angAcc = add(
        angAcc,
        mul(v3(Math.sin(t * 0.9 + b.windPhase), 0, Math.sin(t * 0.7 + b.windPhase * 1.3)), idle * 2.4)
      );

      // 4. Pointer
      if (ray && ray.active) {
        const info = this.rayInfo(ray, b);
        const influence = b.radius * 1.3;
        if (info.dist < influence) {
          let weight = smoothstep01(1 - info.dist / influence);
          // balloons hidden behind the one being touched only feel a breath of air
          if (front >= 0 && front !== i && info.t > this.rayInfo(ray, this.bodies[front]).t + 0.4 * b.radius) {
            weight *= 0.2;
          }
          const away = norm(info.w, cross(ray.dir, v3(0, 1, 0)));
          // (a) air cushion: pushed away from the pointer axis
          acc = add(acc, mul(away, T.pushAccel * weight));

          // (b) surface friction: a swiping hand drags the skin and spins the balloon
          const entry = Math.max(0, info.t - Math.sqrt(Math.max(0, b.radius * b.radius - info.dist * info.dist)));
          const contact = add(ray.origin, mul(ray.dir, entry));
          const r = sub(contact, b.pos);
          const vContact = add(b.vel, cross(b.angVel, r));
          let vRel = sub(vContact, this.handVel);
          vRel = sub(vRel, mul(ray.dir, dot(vRel, ray.dir))); // lateral only
          const s = len(vRel);
          if (s > 1e-6) {
            const tdir = mul(vRel, 1 / s);
            const rxt = cross(r, tdir);
            const w = 1 / b.mass + dot(rxt, rxt) / b.inertia;
            const blend = Math.min(1, T.handCoupling * weight * dt);
            const J = mul(tdir, (-s / w) * blend);
            b.vel = add(b.vel, mul(J, 1 / b.mass));
            b.angVel = add(b.angVel, mul(cross(r, J), 1 / b.inertia));
          }
        }
      }

      // integrate
      b.vel = add(b.vel, mul(acc, dt));
      b.pos = add(b.pos, mul(b.vel, dt));
      b.angVel = add(b.angVel, mul(angAcc, dt));
      b.rot = qApplyRotVec(b.rot, mul(b.angVel, dt));

      // jelly puff spring
      b.puffVel += (-70 * b.puff - 7 * b.puffVel) * dt;
      b.puff += b.puffVel * dt;
      b.puff = clamp(b.puff, -0.18, 0.22);

      // keep things sane
      const off = sub(b.pos, b.restCenter);
      const d = len(off);
      if (d > T.maxDisplacement) {
        const n = mul(off, 1 / d);
        b.pos = add(b.restCenter, mul(n, T.maxDisplacement));
        const vn = dot(b.vel, n);
        if (vn > 0) b.vel = sub(b.vel, mul(n, vn * 1.2));
      }
      const w = len(b.angVel);
      if (w > 14) b.angVel = mul(b.angVel, 14 / w);
    });
  }

  /** Rope: the knot can't be farther from the bouquet tie-point than the string is long. */
  private solveTether(b: BalloonBody) {
    const r = qRotate(b.rot, b.knotLocal);
    const knot = add(b.pos, r);
    const d = sub(knot, this.anchor);
    const dist = len(d);
    if (dist <= b.stringLength) return;
    const n = mul(d, 1 / dist);
    const C = dist - b.stringLength;
    const rxn = cross(r, n);
    const w = 1 / b.mass + dot(rxn, rxn) / b.inertia;
    const lambda = C / w;
    // position correction (translation + rotation about the centre)
    b.pos = sub(b.pos, mul(n, lambda / b.mass));
    b.rot = qApplyRotVec(b.rot, mul(rxn, -lambda / b.inertia));
    // remove the outward velocity at the knot (inelastic rope)
    const vKnot = add(b.vel, cross(b.angVel, r));
    const vn = dot(vKnot, n);
    if (vn > 0) {
      const J = -vn / w;
      b.vel = add(b.vel, mul(n, J / b.mass));
      b.angVel = add(b.angVel, mul(cross(r, mul(n, J)), 1 / b.inertia));
    }
  }

  private solveCollisions() {
    const T = this.tuning;
    const bs = this.bodies;
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        const a = bs[i];
        const b = bs[j];
        const d = sub(a.pos, b.pos);
        const dist = len(d);
        const minD = this.pairMin[i][j];
        if (dist >= minD || dist < 1e-6) continue;
        const n = mul(d, 1 / dist);
        const pen = minD - dist;
        const wa = 1 / a.mass;
        const wb = 1 / b.mass;
        a.pos = add(a.pos, mul(n, (pen * wa) / (wa + wb)));
        b.pos = sub(b.pos, mul(n, (pen * wb) / (wa + wb)));

        const ra = mul(n, -minD / 2);
        const rb = mul(n, minD / 2);
        const va = add(a.vel, cross(a.angVel, ra));
        const vb = add(b.vel, cross(b.angVel, rb));
        const vrel = sub(va, vb);
        const vn = dot(vrel, n);
        if (vn >= 0) continue;
        // normal impulse
        const jn = (-(1 + T.restitution) * vn) / (wa + wb);
        a.vel = add(a.vel, mul(n, jn * wa));
        b.vel = sub(b.vel, mul(n, jn * wb));
        // friction impulse (this is what makes balloons spin each other)
        const vt = sub(vrel, mul(n, vn));
        const st = len(vt);
        if (st > 1e-6) {
          const t = mul(vt, 1 / st);
          const rat = cross(ra, t);
          const rbt = cross(rb, t);
          const wt = wa + wb + dot(rat, rat) / a.inertia + dot(rbt, rbt) / b.inertia;
          let jt = -st / wt;
          jt = clamp(jt, -T.friction * jn, T.friction * jn);
          const Jt = mul(t, jt);
          a.vel = add(a.vel, mul(Jt, wa));
          b.vel = sub(b.vel, mul(Jt, wb));
          a.angVel = add(a.angVel, mul(cross(ra, Jt), 1 / a.inertia));
          b.angVel = sub(b.angVel, mul(cross(rb, Jt), 1 / b.inertia));
        }
        // jelly squish from the impact
        const impact = clamp(-vn / 500, 0, 1);
        a.puffVel += 3 * impact;
        b.puffVel += 3 * impact;
      }
    }
  }

  /** Each string's middle is a little spring-mass so strings lag, swing and slacken. */
  private updateStrings(dt: number) {
    this.bodies.forEach((b, i) => {
      const s = this.strings[i];
      const knot = this.knotWorld(b);
      const chord = sub(knot, this.anchor);
      const d = len(chord);
      const slack = Math.max(0, b.stringLength - d);
      // parabola sag for a string of length L over chord d: sqrt(3 d (L - d) / 8)
      const sag = Math.sqrt((3 * d * slack) / 8) + 2;
      const mid = mul(add(knot, this.anchor), 0.5);
      // trail slightly behind the balloon's motion (air drag on the string)
      const target = add(add(mid, v3(0, -sag, 0)), mul(b.vel, -0.035));
      const k = 90;
      const c = 9;
      const acc = sub(mul(sub(target, s.ctrl), k), mul(s.vel, c));
      s.vel = add(s.vel, mul(acc, dt));
      s.ctrl = add(s.ctrl, mul(s.vel, dt));
    });
  }
}

/** Orientation -> rotation vector (axis*angle), for the angular spring. */
function qToRotVec(q: Q4): V3 {
  let { x, y, z, w } = q;
  if (w < 0) {
    x = -x;
    y = -y;
    z = -z;
    w = -w;
  }
  const s = Math.sqrt(x * x + y * y + z * z);
  if (s < 1e-9) return v3();
  const angle = 2 * Math.atan2(s, w);
  const k = angle / s;
  return v3(x * k, y * k, z * k);
}

/**
 * Evaluate a quadratic Bezier through (anchor, ctrl-through-midpoint, knot).
 * `ctrlThrough` is the point the curve should pass at t = 0.5.
 */
export function stringPoint(anchor: V3, ctrlThrough: V3, knot: V3, t: number): V3 {
  // control point P1 such that B(0.5) = ctrlThrough
  const p1 = v3(
    2 * ctrlThrough.x - 0.5 * (anchor.x + knot.x),
    2 * ctrlThrough.y - 0.5 * (anchor.y + knot.y),
    2 * ctrlThrough.z - 0.5 * (anchor.z + knot.z)
  );
  const u = 1 - t;
  return v3(
    u * u * anchor.x + 2 * u * t * p1.x + t * t * knot.x,
    u * u * anchor.y + 2 * u * t * p1.y + t * t * knot.y,
    u * u * anchor.z + 2 * u * t * p1.z + t * t * knot.z
  );
}

// ──────────────────────────────────────────────────────────────
// Swinging disco ball
// ──────────────────────────────────────────────────────────────
export interface PendulumOptions {
  /** Distance from the pivot (top of the chain) to the ball centre, in world units. */
  length: number;
  /** Radius of the ball, for hit-testing and surface speed. */
  ballRadius: number;
  /** Natural frequency, rad/s. 2.1 ≈ a lazy 3 s period. */
  omega0?: number;
  /** Damping ratio (0 = never stops). */
  damping?: number;
  /** Idle sway amplitude in radians (~0.06 ≈ 3.5°). */
  idleAmplitude?: number;
  /** Idle spin in rad/s. */
  idleSpin?: number;
  seed?: number;
}

export class SwingingPendulum {
  /** Rotation about x (positive tips the ball away from the camera) and z (positive tips it to +x). */
  ax = 0;
  az = 0;
  wx = 0;
  wz = 0;
  yaw = 0;
  spin: number;
  idleMotion = 1;
  time = 0;

  readonly length: number;
  readonly ballRadius: number;
  private omega0: number;
  private zeta: number;
  private amp: number;
  private idleSpin: number;
  private seed: number;
  private wasTouched = false;

  constructor(o: PendulumOptions) {
    this.length = o.length;
    this.ballRadius = o.ballRadius;
    this.omega0 = o.omega0 ?? 2.1;
    this.zeta = o.damping ?? 0.07;
    this.amp = o.idleAmplitude ?? 0.06;
    this.idleSpin = o.idleSpin ?? 0.42;
    this.seed = o.seed ?? 0;
    this.spin = this.idleSpin;
    // start mid-swing so neighbouring balls never move in unison
    this.time = this.seed * 1.7;
  }

  /** The ball centre's offset from where it hangs at rest, in world units. */
  tip(): V3 {
    const L = this.length;
    return v3(L * Math.sin(this.az), L * (Math.cos(this.az) * Math.cos(this.ax) - 1), -L * Math.sin(this.ax));
  }

  /**
   * @param touch   how strongly the pointer is touching the ball (0..1)
   * @param handVel pointer velocity at the ball's depth, world units / s
   */
  step(frameDt: number, touch = 0, handVel: { x: number; y: number } = { x: 0, y: 0 }) {
    const dt = clamp(frameDt, 0, 1 / 30);
    if (dt <= 0) return;
    const SUB = 2;
    const h = dt / SUB;
    const w0 = this.omega0;
    const w02 = w0 * w0;
    const L = this.length;

    for (let s = 0; s < SUB; s++) {
      this.time += h;
      const t = this.time;
      const idle = this.idleMotion;
      const sd = this.seed;
      // a breeze made of two slow, incommensurate waves => never exactly repeats
      const fz = idle * this.amp * w02 * (0.62 * Math.sin(0.83 * t + sd) + 0.38 * Math.sin(0.37 * t + sd * 2.1));
      const fx = idle * this.amp * w02 * 0.7 * (0.6 * Math.sin(0.61 * t + sd * 1.3) + 0.4 * Math.sin(0.29 * t + sd * 0.7));

      this.wz += (-w02 * Math.sin(this.az) - 2 * this.zeta * w0 * this.wz + fz) * h;
      this.wx += (-w02 * Math.sin(this.ax) - 2 * this.zeta * w0 * this.wx + fx) * h;
      this.az += this.wz * h;
      this.ax += this.wx * h;

      // pointer: surface friction drags the ball along with the hand
      if (touch > 0) {
        const blend = Math.min(1, 7 * touch * h);
        // ball-centre velocity from the angular velocities
        this.wz += blend * (handVel.x / L - this.wz);
        this.wx -= blend * this.wx * 0.4; // gently resist swinging in depth
        // a hand dragged across the front spins the ball about its vertical axis
        const target = clamp(handVel.x / Math.max(1e-3, this.ballRadius), -9, 9);
        this.spin += Math.min(1, 5 * touch * h) * (target - this.spin);
      } else {
        // spin relaxes back to a lazy idle rotation
        this.spin += (this.idleSpin * (this.idleMotion > 0 ? 1 : 0) - this.spin) * Math.min(1, 0.9 * h);
      }
      this.yaw += this.spin * h;

      // hard stops so a violent swipe can't flip the ball over its chain
      const MAX = 0.6;
      if (Math.abs(this.az) > MAX) {
        this.az = Math.sign(this.az) * MAX;
        if (Math.sign(this.wz) === Math.sign(this.az)) this.wz *= -0.3;
      }
      if (Math.abs(this.ax) > MAX) {
        this.ax = Math.sign(this.ax) * MAX;
        if (Math.sign(this.wx) === Math.sign(this.ax)) this.wx *= -0.3;
      }
    }
    this.wasTouched = touch > 0;
  }

  /** A tap: kick sideways, away from the side that was tapped (offset = ballCentre.x - pointer.x, world units). */
  kick(offsetX: number, offsetZ = 0) {
    const sx = Math.sign(offsetX) || 1;
    const mag = clamp(Math.abs(offsetX) / Math.max(1e-3, this.ballRadius), 0.25, 1);
    this.wz += sx * (1.2 + 1.0 * mag);
    this.wx += -Math.sign(offsetZ || 0) * 0.4;
    this.spin += sx * (3 + 3 * mag);
  }

  get touched() {
    return this.wasTouched;
  }
}
