import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INDIE_PROJECTS, PUBLISHED_PROJECTS } from "../projects/projects";
import { islandPosition, INDIE_INDEX, WATER_Y } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";

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

// When you travel to an island, a ring of light ripples out across the water
// beneath it. A tiny reused pool (3 meshes) — no per-frame allocation.
const RIPPLE_DUR = 1.4;

export function Ripples({ active }: { active: number }) {
  const reduced = usePrefersReducedMotion();
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const slots = useRef(Array.from({ length: 3 }, () => ({ born: -99, x: 0, z: 0 })));
  const cursor = useRef(0);
  const accent = PUBLISHED_PROJECTS[active]?.accent ?? "#00FFFF";

  useEffect(() => {
    if (reduced) return;
    const [x, , z] = islandPosition(active);
    const s = slots.current[cursor.current % slots.current.length];
    s.born = performance.now() / 1000;
    s.x = x;
    s.z = z;
    cursor.current++;
  }, [active, reduced]);

  useFrame(() => {
    const now = performance.now() / 1000;
    for (let i = 0; i < slots.current.length; i++) {
      const m = meshes.current[i];
      const s = slots.current[i];
      if (!m) continue;
      const age = now - s.born;
      if (age < 0 || age > RIPPLE_DUR) {
        m.visible = false;
        continue;
      }
      const p = age / RIPPLE_DUR;
      m.visible = true;
      m.position.set(s.x, WATER_Y + 0.06, s.z);
      const scale = 1 + p * 7;
      m.scale.set(scale, scale, scale);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.5;
    }
  });

  return (
    <>
      {slots.current.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          raycast={() => null}
        >
          <ringGeometry args={[1.4, 1.7, 56]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

// A soft accent-colored light shaft that follows the active island — a subtle
// "god-ray" without any postprocessing (one low-poly additive cone).
export function LightShaft({ active }: { active: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = usePrefersReducedMotion();
  const accent = PUBLISHED_PROJECTS[active]?.accent ?? "#00FFFF";
  const target = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    if (!ref.current) return;
    const [x, , z] = islandPosition(active);
    target.current.set(x, 16, z);
    ref.current.position.lerp(target.current, 1 - Math.exp(-2 * dt));
    if (!reduced) ref.current.rotation.y += dt * 0.15;
  });

  return (
    <mesh ref={ref} position={[0, 16, 0]} raycast={() => null}>
      <coneGeometry args={[6, 22, 6, 1, true]} />
      <meshBasicMaterial
        color={accent}
        transparent
        opacity={0.055}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
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
