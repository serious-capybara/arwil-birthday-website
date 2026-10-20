import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

// ──────────────────────────────────────────────────
// Balloon model
// ──────────────────────────────────────────────────
function BalloonModel({ position = [0, 0, 0] as [number, number, number], scale = 1 }) {
  const { scene } = useGLTF('/models/colorful_balloons.glb');
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.15;
  });

  const cloned = scene.clone();
  return (
    <Float
      speed={1.2}
      rotationIntensity={0.3}
      floatIntensity={0.8}
      floatingRange={[-0.15, 0.25]}
    >
      <group ref={ref} position={position} scale={scale}>
        <primitive object={cloned} />
      </group>
    </Float>
  );
}

// ──────────────────────────────────────────────────
// Disco ball model
// ──────────────────────────────────────────────────
function DiscoModel({ position = [0, 0, 0] as [number, number, number], scale = 1 }) {
  const { scene } = useGLTF('/models/free_realistic_disco_ball.glb');
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.012;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
  });

  const cloned = scene.clone();
  return (
    <group ref={ref} position={position} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}

// ──────────────────────────────────────────────────
// Hero Scene Canvas
// ──────────────────────────────────────────────────
interface HeroSceneProps {
  className?: string;
}

export function HeroScene({ className }: HeroSceneProps) {
  return (
    <div className={className ?? 'absolute inset-0 pointer-events-none'}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 8, 5]} intensity={1.8} castShadow={false} />
          <pointLight position={[-5, 5, 3]} intensity={0.8} color="#F9C5D1" />

          {/* Left disco ball - top left corner */}
          <DiscoModel position={[-3.2, 2.6, -1]} scale={1.2} />
          {/* Right disco ball - top right corner */}
          <DiscoModel position={[3.4, 2.8, -1]} scale={1.0} />

          {/* Balloons - bottom left */}
          <BalloonModel position={[-3.5, -2.0, 0]} scale={0.65} />
          {/* Balloons - bottom right */}
          <BalloonModel position={[3.2, -2.2, 0]} scale={0.7} />
          {/* Balloons - center bottom */}
          <BalloonModel position={[0, -3.2, -0.5]} scale={0.5} />

          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload models
useGLTF.preload('/models/colorful_balloons.glb');
useGLTF.preload('/models/free_realistic_disco_ball.glb');
