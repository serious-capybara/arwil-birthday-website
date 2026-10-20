import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ──────────────────────────────────────────────────
// iPhone model with wallpaper texture
// ──────────────────────────────────────────────────
function iPhoneModel() {
  const { scene } = useGLTF('/models/apple_iphone_18_pro_max.glb');

  // Apply sleek theme color to screen mesh
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        // Target screen/display meshes
        if (
          name.includes('screen') ||
          name.includes('display') ||
          name.includes('glass') ||
          name.includes('front')
        ) {
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#0A515A'),
            roughness: 0.1,
            metalness: 0.1,
            envMapIntensity: 0.5,
          });
          child.material = mat;
        }
      }
    });
  }, [scene]);

  return scene;
}

interface PhoneGroupProps {
  mouseX: number;
  mouseY: number;
}

function PhoneGroup({ mouseX, mouseY }: PhoneGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const phoneScene = iPhoneModel();

  useFrame(() => {
    if (!groupRef.current) return;
    // Subtle parallax tilt based on mouse/device orientation
    const targetRotX = mouseY * 0.18;
    const targetRotY = mouseX * 0.22;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x, targetRotX, 0.06
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, targetRotY, 0.06
    );
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={phoneScene} scale={3.2} rotation={[0, 0, 0]} />
    </group>
  );
}

// ──────────────────────────────────────────────────
// Phone Section Canvas
// ──────────────────────────────────────────────────
interface PhoneSceneProps {
  mouseX: number;
  mouseY: number;
  className?: string;
}

export function PhoneScene({ mouseX, mouseY, className }: PhoneSceneProps) {
  return (
    <div className={className ?? 'w-full h-full'}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.6} />
          <hemisphereLight args={['#FFFFFF', '#0A515A', 0.8]} />
          <directionalLight position={[3, 5, 5]} intensity={2.2} />
          <directionalLight position={[-3, -2, 2]} intensity={1.0} color="#FFAEC9" />
          <pointLight position={[-3, 2, 2]} intensity={0.8} color="#C8A8D8" />

          <PhoneGroup mouseX={mouseX} mouseY={mouseY} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/apple_iphone_18_pro_max.glb');
