import { Suspense, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

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
// Highly Metallic Purple & Pink Celebratory Balloon Palette
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
  [2, 7],       // Group 0: 2 transparent balloons
  [4],          // Group 1: 1 transparent balloon
  [1, 6, 9],    // Group 2: 3 transparent balloons
  [3, 8],       // Group 3: 2 transparent balloons
];

// ──────────────────────────────────────────────────────────────
// Individual Balloon Physics Particle
// ──────────────────────────────────────────────────────────────
interface BalloonParticle {
  mesh: THREE.Mesh;
  restPos: THREE.Vector3;       // Original mesh position in model space (from GLB)
  centerOffset: THREE.Vector3;  // Geometric center of bounding box (for collision)
  radialDir: THREE.Vector3;     // Direction pointing outward from cluster center
  disp: THREE.Vector3;          // Current physics displacement from rest (starts at 0)
  vel: THREE.Vector3;           // Velocity vector
  radius: number;               // Collision sphere radius in model units
  mass: number;
  floatFreq: number;            // Independent helium float frequency
  floatPhase: number;           // Independent phase offset
  floatAmp: number;             // Independent float amplitude
}

interface BalloonProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  groupIndex?: number;
}

function BalloonModel({
  position = [0, 0, 0],
  scale = 0.0012,
  rotation = [0, 0, 0],
  groupIndex = 0,
}: BalloonProps) {
  const { scene } = useGLTF('/models/colorful_balloons.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Group-level interactive swaying
  const groupOffset = useRef({ x: 0, y: 0 });
  const groupVel = useRef({ x: 0, y: 0 });
  const groupTilt = useRef({ z: 0 });
  const groupTiltVel = useRef({ z: 0 });

  // Cursor tracking in local coordinates
  const pointerPos = useRef<THREE.Vector3 | null>(null);
  const isPointerActive = useRef(false);

  // Array of 12 independent balloon physics particles
  const particlesRef = useRef<BalloonParticle[]>([]);

  // Clone scene and setup materials + physics particles
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    let sphereCount = 0;
    const particles: BalloonParticle[] = [];

    const transparentList =
      TRANSPARENT_SELECTIONS[groupIndex % TRANSPARENT_SELECTIONS.length];

    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        child.castShadow = true;

        if (name.includes('sphere')) {
          const balloonIdx = sphereCount++;
          const isTransparent = transparentList.includes(balloonIdx);

          if (isTransparent) {
            // Transparent balloon with realistic physical refraction / defraction
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#FAF5FF'),
              transmission: 0.94,
              opacity: 1.0,
              transparent: true,
              roughness: 0.06,
              ior: 1.28, // Physical index of refraction for crisp light deflection
              thickness: 2.5,
              metalness: 0.04,
              clearcoat: 1.0,
              clearcoatRoughness: 0.08,
              specularIntensity: 1.0,
              specularColor: new THREE.Color('#FFFFFF'),
            });
          } else {
            // Highly metallic foil finish
            const hex = METALLIC_BALLOON_PALETTE[(balloonIdx + groupIndex * 2) % METALLIC_BALLOON_PALETTE.length];
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(hex),
              metalness: 0.85, // Gleaming metallic foil sheen
              roughness: 0.14, // Sharp glossy specular reflections
            });
          }

          // Store the balloon's ORIGINAL position in model space (crucial for independent physics!)
          // Each balloon in the GLB has a unique position — we must preserve and offset from it.
          const restPos = child.position.clone();

          // Geometric bounding box center (for collision detection)
          const box = new THREE.Box3().setFromObject(child);
          const center = new THREE.Vector3();
          box.getCenter(center);

          // Outward radial direction from cluster center (approximate center: x=0, y=361, z=150)
          const radial = new THREE.Vector3(
            center.x,
            center.y - 361,
            center.z - 150
          ).normalize();

          particles.push({
            mesh: child,
            restPos,
            centerOffset: center,
            radialDir: radial,
            disp: new THREE.Vector3(0, 0, 0),
            vel: new THREE.Vector3(0, 0, 0),
            radius: 105,
            mass: 0.9 + (balloonIdx % 3) * 0.15,
            floatFreq: 1.4 + (balloonIdx % 4) * 0.25,
            floatPhase: balloonIdx * 0.85 + groupIndex * 1.5,
            floatAmp: 6.0 + (balloonIdx % 3) * 2.5,
          });
        } else if (name.includes('cord')) {
          // Delicate metallic silver-lilac string
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#E2D4E8'),
            metalness: 0.7,
            roughness: 0.25,
          });
        } else if (name.includes('lace')) {
          // Metallic fuchsia ribbon bow
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#D946EF'),
            metalness: 0.75,
            roughness: 0.2,
          });
        }
      }
    });

    particlesRef.current = particles;
    return c;
  }, [scene, groupIndex]);

  // Physics Simulation Step (60 FPS Verlet/Euler integration with elastic collisions)
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.033);
    const time = state.clock.elapsedTime;
    const particles = particlesRef.current;

    // ──────────────────────────────────────────────────────────
    // 1. Group-level Sway Physics (Natural pendulum + wind recoil)
    // ──────────────────────────────────────────────────────────
    const naturalGroupSway = Math.sin(time * 0.5 + position[0]) * 0.05;
    const naturalGroupFloat = Math.sin(time * 0.9 + position[0]) * 0.02;

    // Spring group offset back to 0
    groupVel.current.x += (0 - groupOffset.current.x) * 12.0 * dt;
    groupVel.current.x *= Math.pow(0.85, dt * 60);
    groupOffset.current.x += groupVel.current.x * dt;

    groupTiltVel.current.z += (0 - groupTilt.current.z) * 14.0 * dt;
    groupTiltVel.current.z *= Math.pow(0.85, dt * 60);
    groupTilt.current.z += groupTiltVel.current.z * dt;

    groupRef.current.position.x = position[0] + groupOffset.current.x;
    groupRef.current.position.y = position[1] + naturalGroupFloat;
    groupRef.current.position.z = position[2];
    groupRef.current.rotation.y = rotation[1] + naturalGroupSway;
    groupRef.current.rotation.z = rotation[2] + groupTilt.current.z;

    // ──────────────────────────────────────────────────────────
    // 2. Individual Balloon Particle Physics & Collisions
    // ──────────────────────────────────────────────────────────
    const cursor = pointerPos.current;

    for (let i = 0; i < particles.length; i++) {
      const b = particles[i];

      // A) Independent Helium Buoyancy Bobbing (each balloon has unique phase/freq)
      const floatY = Math.sin(time * b.floatFreq + b.floatPhase) * b.floatAmp;
      const targetRestY = floatY;

      // B) Tether Spring Force (Hooke's Law pulling balloon back to its rest position)
      const springX = (0 - b.disp.x) * 16.0;
      const springY = (targetRestY - b.disp.y) * 16.0;
      const springZ = (0 - b.disp.z) * 16.0;

      b.vel.x += (springX / b.mass) * dt;
      b.vel.y += (springY / b.mass) * dt;
      b.vel.z += (springZ / b.mass) * dt;

      // C) Cursor Interaction Force (Distance-based repulsion & directional push)
      if (cursor && isPointerActive.current) {
        // Current 3D position of balloon = its rest world pos + current displacement
        const curBalloonPos = b.restPos.clone().add(b.disp);
        const diff = curBalloonPos.clone().sub(cursor);
        const dist = diff.length();

        // Cursor push radius (~220 model units)
        const pushRadius = 240;
        if (dist < pushRadius && dist > 0.001) {
          const pushFactor = (1 - dist / pushRadius);
          const pushNorm = diff.normalize();

          // Repel directly away from the pointer
          b.vel.addScaledVector(pushNorm, pushFactor * 650 * dt);

          // Also push along natural outward radial direction
          b.vel.addScaledVector(b.radialDir, pushFactor * 350 * dt);
        }
      }

      // D) Air Drag & Damping
      b.vel.multiplyScalar(Math.pow(0.88, dt * 60));

      // E) Integrate Velocity to Displacement
      b.disp.addScaledVector(b.vel, dt);
    }

    // ──────────────────────────────────────────────────────────
    // 3. Inter-Balloon Elastic Collision Resolution
    // ──────────────────────────────────────────────────────────
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const b1 = particles[i];
        const b2 = particles[j];

        // Use rest position + displacement for accurate current world position
        const p1 = b1.restPos.clone().add(b1.disp);
        const p2 = b2.restPos.clone().add(b2.disp);
        const diff = p1.sub(p2);
        const dist = diff.length();
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 0.001) {
          const overlap = (minDist - dist) * 0.5;
          const normal = diff.normalize();

          // Positional relaxation
          b1.disp.addScaledVector(normal, overlap);
          b2.disp.addScaledVector(normal, -overlap);

          // Elastic bounce impulse transfer
          const relVel = b1.vel.clone().sub(b2.vel);
          const velAlongNorm = relVel.dot(normal);

          if (velAlongNorm < 0) {
            const restitution = 0.55;
            const impulse = -(1 + restitution) * velAlongNorm / (1 / b1.mass + 1 / b2.mass);
            b1.vel.addScaledVector(normal, impulse / b1.mass);
            b2.vel.addScaledVector(normal, -impulse / b2.mass);
          }
        }
      }
    }

    // ──────────────────────────────────────────────────────────
    // 4. Apply Final Position & Aerodynamic Tilts to Each Mesh
    // ──────────────────────────────────────────────────────────
    for (let i = 0; i < particles.length; i++) {
      const b = particles[i];
      // restPos = balloon's original position from GLB
      // disp    = physics displacement
      // Final mesh position = original + displacement (each balloon moves independently!)
      b.mesh.position.copy(b.restPos).add(b.disp);

      // Tilt proportional to horizontal velocity (air drag effect)
      b.mesh.rotation.z = -b.vel.x * 0.0012;
      b.mesh.rotation.x = b.vel.y * 0.0012;
    }
  });

  // Pointer Interaction Handlers
  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!groupRef.current) return;
    document.body.style.cursor = 'grab';
    isPointerActive.current = true;

    // Convert world hit point to model coordinates (taking scale and pivot offset into account)
    const localHit = groupRef.current.worldToLocal(e.point.clone());
    // Offset corresponding to primitive position [-18.6, 361.5, 150.8]
    localHit.x += 18.6;
    localHit.y -= 361.5;
    localHit.z -= 150.8;
    pointerPos.current = localHit;

    // Apply group-level nudge based on left / right edge touch
    if (localHit.x < -100) {
      // Pushing from left edge -> nudge whole bouquet to the right
      groupVel.current.x += 0.8;
      groupTiltVel.current.z -= 0.45;
    } else if (localHit.x > 100) {
      // Pushing from right edge -> nudge whole bouquet to the left
      groupVel.current.x -= 0.8;
      groupTiltVel.current.z += 0.45;
    }
  }, []);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    handlePointerMove(e);
    // Extra impulse on click/tap
    if (pointerPos.current) {
      const cursor = pointerPos.current;
      for (const b of particlesRef.current) {
        const curPos = b.restPos.clone().add(b.disp);
        const diff = curPos.sub(cursor);
        if (diff.length() < 280) {
          b.vel.addScaledVector(diff.normalize(), 400);
        }
      }
    }
  }, [handlePointerMove]);

  const handlePointerLeave = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    isPointerActive.current = false;
    pointerPos.current = null;
  }, []);

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      rotation={rotation}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerLeave}
      onPointerOut={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      {/* Invisible bounding hit volume so hover and dragging over the bouquet is 100% responsive */}
      <mesh
        position={[0, -360, -150]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <boxGeometry args={[750, 950, 700]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Primitive model with offset pivot */}
      <primitive object={cloned} position={[-18.6, 361.5, 150.8]} />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────
// Spinning Brilliant Silver Mirror Disco Ball (12% Bottom Soft Pink)
// ──────────────────────────────────────────────────────────────
interface DiscoProps {
  position?: [number, number, number];
  scale?: number;
  rotationSpeed?: number;
}

function DiscoModel({
  position = [0, 0, 0],
  scale = 0.055,
  rotationSpeed = 0.008,
}: DiscoProps) {
  const { scene } = useGLTF('/models/free_realistic_disco_ball.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Interactivity: Stop spinning when touched or hovered!
  const [isStopped, setIsStopped] = useState(false);
  const currentSpeed = useRef(rotationSpeed);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth deceleration to stop or acceleration back to normal
    const targetSpd = isStopped ? 0 : rotationSpeed;
    currentSpeed.current = THREE.MathUtils.lerp(
      currentSpeed.current,
      targetSpd,
      Math.min(delta * 8, 1)
    );

    groupRef.current.rotation.y += currentSpeed.current;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.03;
  });

  const cloned = useMemo(() => {
    const c = scene.clone(true);

    // ── Pure PBR Chrome-Silver Mirror Tiles ──────────────────────────────────
    // High metalness + very low roughness = chrome mirror appearance.
    // The RoomEnvironment IBL handles all reflections — no shader injection needed.
    const mirrorTileMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#F8F8F8'),   // Near-white silver
      metalness: 1.0,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      envMapIntensity: 2.0,
    });

    // A second material for the bottom 12% tiles — same chrome but with a soft pink tint
    const mirrorTilePinkMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFB8D4'),   // Soft pink
      metalness: 1.0,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      envMapIntensity: 1.8,
    });

    // Determine bounding box once to find bottom 12% threshold
    // The GLB has 3 sets of Reflective_Plates meshes (top, mid, bottom sections)
    // We'll assign pink to any reflective mesh whose world center Y is in the lowest 12%
    const reflectiveMeshes: THREE.Mesh[] = [];
    c.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('reflective')) {
        reflectiveMeshes.push(child as THREE.Mesh);
      }
    });

    // Sort by Y position of bbox center to identify bottom 12%
    const meshesWithY = reflectiveMeshes.map((m) => {
      const box = new THREE.Box3().setFromObject(m);
      const center = new THREE.Vector3();
      box.getCenter(center);
      return { mesh: m, centerY: center.y };
    });
    const ys = meshesWithY.map((x) => x.centerY);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const bottomThreshold = minY + (maxY - minY) * 0.12;

    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        if (name.includes('reflective')) {
          const box = new THREE.Box3().setFromObject(child);
          const center = new THREE.Vector3();
          box.getCenter(center);
          child.material = center.y <= bottomThreshold ? mirrorTilePinkMat : mirrorTileMat;
        } else if (name.includes('base') || name.includes('discob')) {
          // Dark spherical core between tile gaps
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#111118'),
            roughness: 0.9,
            metalness: 0.0,
          });
        } else {
          // Fix connector + chain — polished chrome
          child.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#D8D8E0'),
            metalness: 0.95,
            roughness: 0.12,
          });
        }
      }
    });

    return c;
  }, [scene]);

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        setIsStopped(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
        setIsStopped(false);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        setIsStopped((prev) => !prev);
      }}
    >
      {/* Model offset so rotation pivot is around the true spherical center (y = -7.02) */}
      <primitive object={cloned} position={[0, -7.02, 0]} />

      {/* Dedicated point light placed below the ball to illuminate the 12% bottom pink */}
      <pointLight position={[0, -9.5, 0]} intensity={3.5} color="#FF85A2" distance={12} />
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
    const leftDiscoX = -viewport.width * 0.40;
    const leftDiscoY = viewport.height * 0.43;
    const rightDiscoX = viewport.width * 0.38;
    const rightDiscoY = viewport.height * 0.45;

    const leftBalloonsX = -viewport.width * 0.36;
    const leftBalloonsY = -viewport.height * 0.36;
    const rightBalloonsX = viewport.width * 0.36;
    const rightBalloonsY = -viewport.height * 0.36;

    return (
      <>
        {/* Top-Left Corner Silver/Pink Disco Ball */}
        <DiscoModel
          position={[leftDiscoX, leftDiscoY, 0.2]}
          scale={0.062}
          rotationSpeed={0.007}
        />

        {/* Top-Right Corner Silver/Pink Disco Ball */}
        <DiscoModel
          position={[rightDiscoX, rightDiscoY, -0.1]}
          scale={0.040}
          rotationSpeed={-0.006}
        />

        {/* Bottom-Left Purple/Pink Balloon Bouquet (Group 0) */}
        <BalloonModel
          position={[leftBalloonsX, leftBalloonsY, 0.3]}
          scale={0.00115}
          rotation={[0, 0.2, 0.1]}
          groupIndex={0}
        />

        {/* Bottom-Right Purple/Pink Balloon Bouquet (Group 1) */}
        <BalloonModel
          position={[rightBalloonsX, rightBalloonsY, 0.3]}
          scale={0.00115}
          rotation={[0, -0.2, -0.1]}
          groupIndex={1}
        />
      </>
    );
  }

  // ──────── DESKTOP VIEW ────────
  return (
    <>
      {/* Top-Left Silver/Pink Disco Ball */}
      <DiscoModel
        position={[-viewport.width * 0.27, viewport.height * 0.38, 0]}
        scale={0.072}
        rotationSpeed={0.007}
      />

      {/* Top-Right Silver/Pink Disco Ball */}
      <DiscoModel
        position={[viewport.width * 0.15, viewport.height * 0.44, -0.2]}
        scale={0.044}
        rotationSpeed={-0.005}
      />

      {/* Mid-Left Balloon Bouquet (Group 0) */}
      <BalloonModel
        position={[-viewport.width * 0.42, viewport.height * 0.14, 0.2]}
        scale={0.0013}
        rotation={[0, 0.3, 0.08]}
        groupIndex={0}
      />

      {/* Bottom-Left Balloon Bouquet (Group 1) */}
      <BalloonModel
        position={[-viewport.width * 0.27, -viewport.height * 0.30, 0.4]}
        scale={0.00135}
        rotation={[0, 0.15, 0.05]}
        groupIndex={1}
      />

      {/* Top-Right Balloon Bouquet (Group 2) */}
      <BalloonModel
        position={[viewport.width * 0.38, viewport.height * 0.28, 0.2]}
        scale={0.0013}
        rotation={[0, -0.3, -0.08]}
        groupIndex={2}
      />

      {/* Bottom-Right Balloon Bouquet (Group 3) */}
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
  isSingleBallTop?: boolean; // For Section 4 centered disco ball
}

export function HeroScene({ className, isSingleBallTop = false }: HeroSceneProps) {
  return (
    <div className={className ?? 'absolute inset-0 pointer-events-auto'}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        style={{ touchAction: 'pan-y' }}
      >
        <Suspense fallback={null}>
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
            // Centered top disco ball (for Section Four iPhone frame)
            <DiscoModel position={[0, 0.3, 0]} scale={0.055} rotationSpeed={0.012} />
          ) : (
            // Dual brilliant silver/pink disco balls and interactive physics balloons
            <ResponsiveHeroElements />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/colorful_balloons.glb');
useGLTF.preload('/models/free_realistic_disco_ball.glb');
