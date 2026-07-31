import { useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PUBLISHED_PROJECTS, type Project, type StructureType } from "../projects/projects";
import { islandPosition } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";

// Floating low-poly domain marks make each island legible without depending on
// platform emoji fonts or screen-facing CanvasTexture stickers.

// Hover height per structure: just above each silhouette, kept modest so a tall
// tower's icon doesn't clip at the top of the frame.
const HOVER_BY_STRUCTURE: Record<StructureType, number> = {
  tower: 8.5,
  market: 6.1,
  campus: 6.1,
  arcade: 6.6,
  bridge: 6.6,
  beacon: 6.6,
};

function DomainMark({ project }: { project: Project }) {
  const material = {
    color: project.accent,
    emissive: project.accent,
    emissiveIntensity: 0.3,
    roughness: 0.38,
    metalness: 0.16,
  };

  switch (project.structure) {
    case "tower":
      return (
        <group rotation={[0.35, 0.45, 0]}>
          <mesh>
            <icosahedronGeometry args={[1.55, 1]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.05, 0.16, 8, 20]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.7} />
          </mesh>
        </group>
      );
    case "market":
      return (
        <group>
          {[-0.85, 0, 0.85].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0.2, 0.4, 0]}>
              <boxGeometry args={[0.55, 1.8, 0.55]} />
              <meshStandardMaterial {...material} flatShading />
            </mesh>
          ))}
          <mesh position={[0, 0.92, 0]} rotation={[0, 0.4, 0]}>
            <boxGeometry args={[3, 0.2, 0.9]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.6} />
          </mesh>
        </group>
      );
    case "campus":
      return (
        <group rotation={[0.2, 0.5, 0]}>
          <mesh>
            <octahedronGeometry args={[1.35, 0]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[1.65, 0.1, 8, 16]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case "arcade":
      return (
        <group rotation={[0.4, 0.4, 0]}>
          <mesh>
            <dodecahedronGeometry args={[1.4, 0]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.7, 0.12, 6, 16]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case "bridge":
      return (
        <group rotation={[0.15, 0.5, 0]}>
          <mesh position={[-0.95, 0, 0]}>
            <coneGeometry args={[0.48, 2.4, 5]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh position={[0.95, 0, 0]}>
            <coneGeometry args={[0.48, 2.4, 5]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 2.1, 8]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh rotation={[0.25, 0.4, 0]}>
          <icosahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial {...material} flatShading />
        </mesh>
      );
  }
}

function Emblem({ project, index, active, reduced }: { project: Project; index: number; active: boolean; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const [px, , pz] = islandPosition(index);
  const hoverY = HOVER_BY_STRUCTURE[project.structure] ?? 8;
  const scale = 0.72;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = hoverY + (reduced ? 0 : Math.sin(t * 1.1 + index) * 0.3);
    ref.current.scale.setScalar(scale * (active && !reduced ? 1 + Math.sin(t * 2.4) * 0.06 : 1));
  });

  return (
    <group ref={ref} position={[px, hoverY, pz]} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[1.8, 1.92, 8]} />
        <meshBasicMaterial color={project.accent} transparent opacity={active ? 0.68 : 0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <DomainMark project={project} />
    </group>
  );
}

// Invisible, generously-sized click target covering each island + its icon.
// Raycast stays ON (unlike Ocean's visual-only meshes) so the structure opens its
// case study. A drag guard suppresses opens that were really camera-orbit drags.
function Hitbox({ index, onOpen }: { index: number; onOpen: (i: number) => void }) {
  const [px, , pz] = islandPosition(index);
  const hoverY = HOVER_BY_STRUCTURE[PUBLISHED_PROJECTS[index].structure] ?? 8;
  const gl = useThree((s) => s.gl);
  const down = useRef<{ x: number; y: number } | null>(null);

  return (
    <mesh
      position={[px, (hoverY - 2) / 2, pz]}
      onPointerOver={(e) => {
        e.stopPropagation();
        gl.domElement.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        gl.domElement.style.cursor = "default";
      }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        down.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const d = down.current;
        down.current = null;
        // Treat as a click only if the pointer barely moved.
        if (d && Math.hypot(e.nativeEvent.clientX - d.x, e.nativeEvent.clientY - d.y) > 6) return;
        onOpen(index);
      }}
    >
      <boxGeometry args={[10, hoverY + 6, 10]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export default function Emblems({ active, onOpen }: { active: number; onOpen: (i: number) => void }) {
  const reduced = usePrefersReducedMotion();
  return (
    <>
      {PUBLISHED_PROJECTS.map((p, i) => (
        <Emblem key={p.id} project={p} index={i} active={i === active} reduced={reduced} />
      ))}
      {PUBLISHED_PROJECTS.map((p, i) => (
        <Hitbox key={`hit-${p.id}`} index={i} onOpen={onOpen} />
      ))}
    </>
  );
}
