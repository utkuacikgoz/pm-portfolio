import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INDIE_PROJECTS } from "../projects/projects";
import { islandPosition, INDIE_INDEX, WATER_Y } from "./geometry";

// The sea the islands float on, and the separate "what I'm building" island you
// surf to — indie products as gently bobbing, NON-clickable coming-soon bubbles.

export function Water() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[44, WATER_Y, 0]} raycast={() => null}>
      <planeGeometry args={[460, 260]} />
      <meshStandardMaterial color="#081420" roughness={0.18} metalness={0.35} transparent opacity={0.97} />
    </mesh>
  );
}

function Bubble({ index, color, count }: { index: number; color: string; count: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const x = (index - (count - 1) / 2) * 2.6;
  useFrame((s) => {
    if (ref.current) ref.current.position.y = 3.2 + Math.sin(s.clock.elapsedTime * 1.2 + index) * 0.35;
  });
  return (
    // raycast disabled → bubbles are visual only, not clickable.
    <mesh ref={ref} position={[x, 3.2, 0]} raycast={() => null}>
      <sphereGeometry args={[1.15, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.45}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
}

export function IndieIsland() {
  const [ix, , iz] = islandPosition(INDIE_INDEX);
  return (
    <group position={[ix, 0, iz]}>
      <mesh position={[0, -0.5, 0]} raycast={() => null}>
        <boxGeometry args={[7, 1, 7]} />
        <meshStandardMaterial color="#13243a" flatShading />
      </mesh>
      <mesh position={[0, -1.5, 0]} raycast={() => null}>
        <boxGeometry args={[4.5, 1, 4.5]} />
        <meshStandardMaterial color="#0e1b2c" flatShading />
      </mesh>
      {INDIE_PROJECTS.map((p, i) => (
        <Bubble key={p.id} index={i} color={p.accent} count={INDIE_PROJECTS.length} />
      ))}
    </group>
  );
}
