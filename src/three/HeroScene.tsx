import { Suspense, useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ──────────────────────────────────────────────────────────────
// Purple & Pink Celebratory Balloon Palette (Subtle metallic)
// ──────────────────────────────────────────────────────────────
const PURPLE_PINK_PALETTE = [
  '#8A2BE2', // Blue-violet purple
  '#A43596', // Rich magenta-purple
  '#C74B9E', // Vibrant orchid-pink
  '#9D4EDD', // Royal purple
  '#D468AB', // Bubblegum pink-purple
  '#BA55D3', // Medium orchid
  '#B54D8C', // Deep plum-pink
  '#E085C2', // Soft lilac-pink
];

// Pre-defined balloon indices for 1 to 3 transparent refractive balloons per bouquet
const TRANSPARENT_SELECTIONS: number[][] = [
  [2, 7],       // Group 0: 2 transparent balloons
  [4],          // Group 1: 1 transparent balloon
  [1, 6, 9],    // Group 2: 3 transparent balloons
  [3, 8],       // Group 3: 2 transparent balloons
];

// ──────────────────────────────────────────────────────────────
// Interactive Purple-Pink & Transparent Refraction Balloon Model
// ──────────────────────────────────────────────────────────────
interface BalloonProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  groupIndex?: number;
}

interface BalloonMeshItem {
  mesh: THREE.Mesh;
  initialPos: THREE.Vector3;
  divideOffset: THREE.Vector3;
}

function BalloonModel({
  position = [0, 0, 0],
  scale = 0.0012,
  rotation = [0, 0, 0],
  groupIndex = 0,
}: BalloonProps) {
  const { scene } = useGLTF('/models/colorful_balloons.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Interaction State
  const [targetOffsetX, setTargetOffsetX] = useState(0);
  const [targetTiltZ, setTargetTiltZ] = useState(0);
  const [targetDivide, setTargetDivide] = useState(0);

  // Animated interpolated values
  const currentOffset = useRef({ x: 0, y: 0 });
  const currentTilt = useRef({ z: 0 });
  const currentDivide = useRef(0);

  // List of balloon items with original positions and outward divide vectors
  const balloonMeshesRef = useRef<BalloonMeshItem[]>([]);

  // Clone scene and apply materials
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    let sphereCount = 0;
    const meshItems: BalloonMeshItem[] = [];

    // Deterministic transparent selection (1 to 3 transparent balloons)
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
            // Transparent balloon with realistic refraction / light deflecting transmission
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#F6EEF9'),
              transmission: 0.92,
              opacity: 1.0,
              transparent: true,
              roughness: 0.08,
              ior: 1.25, // Physical index of refraction for deflection/defraction
              thickness: 2.0,
              metalness: 0.04,
              clearcoat: 0.9,
              clearcoatRoughness: 0.1,
              specularIntensity: 1.0,
              specularColor: new THREE.Color('#FFFFFF'),
            });
          } else {
            // Purple with pink metallic palette
            const hex = PURPLE_PINK_PALETTE[(balloonIdx + groupIndex * 2) % PURPLE_PINK_PALETTE.length];
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(hex),
              metalness: 0.48, // Subtle metallic sheen, not mirror-shiny like disco
              roughness: 0.28,
            });
          }

          // Compute balloon bounding box center for outward divide vector
          const box = new THREE.Box3().setFromObject(child);
          const center = new THREE.Vector3();
          box.getCenter(center);

          // Vector pointing radially outward from bouquet center
          const divideDir = new THREE.Vector3(
            center.x,
            (center.y + 100) * 0.6,
            center.z + 150
          ).normalize().multiplyScalar(220); // ~220 units in raw model space

          meshItems.push({
            mesh: child,
            initialPos: child.position.clone(),
            divideOffset: divideDir,
          });
        } else if (name.includes('cord')) {
          // Delicate lilac hanging string
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#D8C2E0'),
            metalness: 0.4,
            roughness: 0.4,
          });
        } else if (name.includes('lace')) {
          // Ribbon lace bow
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#C74B9E'),
            metalness: 0.45,
            roughness: 0.3,
          });
        }
      }
    });

    balloonMeshesRef.current = meshItems;
    return c;
  }, [scene, groupIndex]);

  // Frame animation: organic sway + springy interactive responses
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Organic floating sway (damped when actively touched)
    const isInteracting = targetOffsetX !== 0 || targetTiltZ !== 0 || targetDivide !== 0;
    const swayAmp = isInteracting ? 0.3 : 1.0;
    const naturalSwayY = Math.sin(t * 0.4 + position[0]) * 0.08 * swayAmp;
    const naturalFloatY = Math.sin(t * 0.8 + position[0]) * 0.03 * swayAmp;

    // Lerp interactive offset and tilt
    currentOffset.current.x = THREE.MathUtils.lerp(
      currentOffset.current.x,
      targetOffsetX,
      Math.min(delta * 7, 1)
    );
    currentTilt.current.z = THREE.MathUtils.lerp(
      currentTilt.current.z,
      targetTiltZ,
      Math.min(delta * 7, 1)
    );
    currentDivide.current = THREE.MathUtils.lerp(
      currentDivide.current,
      targetDivide,
      Math.min(delta * 8, 1)
    );

    // Apply group transforms
    groupRef.current.position.x = position[0] + currentOffset.current.x;
    groupRef.current.position.y = position[1] + naturalFloatY;
    groupRef.current.position.z = position[2];

    groupRef.current.rotation.y = rotation[1] + naturalSwayY;
    groupRef.current.rotation.z = rotation[2] + currentTilt.current.z;

    // Animate balloon divide/separation
    const divProg = currentDivide.current;
    const meshes = balloonMeshesRef.current;
    for (let i = 0; i < meshes.length; i++) {
      const item = meshes[i];
      if (item && item.mesh) {
        item.mesh.position.x = item.initialPos.x + item.divideOffset.x * divProg;
        item.mesh.position.y = item.initialPos.y + item.divideOffset.y * divProg;
        item.mesh.position.z = item.initialPos.z + item.divideOffset.z * divProg;
      }
    }
  });

  // Pointer Interaction Handlers (Left corner -> move right, Right corner -> move left, Body -> divide)
  const handlePointer = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!groupRef.current) return;
    document.body.style.cursor = 'grab';

    // Convert raycast hit point to local bouquet coordinates
    const localPoint = groupRef.current.worldToLocal(e.point.clone());

    // In local bouquet coordinates (scaled by ~0.0012, raw bouquet width is ~1092)
    // Left corner is localPoint.x < -120
    // Right corner is localPoint.x > 120
    // Body / center is -120 <= localPoint.x <= 120
    if (localPoint.x < -120) {
      // Touch on left corner -> Move to the RIGHT and tilt right
      setTargetOffsetX(0.35);
      setTargetTiltZ(-0.24);
      setTargetDivide(0);
    } else if (localPoint.x > 120) {
      // Touch on right corner -> Move to the LEFT and tilt left
      setTargetOffsetX(-0.35);
      setTargetTiltZ(0.24);
      setTargetDivide(0);
    } else {
      // Touch on body of balloon bouquet -> Balloons divide/spread apart!
      setTargetOffsetX(0);
      setTargetTiltZ(0);
      setTargetDivide(1.0);
    }
  }, []);

  const handlePointerLeave = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    // Smoothly return back to original state on release/pointer leave
    setTargetOffsetX(0);
    setTargetTiltZ(0);
    setTargetDivide(0);
  }, []);

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      rotation={rotation}
      onPointerDown={handlePointer}
      onPointerMove={handlePointer}
      onPointerUp={handlePointerLeave}
      onPointerOut={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      {/* Invisible bounding hit volume so touch/hover is silky smooth and responsive */}
      <mesh position={[0, -360, -150]} onPointerDown={handlePointer} onPointerMove={handlePointer}>
        <boxGeometry args={[650, 800, 600]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Model offset so pivot center is centered at bouquet cluster (raw center is x:18.6, y:-361.5, z:-150.8) */}
      <primitive object={cloned} position={[-18.6, 361.5, 150.8]} />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────
// Spinning Silver Mirror Disco Ball (12% Bottom Soft Pink Tint)
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

    // Custom Silver Mirror Tiles with ~12% soft pink tint at the bottom
    const silverWithPinkBottomMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#EBF1F5'), // Silver base
      metalness: 0.98,
      roughness: 0.08,
    });

    silverWithPinkBottomMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vLocalPosition;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vLocalPosition = position;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vLocalPosition;`
      );
      // Disco ball sphere goes from y = -9.13 (bottom) to +9.03 (top).
      // Bottom 12% is y < -6.95. Smoothly transition to soft pink at the bottom!
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float bottomPinkFactor = smoothstep(-6.8, -9.1, vLocalPosition.y);
         vec3 silverTile = vec3(0.92, 0.94, 0.97);
         vec3 softPinkTile = vec3(1.0, 0.65, 0.82);
         diffuseColor.rgb = mix(silverTile, softPinkTile, bottomPinkFactor * 0.92);`
      );
    };
    silverWithPinkBottomMaterial.customProgramCacheKey = () => 'disco-silver-pink-bottom';

    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        if (name.includes('reflective')) {
          child.material = silverWithPinkBottomMaterial;
        } else if (name.includes('base')) {
          // Dark core between mirror tiles
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#1F1422'),
            roughness: 0.85,
          });
        } else {
          // Chain and metal connector
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#D8DEE4'),
            metalness: 0.92,
            roughness: 0.2,
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

      {/* Subtle point light placed at bottom pole to accent the 12% pink reflection */}
      <pointLight position={[0, -10, 0]} intensity={1.5} color="#FFAEC9" distance={15} />
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
    // Top-left: Large silver/pink disco ball entering corner
    // Top-right: Smaller silver/pink disco ball in corner
    // Bottom-left: Bouquet of purple-pink balloons (Group 0)
    // Bottom-right: Bouquet of purple-pink balloons (Group 1)
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
  // Top-left: Large silver/pink disco ball to the left of cat
  // Top-right: Medium silver/pink disco ball above-right
  // Sides: 4 independent purple-pink balloon bouquets framing the invitation
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
          <ambientLight intensity={1.5} />
          <hemisphereLight args={['#FDFDFD', '#0A515A', 0.8]} />
          <directionalLight position={[6, 9, 6]} intensity={2.6} />
          <directionalLight position={[-6, 5, -3]} intensity={1.5} color="#FCE7F3" />
          <pointLight position={[-4, 4, 3]} intensity={2.2} color="#FFAEC9" />
          <pointLight position={[4, 4, 3]} intensity={2.2} color="#C084FC" />
          <pointLight position={[0, -2, 2]} intensity={1.5} color="#FFAEC9" />

          {isSingleBallTop ? (
            // Centered top disco ball (for Section Four iPhone frame)
            <DiscoModel position={[0, 0.3, 0]} scale={0.055} rotationSpeed={0.012} />
          ) : (
            // Dual silver/pink disco balls and interactive purple-pink balloon bouquets
            <ResponsiveHeroElements />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/colorful_balloons.glb');
useGLTF.preload('/models/free_realistic_disco_ball.glb');
