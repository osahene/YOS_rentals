"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function FloatingShapes() {
  const groupRef = useRef<THREE.Group>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const boxRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      groupRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
    }

    if (torusRef.current) {
      torusRef.current.rotation.x += 0.01;
      torusRef.current.rotation.y += 0.005;
    }

    if (sphereRef.current) {
      sphereRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    }

    if (boxRef.current) {
      boxRef.current.rotation.x += 0.005;
      boxRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Floating Torus */}
      <mesh ref={torusRef} position={[4, 1, -5]}>
        <torusGeometry args={[1, 0.3, 16, 100]} />
        <meshStandardMaterial
          color="#3B82F6"
          emissive="#1D4ED8"
          emissiveIntensity={0.2}
          wireframe
          opacity={0.3}
          transparent
        />
      </mesh>

      {/* Floating Sphere */}
      <mesh ref={sphereRef} position={[-3, 0, -7]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#7C3AED"
          emissiveIntensity={0.1}
          opacity={0.2}
          transparent
          wireframe
        />
      </mesh>

      {/* Floating Box */}
      <mesh ref={boxRef} position={[2, -1, -8]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#059669"
          emissiveIntensity={0.1}
          opacity={0.15}
          transparent
          wireframe
        />
      </mesh>

      {/* Additional floating shapes */}
      <mesh position={[-4, 2, -6]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color="#EF4444"
          emissive="#DC2626"
          emissiveIntensity={0.1}
          opacity={0.15}
          transparent
          wireframe
        />
      </mesh>

      {/* Background particles */}
      <points>
        <sphereGeometry args={[20, 32, 32]} />
        <pointsMaterial color="#60A5FA" size={0.05} transparent opacity={0.1} />
      </points>
    </group>
  );
}

export function ThreeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Soft ambient light */}
      <ambientLight intensity={0.3} color="#ffffff" />

      {/* Directional light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.5}
        color="#ffffff"
      />

      {/* Point light for highlights */}
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8B5CF6" />

      {/* Fog for depth */}
      <fog attach="fog" args={["#ffffff", 15, 25]} />

      <FloatingShapes />

      {/* Minimal controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        autoRotate
        autoRotateSpeed={0.2}
      />
    </Canvas>
  );
}

export function useThreeJSScene() {
  return { ThreeScene };
}
