import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

// ──────────────────────────────────────────────────
// Metallic Rose Pink & Silver Balloons Bouquet Model
// ──────────────────────────────────────────────────
interface BalloonProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}

const BALLOON_PALETTE = [
  '#FF85A2', // vibrant metallic rose pink
  '#FFAEC9', // soft blush pink
  '#F4E6EF', // pearl metallic silver
  '#E6739F', // deep shiny rose
  '#FF9EBB', // bubblegum metallic
  '#F0DFEB', // silver-pink sheen
];

function BalloonModel({
  position = [0, 0, 0],
  scale = 0.0012,
  rotation = [0, 0, 0],
}: BalloonProps) {
  const { scene } = useGLTF('/models/colorful_balloons.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Subtle organic sway
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.4 + position[0]) * 0.12;
    groupRef.current.rotation.z = rotation[2] + Math.cos(t * 0.3 + position[1]) * 0.05;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8 + position[0]) * 0.04;
  });

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    let sphereIndex = 0;

    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        child.material = child.material.clone();

        if (name.includes('sphere')) {
          // Color balloons with celebratory metallic rose pink & pearl silver palette
          const hex = BALLOON_PALETTE[sphereIndex % BALLOON_PALETTE.length];
          sphereIndex++;

          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(hex),
            metalness: 0.88,
            roughness: 0.16,
          });
        } else if (name.includes('cord')) {
          // Delicate silver-rose hanging string
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#D8C2CF'),
            metalness: 0.7,
            roughness: 0.35,
          });
        } else if (name.includes('lace')) {
          // Ribbon lace
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#FF85A2'),
            metalness: 0.6,
            roughness: 0.25,
          });
        }
      }
    });
    return c;
  }, [scene]);

  return (
    <Float
      speed={1.6}
      rotationIntensity={0.2}
      floatIntensity={0.5}
      floatingRange={[-0.05, 0.08]}
    >
      <group ref={groupRef} position={position} scale={scale} rotation={rotation}>
        {/* Model offset so pivot center is at bouquet center (raw center is x:18.6, y:-361.5, z:-150.8) */}
        <primitive object={cloned} position={[-18.6, 361.5, 150.8]} />
      </group>
    </Float>
  );
}

// ──────────────────────────────────────────────────
// Spinning Pink Metallic Mirror Disco Ball Model
// ──────────────────────────────────────────────────
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

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += rotationSpeed;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.03;
  });

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        if (name.includes('reflective')) {
          // Vibrant pink metallic mirror tiles
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#FF94B8'),
            metalness: 0.95,
            roughness: 0.08,
          });
        } else if (name.includes('base')) {
          // Dark core between mirror tiles
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#3A0D1B'),
            roughness: 0.8,
          });
        } else {
          // Chain and metal connector
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#ECCFE0'),
            metalness: 0.9,
            roughness: 0.2,
          });
        }
      }
    });
    return c;
  }, [scene]);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Model offset so rotation pivot is around the true spherical center (y = -7.02) */}
      <primitive object={cloned} position={[0, -7.02, 0]} />
    </group>
  );
}

// ──────────────────────────────────────────────────
// Responsive Layout for Hero (Desktop vs Mobile)
// ──────────────────────────────────────────────────
function ResponsiveHeroElements() {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5.2;

  if (isMobile) {
    // ──────── MOBILE VIEW (Matching Image 4) ────────
    // Top-left: Large disco ball partially entering corner
    // Top-right: Smaller disco ball in corner
    // Bottom-left: Bouquet of metallic pink balloons
    // Bottom-right: Bouquet of metallic pink balloons
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
        {/* Top-Left Corner Disco Ball */}
        <DiscoModel
          position={[leftDiscoX, leftDiscoY, 0.2]}
          scale={0.062}
          rotationSpeed={0.007}
        />

        {/* Top-Right Corner Disco Ball */}
        <DiscoModel
          position={[rightDiscoX, rightDiscoY, -0.1]}
          scale={0.040}
          rotationSpeed={-0.006}
        />

        {/* Bottom-Left Balloon Bouquet */}
        <BalloonModel
          position={[leftBalloonsX, leftBalloonsY, 0.3]}
          scale={0.00115}
          rotation={[0, 0.2, 0.1]}
        />

        {/* Bottom-Right Balloon Bouquet */}
        <BalloonModel
          position={[rightBalloonsX, rightBalloonsY, 0.3]}
          scale={0.00115}
          rotation={[0, -0.2, -0.1]}
        />
      </>
    );
  }

  // ──────── DESKTOP VIEW (Matching Image 3) ────────
  // Top-left: Large disco ball floating to the left of the cat
  // Top-center-right: Medium disco ball floating above-right
  // Sides: 4 balloon bouquets framing the invitation
  return (
    <>
      {/* Top-Left Disco Ball */}
      <DiscoModel
        position={[-viewport.width * 0.27, viewport.height * 0.38, 0]}
        scale={0.072}
        rotationSpeed={0.007}
      />

      {/* Top-Right Disco Ball */}
      <DiscoModel
        position={[viewport.width * 0.15, viewport.height * 0.44, -0.2]}
        scale={0.044}
        rotationSpeed={-0.005}
      />

      {/* Mid-Left Balloon Bouquet */}
      <BalloonModel
        position={[-viewport.width * 0.42, viewport.height * 0.14, 0.2]}
        scale={0.0013}
        rotation={[0, 0.3, 0.08]}
      />

      {/* Bottom-Left Balloon Bouquet */}
      <BalloonModel
        position={[-viewport.width * 0.27, -viewport.height * 0.30, 0.4]}
        scale={0.00135}
        rotation={[0, 0.15, 0.05]}
      />

      {/* Top-Right Balloon Bouquet */}
      <BalloonModel
        position={[viewport.width * 0.38, viewport.height * 0.28, 0.2]}
        scale={0.0013}
        rotation={[0, -0.3, -0.08]}
      />

      {/* Bottom-Right Balloon Bouquet */}
      <BalloonModel
        position={[viewport.width * 0.23, -viewport.height * 0.28, 0.4]}
        scale={0.00135}
        rotation={[0, -0.15, -0.05]}
      />
    </>
  );
}

// ──────────────────────────────────────────────────
// Hero Scene Canvas
// ──────────────────────────────────────────────────
interface HeroSceneProps {
  className?: string;
  isSingleBallTop?: boolean; // For Section 4 centered disco ball
}

export function HeroScene({ className, isSingleBallTop = false }: HeroSceneProps) {
  return (
    <div className={className ?? 'absolute inset-0 pointer-events-none'}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.6} />
          <directionalLight position={[5, 8, 5]} intensity={2.4} />
          <pointLight position={[-4, 4, 3]} intensity={2.2} color="#FF69B4" />
          <pointLight position={[4, 4, 3]} intensity={2.2} color="#FFAEC9" />
          <pointLight position={[0, -2, 2]} intensity={1.2} color="#FFB6C1" />

          {isSingleBallTop ? (
            // Centered top disco ball (for Section Four iPhone frame)
            <DiscoModel position={[0, 0.3, 0]} scale={0.055} rotationSpeed={0.012} />
          ) : (
            // Dual disco balls and metallic balloon bouquets
            <ResponsiveHeroElements />
          )}

          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/colorful_balloons.glb');
useGLTF.preload('/models/free_realistic_disco_ball.glb');
