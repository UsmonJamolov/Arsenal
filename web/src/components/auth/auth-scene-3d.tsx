"use client";

import { Float, MeshDistortMaterial, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

function CyberCore() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }

    meshRef.current.rotation.x = state.clock.elapsedTime * 0.22;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.38;
  });

  return (
    <Float speed={2.2} rotationIntensity={1.4} floatIntensity={2.2}>
      <mesh ref={meshRef} scale={1.65}>
        <icosahedronGeometry args={[1, 2]} />
        <MeshDistortMaterial
          color="#0e7490"
          emissive="#c026d3"
          emissiveIntensity={0.75}
          distort={0.42}
          speed={2.4}
          roughness={0.15}
          metalness={0.9}
          transparent
          opacity={0.95}
        />
      </mesh>
    </Float>
  );
}

function OrbitRings() {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.z = state.clock.elapsedTime * 0.12;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
  });

  const rings = useMemo(
    () => [
      { radius: 2.4, tube: 0.03, color: "#22d3ee", opacity: 0.55 },
      { radius: 3.1, tube: 0.025, color: "#e879f9", opacity: 0.4 },
      { radius: 3.8, tube: 0.02, color: "#a78bfa", opacity: 0.3 },
    ],
    [],
  );

  return (
    <group ref={groupRef}>
      {rings.map((ring) => (
        <mesh key={ring.radius} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[ring.radius, ring.tube, 24, 120]} />
          <meshBasicMaterial color={ring.color} transparent opacity={ring.opacity} wireframe />
        </mesh>
      ))}
    </group>
  );
}

function FloatingShards() {
  const shards = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4 - 2,
        ] as [number, number, number],
        scale: 0.12 + Math.random() * 0.22,
        speed: 0.8 + Math.random() * 1.4,
        index,
      })),
    [],
  );

  return (
    <>
      {shards.map((shard) => (
        <Float key={shard.index} speed={shard.speed} floatIntensity={1.6} rotationIntensity={0.8}>
          <mesh position={shard.position} scale={shard.scale}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#67e8f9"
              emissive="#22d3ee"
              emissiveIntensity={0.5}
              metalness={0.85}
              roughness={0.25}
              transparent
              opacity={0.75}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function SceneContent() {
  const gridRef = useRef<Group>(null);

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.y = -2.2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    }
  });

  return (
    <>
      <color attach="background" args={["#030108"]} />
      <fog attach="fog" args={["#030108", 6, 24]} />
      <ambientLight intensity={0.28} />
      <pointLight position={[5, 4, 6]} intensity={2.2} color="#22d3ee" />
      <pointLight position={[-5, -2, 4]} intensity={1.6} color="#e879f9" />
      <pointLight position={[0, -4, 2]} intensity={0.8} color="#a78bfa" />
      <Stars radius={90} depth={50} count={6000} factor={3.5} saturation={0.85} fade speed={0.8} />
      <Sparkles count={180} scale={14} size={5} speed={0.35} color="#67e8f9" opacity={0.65} />
      <CyberCore />
      <OrbitRings />
      <FloatingShards />
      <group ref={gridRef} rotation={[-Math.PI / 2.1, 0, 0]} position={[0, -2.2, 0]}>
        <gridHelper args={[24, 32, "#22d3ee", "#312e81"]} />
      </group>
    </>
  );
}

export function AuthScene3D() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0.4, 7.5], fov: 52 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        className="h-full w-full"
      >
        <SceneContent />
      </Canvas>
      <VignetteOverlay />
    </div>
  );
}

function VignetteOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#030108_78%)]"
    />
  );
}
