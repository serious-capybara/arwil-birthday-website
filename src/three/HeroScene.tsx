import {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BalloonSystem,
  SwingingPendulum,
  stringPoint,
  type BalloonSpec,
  type PointerRay,
  type V3,
} from './physics';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Light tap feedback on devices that support it (never when the user prefers reduced motion). */
function haptic(reduced: boolean) {
  if (reduced) return;
  try {
    navigator.vibrate?.(8);
  } catch {
    /* not supported */
  }
}

// ──────────────────────────────────────────────────────────────
// Built-in Studio Environment (Zero network dependencies)
// Provides realistic reflections for chrome, silver, and metals
// ──────────────────────────────────────────────────────────────
function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const room = new RoomEnvironment();
    const envTexture = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envTexture;

    return () => {
      scene.environment = null;
      envTexture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

// ──────────────────────────────────────────────────────────────
// Pointer rig: one shared source of truth for hover / touch / tap
// ──────────────────────────────────────────────────────────────
interface PointerState {
  ndc: THREE.Vector2;
  active: boolean;
  /** Incremented on every tap so each object can react exactly once. */
  tapId: number;
  /** Objects currently under the pointer (drives the cursor). */
  hovers: Set<object>;
}

const PointerContext = createContext<MutableRefObject<PointerState> | null>(null);

function PointerRig({ children }: { children: ReactNode }) {
  const gl = useThree((s) => s.gl);
  const state = useRef<PointerState>({ ndc: new THREE.Vector2(), active: false, tapId: 0, hovers: new Set() });

  useEffect(() => {
    const el = gl.domElement;
    const st = state.current;
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const setNdc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      st.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    const onMove = (e: PointerEvent) => {
      clearTimeout(releaseTimer);
      setNdc(e);
      st.active = true;
    };
    const onDown = (e: PointerEvent) => {
      clearTimeout(releaseTimer);
      setNdc(e);
      st.active = true;
      st.tapId++;
    };
    const onUp = (e: PointerEvent) => {
      // a lifted finger is no longer "hovering" (a mouse still is). The short delay makes sure
      // a very quick tap is seen by at least a few frames before the pointer is released.
      if (e.pointerType !== 'mouse') {
        clearTimeout(releaseTimer);
        releaseTimer = setTimeout(() => {
          st.active = false;
        }, 90);
      }
    };
    const onLeave = () => {
      clearTimeout(releaseTimer);
      st.active = false;
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onLeave);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onLeave);
      el.removeEventListener('pointerleave', onLeave);
      clearTimeout(releaseTimer);
      el.style.cursor = '';
    };
  }, [gl]);

  // One place owns the cursor: pointer while hovering a balloon or disco ball
  useFrame(() => {
    const want = state.current.hovers.size > 0 ? 'pointer' : '';
    if (gl.domElement.style.cursor !== want) gl.domElement.style.cursor = want;
  });

  return <PointerContext.Provider value={state}>{children}</PointerContext.Provider>;
}

function usePointerState(): MutableRefObject<PointerState> {
  const ctx = useContext(PointerContext);
  const fallback = useRef<PointerState>({ ndc: new THREE.Vector2(), active: false, tapId: 0, hovers: new Set() });
  return ctx ?? fallback;
}

/** Shared scratch objects (module level so nothing allocates per frame). */
const _raycaster = new THREE.Raycaster();
const _inv = new THREE.Matrix4();
const _o = new THREE.Vector3();
const _d = new THREE.Vector3();

// ──────────────────────────────────────────────────────────────
// Metallic Purple & Pink Celebratory Balloon Palette
// ──────────────────────────────────────────────────────────────
const METALLIC_BALLOON_PALETTE = [
  '#8A2BE2', // Deep royal purple
  '#C026D3', // Radiant metallic magenta
  '#A855F7', // Electric orchid
  '#D946EF', // Vibrant party fuchsia
  '#9333EA', // Metallic amethyst
  '#EC4899', // Hot metallic pink
  '#7C3AED', // Vivid violet
  '#F472B6', // Shimmering rose pink
];

// Pre-defined balloon indices for 1 to 3 transparent refractive balloons per bouquet
const TRANSPARENT_SELECTIONS: number[][] = [
  [2, 7], // Group 0: 2 transparent balloons
  [4], // Group 1: 1 transparent balloon
  [1, 6, 9], // Group 2: 3 transparent balloons
  [3, 8], // Group 3: 2 transparent balloons
];

// Offset the original model uses so the bouquet pivots about its middle.
const BOUQUET_OFFSET = new THREE.Vector3(-18.6, 361.5, 150.8);
// Where all strings are tied together (bottom of the original cords), used if it can't be measured.
const FALLBACK_ANCHOR = new THREE.Vector3(0, -1256, -100);

// ──────────────────────────────────────────────────────────────
// A thin ribbon that follows the string physics
// ──────────────────────────────────────────────────────────────
const STRING_SEGMENTS = 14;
const STRING_SIDES = 3;
const STRING_RADIUS = 2.1; // model units

class StringRibbon {
  readonly mesh: THREE.Mesh;
  private readonly positions: Float32Array;
  private readonly normals: Float32Array;
  private readonly posAttr: THREE.BufferAttribute;
  private readonly nrmAttr: THREE.BufferAttribute;

  constructor(material: THREE.Material) {
    const rings = STRING_SEGMENTS + 1;
    this.positions = new Float32Array(rings * STRING_SIDES * 3);
    this.normals = new Float32Array(rings * STRING_SIDES * 3);
    const index: number[] = [];
    for (let k = 0; k < STRING_SEGMENTS; k++) {
      for (let r = 0; r < STRING_SIDES; r++) {
        const a = k * STRING_SIDES + r;
        const b = k * STRING_SIDES + ((r + 1) % STRING_SIDES);
        const c = (k + 1) * STRING_SIDES + r;
        const d = (k + 1) * STRING_SIDES + ((r + 1) % STRING_SIDES);
        index.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.nrmAttr = new THREE.BufferAttribute(this.normals, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.nrmAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('normal', this.nrmAttr);
    geo.setIndex(index);
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.frustumCulled = false; // the shape changes every frame
  }

  update(anchor: V3, through: V3, knot: V3) {
    const P: V3[] = [];
    for (let k = 0; k <= STRING_SEGMENTS; k++) P.push(stringPoint(anchor, through, knot, k / STRING_SEGMENTS));
    for (let k = 0; k <= STRING_SEGMENTS; k++) {
      const prev = P[Math.max(0, k - 1)];
      const next = P[Math.min(STRING_SEGMENTS, k + 1)];
      let tx = next.x - prev.x;
      let ty = next.y - prev.y;
      let tz = next.z - prev.z;
      const tl = Math.hypot(tx, ty, tz) || 1;
      tx /= tl;
      ty /= tl;
      tz /= tl;
      // N = normalize(T × ref), B = T × N
      let rx = 0,
        ry = 0,
        rz = 1;
      if (Math.abs(tz) > 0.9) {
        rx = 1;
        rz = 0;
      }
      let nx = ty * rz - tz * ry;
      let ny = tz * rx - tx * rz;
      let nz = tx * ry - ty * rx;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl;
      ny /= nl;
      nz /= nl;
      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;
      for (let r = 0; r < STRING_SIDES; r++) {
        const phi = (r / STRING_SIDES) * Math.PI * 2 + Math.PI / 6;
        const c = Math.cos(phi);
        const s = Math.sin(phi);
        const ox = nx * c + bx * s;
        const oy = ny * c + by * s;
        const oz = nz * c + bz * s;
        const i = (k * STRING_SIDES + r) * 3;
        this.positions[i] = P[k].x + ox * STRING_RADIUS;
        this.positions[i + 1] = P[k].y + oy * STRING_RADIUS;
        this.positions[i + 2] = P[k].z + oz * STRING_RADIUS;
        this.normals[i] = ox;
        this.normals[i + 1] = oy;
        this.normals[i + 2] = oz;
      }
    }
    this.posAttr.needsUpdate = true;
    this.nrmAttr.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
  }
}

// ──────────────────────────────────────────────────────────────
// Build a bouquet where EVERY balloon is its own physics body
// ──────────────────────────────────────────────────────────────
interface Bouquet {
  root: THREE.Object3D;
  system: BalloonSystem;
  bodies: THREE.Group[];
  ribbons: StringRibbon[];
  dispose: () => void;
}

function buildBouquet(source: THREE.Object3D, groupIndex: number): Bouquet {
  const root = source.clone(true);
  root.updateMatrixWorld(true);

  const spheres: THREE.Mesh[] = [];
  const laces: THREE.Mesh[] = [];
  const cords: THREE.Mesh[] = [];
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const name = child.name.toLowerCase();
    if (name.includes('sphere')) spheres.push(child);
    else if (name.includes('lace')) laces.push(child);
    else if (name.includes('cord')) cords.push(child);
  });

  const transparentList = TRANSPARENT_SELECTIONS[groupIndex % TRANSPARENT_SELECTIONS.length];
  const disposables: THREE.Material[] = [];

  // ── materials (same look as before) ──
  spheres.forEach((mesh, balloonIdx) => {
    mesh.castShadow = true;
    let mat: THREE.Material;
    if (transparentList.includes(balloonIdx)) {
      mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#FAF5FF'),
        transmission: 0.94,
        opacity: 1.0,
        transparent: true,
        roughness: 0.06,
        ior: 1.28,
        thickness: 2.5,
        metalness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        specularIntensity: 1.0,
        specularColor: new THREE.Color('#FFFFFF'),
      });
    } else {
      const hex = METALLIC_BALLOON_PALETTE[(balloonIdx + groupIndex * 2) % METALLIC_BALLOON_PALETTE.length];
      mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), metalness: 0.85, roughness: 0.14 });
    }
    mesh.material = mat;
    disposables.push(mat);
  });
  const laceMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#D946EF'), metalness: 0.75, roughness: 0.2 });
  disposables.push(laceMat);
  laces.forEach((m) => {
    m.material = laceMat;
  });
  const stringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#EFE3F3'),
    metalness: 0.5,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  disposables.push(stringMat);

  // ── measure every balloon (before anything is moved) ──
  const pieceOf = (m: THREE.Mesh): THREE.Object3D => (m.parent && m.parent !== root ? m.parent : m);
  const toParentMatrix = (m: THREE.Mesh) => {
    const piece = pieceOf(m);
    piece.updateMatrix();
    m.updateMatrix();
    return piece === m ? m.matrix.clone() : new THREE.Matrix4().multiplyMatrices(piece.matrix, m.matrix);
  };

  const measured = spheres.map((mesh) => {
    mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox as THREE.Box3;
    const m = toParentMatrix(mesh);
    const center = bb.getCenter(new THREE.Vector3()).applyMatrix4(m);
    const knot = new THREE.Vector3().setFromMatrixPosition(pieceOf(mesh).matrix);
    const size = bb.getSize(new THREE.Vector3());
    const sc = new THREE.Vector3().setFromMatrixScale(m);
    const radius = 0.5 * Math.min(size.x * sc.x, size.y * sc.y) * 0.95;
    return { mesh, center, knot, radius };
  });

  // ── where the strings are tied together: lowest point of the original cords ──
  let anchorV = FALLBACK_ANCHOR.clone();
  if (cords.length > 0) {
    const pts: THREE.Vector3[] = [];
    let minY = Infinity;
    cords.forEach((c) => {
      const attr = c.geometry.getAttribute('position');
      const m = toParentMatrix(c);
      for (let i = 0; i < attr.count; i++) {
        const p = new THREE.Vector3().fromBufferAttribute(attr, i).applyMatrix4(m);
        pts.push(p);
        minY = Math.min(minY, p.y);
      }
    });
    const low = pts.filter((p) => p.y < minY + 10);
    if (low.length > 0) {
      anchorV = low.reduce((acc, p) => acc.add(p), new THREE.Vector3()).multiplyScalar(1 / low.length);
    }
  }
  // the old cords are replaced by physical strings
  cords.forEach((c) => {
    c.visible = false;
  });

  // ── one rigid body (Group) per balloon; its bow goes with it ──
  const container = spheres.length > 0 ? pieceOf(spheres[0]).parent ?? root : root;
  const bodies: THREE.Group[] = measured.map((m) => {
    const body = new THREE.Group();
    body.name = 'balloon-body';
    body.position.copy(m.center);
    container.add(body);
    return body;
  });

  const laceKnots = laces.map((l) => new THREE.Vector3().setFromMatrixPosition(pieceOf(l).matrix));
  measured.forEach((m, i) => {
    const piece = pieceOf(m.mesh);
    piece.position.sub(m.center);
    bodies[i].add(piece);
  });
  laces.forEach((lace, li) => {
    let best = 0;
    let bestD = Infinity;
    measured.forEach((m, i) => {
      const d = m.knot.distanceToSquared(laceKnots[li]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const piece = pieceOf(lace);
    piece.position.sub(measured[best].center);
    bodies[best].add(piece);
  });

  // ── physics + strings ──
  const specs: BalloonSpec[] = measured.map((m, i) => ({
    center: { x: m.center.x, y: m.center.y, z: m.center.z },
    knot: { x: m.knot.x, y: m.knot.y, z: m.knot.z },
    radius: m.radius,
    mass: 0.92 + (i % 3) * 0.08,
  }));
  const system = new BalloonSystem(specs, { x: anchorV.x, y: anchorV.y, z: anchorV.z });

  const ribbons = measured.map(() => {
    const r = new StringRibbon(stringMat);
    container.add(r.mesh);
    return r;
  });

  return {
    root,
    system,
    bodies,
    ribbons,
    dispose: () => {
      ribbons.forEach((r) => r.dispose());
      disposables.forEach((m) => m.dispose());
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Balloon bouquet component
// ──────────────────────────────────────────────────────────────
interface BalloonProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  groupIndex?: number;
}

function BalloonModel({ position = [0, 0, 0], scale = 0.0012, rotation = [0, 0, 0], groupIndex = 0 }: BalloonProps) {
  const { scene } = useGLTF('/models/colorful_balloons.glb');
  const groupRef = useRef<THREE.Group>(null);
  const pointer = usePointerState();
  const reduced = usePrefersReducedMotion();
  const lastTap = useRef(pointer.current.tapId);
  const claim = useRef({});

  const bouquet = useMemo(() => buildBouquet(scene, groupIndex), [scene, groupIndex]);
  useEffect(() => () => bouquet.dispose(), [bouquet]);

  // reusable ray handed to the physics each frame
  const ray = useMemo<PointerRay>(
    () => ({ origin: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: 0, z: -1 }, active: false }),
    []
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const { system, bodies, ribbons } = bouquet;
    system.idleMotion = reduced ? 0 : 1;

    // Pointer → ray in the bouquet's own (model) space
    const ps = pointer.current;
    ray.active = ps.active;
    if (ps.active) {
      _raycaster.setFromCamera(ps.ndc, state.camera);
      group.updateMatrixWorld();
      _inv.copy(group.matrixWorld).invert();
      _o.copy(_raycaster.ray.origin).applyMatrix4(_inv).sub(BOUQUET_OFFSET);
      _d.copy(_raycaster.ray.direction).transformDirection(_inv);
      ray.origin.x = _o.x;
      ray.origin.y = _o.y;
      ray.origin.z = _o.z;
      ray.dir.x = _d.x;
      ray.dir.y = _d.y;
      ray.dir.z = _d.z;
    }

    // A tap bounces whatever is under the pointer
    if (ps.tapId !== lastTap.current) {
      lastTap.current = ps.tapId;
      if (ray.active && system.tap(ray) > 0) haptic(reduced);
    }

    system.step(delta, ray);

    // Hover affordance
    if (system.hover >= 0) ps.hovers.add(claim.current);
    else ps.hovers.delete(claim.current);

    // Apply every balloon's own pose
    system.bodies.forEach((b, i) => {
      const o = bodies[i];
      o.position.set(b.pos.x, b.pos.y, b.pos.z);
      o.quaternion.set(b.rot.x, b.rot.y, b.rot.z, b.rot.w);
      o.scale.setScalar(1 + b.puff);
    });
    system.bodies.forEach((b, i) => {
      ribbons[i].update(system.anchor, system.strings[i].ctrl, system.knotWorld(b));
    });

    // The whole bouquet drifts a touch, like air in the room (skipped for reduced motion)
    if (!reduced) {
      const t = system.time;
      group.rotation.y = rotation[1] + Math.sin(t * 0.5 + position[0]) * 0.04;
      group.position.y = position[1] + Math.sin(t * 0.9 + position[0]) * 0.015;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={rotation}>
      <primitive object={bouquet.root} position={BOUQUET_OFFSET} />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────
// Disco ball: chain-hung pendulum + mirror-tile spin
// ──────────────────────────────────────────────────────────────
interface DiscoRig {
  root: THREE.Object3D;
  center: THREE.Vector3;
  radius: number;
  /** Distance from the ball centre up to where the chain is hung, in model units. */
  hang: number;
  disposables: THREE.Material[];
}

function buildDisco(source: THREE.Object3D): DiscoRig {
  const c = source.clone(true);
  c.updateMatrixWorld(true);

  const mirrorTileMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#F8F8F8'),
    metalness: 1.0,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 1.0,
    envMapIntensity: 2.0,
  });
  // bottom 12% tiles get a soft pink tint
  const mirrorTilePinkMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#FFB8D4'),
    metalness: 1.0,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 1.0,
    envMapIntensity: 1.8,
  });
  const coreMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#111118'), roughness: 0.9, metalness: 0.0 });
  const chromeMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#D8D8E0'), metalness: 0.95, roughness: 0.12 });

  const reflective: { mesh: THREE.Mesh; centerY: number }[] = [];
  const baseMeshes: THREE.Mesh[] = [];
  let chainTop = -Infinity;
  const tmpBox = new THREE.Box3();

  c.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const name = child.name.toLowerCase();
    if (name.includes('reflective')) {
      tmpBox.setFromObject(child);
      reflective.push({ mesh: child, centerY: tmpBox.getCenter(new THREE.Vector3()).y });
    } else if (name.includes('base') || name.includes('discob')) {
      child.material = coreMat;
      baseMeshes.push(child);
    } else {
      child.material = chromeMat;
      if (name.includes('chain')) {
        tmpBox.setFromObject(child);
        chainTop = Math.max(chainTop, tmpBox.max.y);
      }
    }
  });

  if (reflective.length > 0) {
    const ys = reflective.map((r) => r.centerY);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const threshold = minY + (maxY - minY) * 0.12;
    reflective.forEach((r) => {
      r.mesh.material = r.centerY <= threshold ? mirrorTilePinkMat : mirrorTileMat;
    });
  }

  // Ball centre + radius from the actual geometry
  const ballBox = new THREE.Box3();
  if (baseMeshes.length > 0) ballBox.setFromObject(baseMeshes[0]);
  else ballBox.setFromObject(c);
  const center = ballBox.getCenter(new THREE.Vector3());
  const size = ballBox.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.z) / 2;
  const hang = Number.isFinite(chainTop) && chainTop > center.y ? chainTop - center.y : radius * 2.2;

  return {
    root: c,
    center,
    radius,
    hang,
    disposables: [mirrorTileMat, mirrorTilePinkMat, coreMat, chromeMat],
  };
}

interface DiscoProps {
  position?: [number, number, number];
  scale?: number;
  /** Idle spin per frame at 60 fps (sign = direction), as in the original design. */
  rotationSpeed?: number;
  /** Interactive (hover / tap). Off when the ball sits behind other UI. */
  interactive?: boolean;
}

function DiscoModel({ position = [0, 0, 0], scale = 0.055, rotationSpeed = 0.008, interactive = true }: DiscoProps) {
  const { scene } = useGLTF('/models/free_realistic_disco_ball.glb');
  const pivotRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Group>(null);
  const pointer = usePointerState();
  const reduced = usePrefersReducedMotion();
  const lastTap = useRef(pointer.current.tapId);
  const prevHand = useRef<THREE.Vector3 | null>(null);
  const hand = useRef(new THREE.Vector2());
  const claim = useRef({});

  const rig = useMemo(() => buildDisco(scene), [scene]);
  useEffect(() => () => rig.disposables.forEach((m) => m.dispose()), [rig]);

  const hangWorld = rig.hang * scale;
  const pendulum = useMemo(
    () =>
      new SwingingPendulum({
        length: hangWorld,
        ballRadius: rig.radius * scale,
        idleSpin: rotationSpeed * 60,
        // stagger the swing of different balls by where they hang
        seed: position[0] * 1.3 + position[1] * 0.7 + 1,
      }),
    [hangWorld, rig.radius, scale, rotationSpeed]
  );

  const centerWorld = useMemo(() => new THREE.Vector3(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const pivot = pivotRef.current;
    const spin = spinRef.current;
    const ball = ballRef.current;
    if (!pivot || !spin || !ball) return;
    pendulum.idleMotion = reduced ? 0 : 1;

    // Pointer vs the ball (a sphere in world space)
    let touch = 0;
    let offsetX = 0;
    const ps = pointer.current;
    if (interactive && ps.active) {
      _raycaster.setFromCamera(ps.ndc, state.camera);
      const ray = _raycaster.ray;
      ball.getWorldPosition(centerWorld);
      const t = Math.max(0, hit.copy(centerWorld).sub(ray.origin).dot(ray.direction));
      // the ray's point at the ball's depth
      const p = _d.copy(ray.direction).multiplyScalar(t).add(ray.origin);
      const dist = p.distanceTo(centerWorld);
      const R = pendulum.ballRadius;
      touch = THREE.MathUtils.smoothstep(1 - dist / (R * 1.1), 0, 1);
      offsetX = centerWorld.x - p.x;

      // pointer velocity at the ball's depth
      if (prevHand.current) {
        const rawX = (p.x - prevHand.current.x) / Math.max(delta, 1e-3);
        const rawY = (p.y - prevHand.current.y) / Math.max(delta, 1e-3);
        const a = 1 - Math.exp(-delta * 22);
        hand.current.x += (THREE.MathUtils.clamp(rawX, -9, 9) - hand.current.x) * a;
        hand.current.y += (THREE.MathUtils.clamp(rawY, -9, 9) - hand.current.y) * a;
      } else {
        hand.current.set(0, 0);
      }
      if (!prevHand.current) prevHand.current = new THREE.Vector3();
      prevHand.current.copy(p);

      if (ps.tapId !== lastTap.current) {
        lastTap.current = ps.tapId;
        if (dist < R * 1.15) {
          pendulum.kick(offsetX);
          haptic(reduced);
        }
      }
    } else {
      prevHand.current = null;
      hand.current.set(0, 0);
      lastTap.current = ps.tapId;
    }

    if (touch > 0.02) ps.hovers.add(claim.current);
    else ps.hovers.delete(claim.current);

    pendulum.step(delta, touch, hand.current);

    // swing about the top of the chain, spin about the ball's own axis
    pivot.rotation.set(pendulum.ax, 0, pendulum.az);
    spin.rotation.y = pendulum.yaw;
  });

  const lightY = rig.center.y - rig.radius * 1.25;

  return (
    <group ref={pivotRef} position={[position[0], position[1] + hangWorld, position[2]]}>
      <group ref={ballRef} position={[0, -hangWorld, 0]}>
        <group scale={scale}>
          <group ref={spinRef}>
            <primitive object={rig.root} position={[-rig.center.x, -rig.center.y, -rig.center.z]} />
          </group>
          {/* Dedicated point light below the ball to illuminate the soft-pink bottom tiles */}
          <pointLight position={[0, lightY - rig.center.y, 0]} intensity={3.5} color="#FF85A2" distance={12} />
        </group>
      </group>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────
// Responsive Layout for Hero (Desktop vs Mobile)
// ──────────────────────────────────────────────────────────────
function ResponsiveHeroElements() {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5.2;

  if (isMobile) {
    // ──────── MOBILE VIEW ────────
    const leftDiscoX = -viewport.width * 0.4;
    const leftDiscoY = viewport.height * 0.43;
    const rightDiscoX = viewport.width * 0.38;
    const rightDiscoY = viewport.height * 0.45;

    const leftBalloonsX = -viewport.width * 0.36;
    const leftBalloonsY = -viewport.height * 0.36;
    const rightBalloonsX = viewport.width * 0.36;
    const rightBalloonsY = -viewport.height * 0.36;

    return (
      <>
        <DiscoModel position={[leftDiscoX, leftDiscoY, 0.2]} scale={0.062} rotationSpeed={0.007} />
        <DiscoModel position={[rightDiscoX, rightDiscoY, -0.1]} scale={0.04} rotationSpeed={-0.006} />

        <BalloonModel position={[leftBalloonsX, leftBalloonsY, 0.3]} scale={0.00115} rotation={[0, 0.2, 0.1]} groupIndex={0} />
        <BalloonModel position={[rightBalloonsX, rightBalloonsY, 0.3]} scale={0.00115} rotation={[0, -0.2, -0.1]} groupIndex={1} />
      </>
    );
  }

  // ──────── DESKTOP VIEW ────────
  return (
    <>
      <DiscoModel position={[-viewport.width * 0.27, viewport.height * 0.38, 0]} scale={0.072} rotationSpeed={0.007} />
      <DiscoModel position={[viewport.width * 0.15, viewport.height * 0.44, -0.2]} scale={0.044} rotationSpeed={-0.005} />

      <BalloonModel
        position={[-viewport.width * 0.42, viewport.height * 0.14, 0.2]}
        scale={0.0013}
        rotation={[0, 0.3, 0.08]}
        groupIndex={0}
      />
      <BalloonModel
        position={[-viewport.width * 0.27, -viewport.height * 0.3, 0.4]}
        scale={0.00135}
        rotation={[0, 0.15, 0.05]}
        groupIndex={1}
      />
      <BalloonModel
        position={[viewport.width * 0.38, viewport.height * 0.28, 0.2]}
        scale={0.0013}
        rotation={[0, -0.3, -0.08]}
        groupIndex={2}
      />
      <BalloonModel
        position={[viewport.width * 0.23, -viewport.height * 0.28, 0.4]}
        scale={0.00135}
        rotation={[0, -0.15, -0.05]}
        groupIndex={3}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Hero Scene Canvas
// ──────────────────────────────────────────────────────────────
interface HeroSceneProps {
  className?: string;
  isSingleBallTop?: boolean; // For the centred disco ball above the phone
}

export function HeroScene({ className, isSingleBallTop = false }: HeroSceneProps) {
  // Stop rendering while the scene is scrolled out of view (saves battery and GPU)
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={className ?? 'absolute inset-0 pointer-events-auto'}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        frameloop={visible ? 'always' : 'never'}
        style={{ touchAction: 'pan-y' }}
        aria-hidden="true"
      >
        <Suspense fallback={null}>
          <PointerRig>
            {/* Real-time Studio Environment for gleaming silver and metallic reflections */}
            <StudioEnvironment />

            {/* Studio Lights */}
            <ambientLight intensity={1.2} />
            <directionalLight position={[6, 9, 6]} intensity={3.0} color="#FFFFFF" />
            <directionalLight position={[-6, 5, -2]} intensity={1.8} color="#FCE7F3" />
            <pointLight position={[-4, 4, 3]} intensity={2.5} color="#FFAEC9" />
            <pointLight position={[4, 4, 3]} intensity={2.5} color="#D946EF" />
            <pointLight position={[0, -2, 2]} intensity={1.8} color="#FF85A2" />

            {isSingleBallTop ? (
              // Centred top disco ball (sits above the phone; the phone owns the pointer there)
              <DiscoModel position={[0, 0.3, 0]} scale={0.055} rotationSpeed={0.012} interactive={false} />
            ) : (
              // Two swinging disco balls and interactive physics balloons
              <ResponsiveHeroElements />
            )}
          </PointerRig>
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/colorful_balloons.glb');
useGLTF.preload('/models/free_realistic_disco_ball.glb');
