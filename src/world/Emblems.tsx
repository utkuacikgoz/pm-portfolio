import { useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PUBLISHED_PROJECTS, type Project, type StructureType } from "../projects/projects";
import { islandPosition } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";

// Hover just above each structure type so the emblem reads as part of it.
const HOVER_BY_STRUCTURE: Record<StructureType, number> = {
  tower: 12,
  market: 5,
  campus: 5,
  arcade: 8,
  bridge: 7,
  beacon: 8,
};

// Floating, themed, spinnable icon per project. Separate from the big
// InstancedMesh so the active one can rotate / be dragged. Cube counts are tiny
// (~6 each), so the handful of extra draw calls is negligible.

type Cubelet = { pos: [number, number, number]; scale: [number, number, number]; bright?: boolean };

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return (
    "#" +
    pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")
  );
}

// Emblem layouts keyed by project id (recognizable themed shapes).
function emblemCubes(id: string): Cubelet[] {
  switch (id) {
    case "bilira": // crypto/fintech — a gem / token
      return [
        { pos: [0, 0, 0], scale: [1.1, 0.5, 1.1], bright: true },
        { pos: [0, 0.55, 0], scale: [0.6, 0.6, 0.6], bright: true },
        { pos: [0, -0.55, 0], scale: [0.6, 0.6, 0.6] },
      ];
    case "mestores": // e-commerce — a shopping bag
      return [
        { pos: [0, 0, 0], scale: [1.3, 1.2, 0.9] },
        { pos: [-0.45, 0.85, 0], scale: [0.2, 0.6, 0.2], bright: true },
        { pos: [0.45, 0.85, 0], scale: [0.2, 0.6, 0.2], bright: true },
      ];
    case "apollo": // healthcare — a plus / cross
      return [
        { pos: [0, 0, 0], scale: [0.7, 0.7, 0.7], bright: true },
        { pos: [0, 0.8, 0], scale: [0.7, 0.7, 0.7], bright: true },
        { pos: [0, -0.8, 0], scale: [0.7, 0.7, 0.7], bright: true },
        { pos: [0.8, 0, 0], scale: [0.7, 0.7, 0.7], bright: true },
        { pos: [-0.8, 0, 0], scale: [0.7, 0.7, 0.7], bright: true },
      ];
    case "la3eb": // gaming — an arcade joystick
      return [
        { pos: [0, -0.8, 0], scale: [1, 0.3, 1] },
        { pos: [0, -0.1, 0], scale: [0.35, 1, 0.35] },
        { pos: [0, 0.6, 0], scale: [0.7, 0.7, 0.7], bright: true },
      ];
    case "upshift": // HR marketplace — an up arrow
      return [
        { pos: [0, -0.3, 0], scale: [0.4, 1.3, 0.4] },
        { pos: [0, 0.6, 0], scale: [0.4, 0.4, 0.4], bright: true },
        { pos: [-0.45, 0.45, 0], scale: [0.4, 0.4, 0.4], bright: true },
        { pos: [0.45, 0.45, 0], scale: [0.4, 0.4, 0.4], bright: true },
      ];
    default: // generic spark (indie placeholders until they get a custom mark)
      return [
        { pos: [0, 0, 0], scale: [0.9, 0.9, 0.9], bright: true },
        { pos: [0, 0.9, 0], scale: [0.3, 0.3, 0.3], bright: true },
        { pos: [0.9, 0, 0], scale: [0.3, 0.3, 0.3] },
        { pos: [-0.9, 0, 0], scale: [0.3, 0.3, 0.3] },
      ];
  }
}

function Emblem({
  project,
  index,
  active,
  hovered,
  reduced,
}: {
  project: Project;
  index: number;
  active: boolean;
  hovered: boolean;
  reduced: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const [px, , pz] = islandPosition(index);
  const cubes = emblemCubes(project.id);
  const bright = mix(project.accent, "#ffffff", 0.45);
  const hoverY = HOVER_BY_STRUCTURE[project.structure] ?? 8;
  const lift = hovered ? 0.7 : 0;

  useFrame((state, dt) => {
    if (!ref.current) return;
    spin.current += dt * (active || hovered ? 0.6 : 0.22);
    ref.current.rotation.y = spin.current;
    const t = state.clock.elapsedTime;
    ref.current.position.y = hoverY + lift + Math.sin(t * 1.1 + index) * 0.2;

    // The active island's emblem breathes: emissive pulse + gentle scale swell.
    // (Inactive emblems keep the static JSX emissiveIntensity; React resets it
    // when `active` flips back to false.)
    if (active && !reduced) {
      const pulse = 0.6 + Math.sin(t * 3.2) * 0.3;
      ref.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.05);
      for (const child of ref.current.children) {
        const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m) m.emissiveIntensity = pulse;
      }
    } else if (ref.current.scale.x !== 1) {
      ref.current.scale.setScalar(1);
    }
  });

  return (
    <group ref={ref} position={[px, hoverY, pz]}>
      {cubes.map((c, i) => (
        <mesh key={i} position={c.pos} scale={c.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={c.bright ? bright : project.accent}
            emissive={c.bright ? bright : project.accent}
            emissiveIntensity={active || hovered ? 0.6 : 0.22}
            flatShading
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// Invisible, generously-sized click target covering each island + its emblem.
// Raycast stays ON (unlike Ocean's visual-only meshes) so the structure opens its
// case study. A drag guard suppresses opens that were really camera-orbit drags.
function Hitbox({
  index,
  onOpen,
  onHover,
}: {
  index: number;
  onOpen: (i: number) => void;
  onHover: (i: number | null) => void;
}) {
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
        onHover(index);
      }}
      onPointerOut={() => {
        gl.domElement.style.cursor = "grab";
        onHover(null);
      }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        down.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const d = down.current;
        down.current = null;
        // Treat as a click only if the pointer barely moved — otherwise it was a drag.
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
  const [hovered, setHovered] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();
  return (
    <>
      {PUBLISHED_PROJECTS.map((p, i) => (
        <Emblem key={p.id} project={p} index={i} active={i === active} hovered={i === hovered} reduced={reduced} />
      ))}
      {PUBLISHED_PROJECTS.map((p, i) => (
        <Hitbox key={`hit-${p.id}`} index={i} onOpen={onOpen} onHover={setHovered} />
      ))}
    </>
  );
}
