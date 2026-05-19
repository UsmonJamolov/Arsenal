"use client";

import { Float, MeshDistortMaterial } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function MiniOrb() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }

    meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
  });

  return (
    <Float speed={1.8} floatIntensity={1.2}>
      <mesh ref={meshRef} scale={1.1}>
        <torusKnotGeometry args={[0.55, 0.16, 128, 24]} />
        <MeshDistortMaterial
          color="#22d3ee"
          emissive="#c026d3"
          emissiveIntensity={0.65}
          distort={0.35}
          speed={2}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

export function ProfileMiniScene() {
  return (
    <div className="pointer-events-none h-28 w-full select-none">
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        className="pointer-events-none h-full w-full"
        style={{ pointerEvents: "none" }}
      >
        <color attach="background" args={["#0a0618"]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[2, 2, 2]} intensity={1.5} color="#22d3ee" />
        <pointLight position={[-2, -1, 1]} intensity={1} color="#e879f9" />
        <MiniOrb />
      </Canvas>
    </div>
  );
}
