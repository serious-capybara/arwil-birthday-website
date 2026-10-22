// Headless sanity tests for src/three/physics.ts. Run with: npx tsx tools/physics.test.ts .
import { readFileSync } from 'node:fs';
import { BalloonSystem, SwingingPendulum, stringPoint, type BalloonSpec, type PointerRay, type V3 } from '../src/three/physics.ts';

const root = process.argv[2];
const glb = readFileSync(`${root}/public/models/colorful_balloons.glb`);
const jsonLen = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));

// Rebuild the balloon specs the same way the scene does (knot = node translation,
// centre = knot + 1.31 * local z axis, radius from the node scale).
const specs: BalloonSpec[] = [];
for (const n of gltf.nodes) {
  if (!n.matrix || !/^Sphere/.test(n.name)) continue;
  const m = n.matrix as number[];
  const knot = { x: m[12], y: m[13], z: m[14] };
  const zAxis = { x: m[8], y: m[9], z: m[10] };
  const sx = Math.hypot(m[0], m[1], m[2]);
  const center = { x: knot.x + zAxis.x * 1.31, y: knot.y + zAxis.y * 1.31, z: knot.z + zAxis.z * 1.31 };
  specs.push({ center, knot, radius: 1.05 * sx * 0.95 });
}
console.log('balloons:', specs.length, 'radius≈', specs[0].radius.toFixed(0));
const anchor: V3 = { x: 0, y: -1256, z: -100 };

let failed = 0;
const check = (name: string, ok: boolean, info = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${info}`);
  if (!ok) failed++;
};
const dist = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

// Ray from a camera 6000 units in front, aimed at a point (z-axis towards camera).
const rayAt = (x: number, y: number): PointerRay => {
  const origin = { x: 0, y: 0, z: 6000 };
  const target = { x, y, z: -50 };
  const d = { x: target.x - origin.x, y: target.y - origin.y, z: target.z - origin.z };
  const l = Math.hypot(d.x, d.y, d.z);
  return { origin, dir: { x: d.x / l, y: d.y / l, z: d.z / l }, active: true };
};

// 1. idle: stays near the authored pose, bobs a little, never NaN
{
  const sys = new BalloonSystem(specs, anchor);
  let maxOff = 0;
  let minOff = Infinity;
  for (let i = 0; i < 60 * 30; i++) {
    sys.step(1 / 60, null);
    for (const b of sys.bodies) {
      maxOff = Math.max(maxOff, dist(b.pos, b.restCenter));
      if (!Number.isFinite(b.pos.x + b.pos.y + b.pos.z)) throw new Error('NaN');
    }
    if (i > 60) for (const b of sys.bodies) minOff = Math.min(minOff, dist(b.pos, b.restCenter));
  }
  check('idle sway stays small', maxOff < 60, `max offset ${maxOff.toFixed(1)} units`);
  const moved = sys.bodies.some((b) => dist(b.pos, b.restCenter) > 3);
  check('idle sway is visible', moved);
}

// 2. start pose is not in collision (nothing pops apart on load)
{
  const sys = new BalloonSystem(specs, anchor);
  sys.idleMotion = 0;
  for (let i = 0; i < 120; i++) sys.step(1 / 60, null);
  const maxOff = Math.max(...sys.bodies.map((b) => dist(b.pos, b.restCenter)));
  check('authored pose is stable (no pop-apart)', maxOff < 1.5, `drift ${maxOff.toFixed(2)}`);
}

// 3. swiping the pointer across moves balloons, then they settle back
{
  const sys = new BalloonSystem(specs, anchor);
  sys.idleMotion = 0;
  const frontIdx = 0;
  const c = sys.bodies[frontIdx].restCenter;
  let peak = 0;
  let peakSpin = 0;
  for (let i = 0; i < 90; i++) {
    const x = c.x - 400 + (800 * i) / 90; // sweep left -> right across the balloon
    sys.step(1 / 60, rayAt(x, c.y));
    peak = Math.max(peak, ...sys.bodies.map((b) => dist(b.pos, b.restCenter)));
    peakSpin = Math.max(peakSpin, ...sys.bodies.map((b) => Math.hypot(b.angVel.x, b.angVel.y, b.angVel.z)));
  }
  check('swipe pushes balloons', peak > 40, `peak displacement ${peak.toFixed(0)} units`);
  check('swipe sets balloons spinning', peakSpin > 0.5, `peak spin ${peakSpin.toFixed(2)} rad/s`);
  check('displacement is bounded', peak <= 430);
  // pointer leaves
  for (let i = 0; i < 60 * 8; i++) sys.step(1 / 60, null);
  const settle = Math.max(...sys.bodies.map((b) => dist(b.pos, b.restCenter)));
  const speed = sys.maxSpeed();
  check('balloons settle back after pointer leaves', settle < 2 && speed < 2, `offset ${settle.toFixed(2)}, speed ${speed.toFixed(2)}`);
}

// 4. each balloon is independent: poking one moves it more than a far-away one
{
  const sys = new BalloonSystem(specs, anchor);
  sys.idleMotion = 0;
  // find the left-most and right-most balloons
  const sorted = [...sys.bodies.keys()].sort((a, b) => sys.bodies[a].restCenter.x - sys.bodies[b].restCenter.x);
  const L = sorted[0];
  const R = sorted[sorted.length - 1];
  let maxL = 0;
  let maxR = 0;
  for (let i = 0; i < 40; i++) {
    sys.step(1 / 60, rayAt(sys.bodies[L].restCenter.x + 20 * Math.sin(i / 3), sys.bodies[L].restCenter.y + 20 * Math.cos(i / 3)));
    maxL = Math.max(maxL, dist(sys.bodies[L].pos, sys.bodies[L].restCenter));
    maxR = Math.max(maxR, dist(sys.bodies[R].pos, sys.bodies[R].restCenter));
  }
  check('only the touched balloon reacts strongly', maxL > 3 * Math.max(maxR, 1), `touched ${maxL.toFixed(0)} vs far ${maxR.toFixed(0)}`);
}

// 5. tap bounces a balloon and bounces its neighbours (collisions transfer motion)
{
  const sys = new BalloonSystem(specs, anchor);
  sys.idleMotion = 0;
  const c = sys.bodies[0].restCenter;
  const hits = sys.tap(rayAt(c.x, c.y));
  check('tap hits at least one balloon', hits >= 1, `hits ${hits}`);
  let peak = 0;
  let touchedOthers = 0;
  void touchedOthers;
  for (let i = 0; i < 90; i++) {
    sys.step(1 / 60, null);
    peak = Math.max(peak, dist(sys.bodies[0].pos, sys.bodies[0].restCenter));
  }
  check('tap launches the balloon', peak > 30, `peak ${peak.toFixed(0)}`);
  // direct collision: shove balloon 0 at its nearest neighbour
  const sys2 = new BalloonSystem(specs, anchor);
  sys2.idleMotion = 0;
  let nn = 1;
  for (let k = 1; k < sys2.bodies.length; k++) if (dist(sys2.bodies[k].restCenter, c) < dist(sys2.bodies[nn].restCenter, c)) nn = k;
  const dir = { x: sys2.bodies[nn].restCenter.x - c.x, y: sys2.bodies[nn].restCenter.y - c.y, z: sys2.bodies[nn].restCenter.z - c.z };
  const dl = Math.hypot(dir.x, dir.y, dir.z);
  sys2.bodies[0].vel = { x: (dir.x / dl) * 700, y: (dir.y / dl) * 700, z: (dir.z / dl) * 700 };
  let nPeak = 0;
  let nSpin = 0;
  for (let i = 0; i < 90; i++) {
    sys2.step(1 / 60, null);
    nPeak = Math.max(nPeak, dist(sys2.bodies[nn].pos, sys2.bodies[nn].restCenter));
    const w = sys2.bodies[nn].angVel;
    nSpin = Math.max(nSpin, Math.hypot(w.x, w.y, w.z));
  }
  touchedOthers = nPeak;
  check('collisions pass motion on to the neighbour', nPeak > 10, `neighbour moved ${nPeak.toFixed(0)} units`);
  check('collisions transfer spin (friction)', nSpin > 0.2, `neighbour spin ${nSpin.toFixed(2)} rad/s`);
}

// 6. the string is never stretched beyond its length (rope), even when hammered
{
  const sys = new BalloonSystem(specs, anchor);
  let worst = 0;
  for (let i = 0; i < 60 * 6; i++) {
    const c = sys.bodies[i % sys.bodies.length].restCenter;
    if (i % 25 === 0) sys.tap(rayAt(c.x, c.y));
    sys.step(1 / 60, rayAt(c.x + 60 * Math.sin(i / 7), c.y + 60 * Math.cos(i / 5)));
    for (const b of sys.bodies) worst = Math.max(worst, dist(sys.knotWorld(b), anchor) - b.stringLength);
  }
  check('string never over-stretches', worst < 25, `worst overshoot ${worst.toFixed(1)} units`);
}

// 7. string curve passes through the control point
{
  const p = stringPoint({ x: 0, y: 0, z: 0 }, { x: 5, y: -7, z: 2 }, { x: 10, y: 20, z: 0 }, 0.5);
  check('string curve passes through its control point', Math.abs(p.x - 5) + Math.abs(p.y + 7) + Math.abs(p.z - 2) < 1e-9);
}

// 8. pendulum: idle sway is small but alive; a kick rings and decays
{
  const p = new SwingingPendulum({ length: 1.28, ballRadius: 0.67, seed: 1 });
  let maxA = 0;
  let minA = 0;
  for (let i = 0; i < 60 * 60; i++) {
    p.step(1 / 60);
    maxA = Math.max(maxA, p.az);
    minA = Math.min(minA, p.az);
  }
  const deg = (r: number) => (r * 180) / Math.PI;
  check('disco idle swing is a gentle sway', deg(maxA) > 1.5 && deg(maxA) < 8 && deg(minA) < -1.5, `range ${deg(minA).toFixed(1)}° … ${deg(maxA).toFixed(1)}°`);
  p.kick(0.3);
  let peak = 0;
  for (let i = 0; i < 60 * 2; i++) {
    p.step(1 / 60);
    peak = Math.max(peak, Math.abs(p.az));
  }
  check('disco kick swings visibly', deg(peak) > 8, `${deg(peak).toFixed(1)}°`);
  check('disco swing stays within limits', peak <= 0.6 + 1e-9);
  const q = new SwingingPendulum({ length: 1.28, ballRadius: 0.67, seed: 1 });
  q.idleMotion = 0;
  q.kick(0.3);
  for (let i = 0; i < 60 * 40; i++) q.step(1 / 60);
  check('disco swing damps out (reduced motion)', Math.abs(q.az) < 0.01 && Math.abs(q.wz) < 0.02, `az ${q.az.toFixed(4)}`);
  // touching with the hand stops the spin
  const r = new SwingingPendulum({ length: 1.28, ballRadius: 0.67 });
  for (let i = 0; i < 90; i++) r.step(1 / 60, 1, { x: 0, y: 0 });
  check('holding the disco ball stops its spin', Math.abs(r.spin) < 0.05, `spin ${r.spin.toFixed(3)}`);
  for (let i = 0; i < 60 * 8; i++) r.step(1 / 60, 0);
  check('spin resumes after letting go', r.spin > 0.3, `spin ${r.spin.toFixed(2)}`);
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
