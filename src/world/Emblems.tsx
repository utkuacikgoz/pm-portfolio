import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PUBLISHED_PROJECTS, type Project } from "../projects/projects";
import { islandPosition } from "./geometry";

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

const HOVER_Y = 9;

function Emblem({ project, index, active }: { project: Project; index: number; active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const dragging = useRef(false);
  const [px, , pz] = islandPosition(index);
  const cubes = emblemCubes(project.id);
  const bright = mix(project.accent, "#ffffff", 0.45);

  useFrame((state, dt) => {
    if (!ref.current) return;
    if (!dragging.current) spin.current += dt * (active ? 0.6 : 0.22);
    ref.current.rotation.y = spin.current;
    ref.current.position.y = HOVER_Y + Math.sin(state.clock.elapsedTime * 1.1 + index) * 0.25;
  });

  // Robust drag: while pointer is down, track at the window level so leaving the
  // mesh mid-drag doesn't drop it. Only the active emblem is interactive.
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!active) return;
    e.stopPropagation();
    dragging.current = true;
    let last = e.nativeEvent.clientX;
    const move = (ev: PointerEvent) => {
      spin.current += (ev.clientX - last) * 0.01;
      last = ev.clientX;
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <group
      ref={ref}
      position={[px, HOVER_Y, pz]}
      onPointerDown={onDown}
      onPointerOver={active ? () => (document.body.style.cursor = "grab") : undefined}
      onPointerOut={active ? () => (document.body.style.cursor = "auto") : undefined}
    >
      {cubes.map((c, i) => (
        <mesh key={i} position={c.pos} scale={c.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={c.bright ? bright : project.accent}
            emissive={c.bright ? bright : project.accent}
            emissiveIntensity={active ? 0.6 : 0.22}
            flatShading
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Emblems({ active }: { active: number }) {
  return (
    <>
      {PUBLISHED_PROJECTS.map((p, i) => (
        <Emblem key={p.id} project={p} index={i} active={i === active} />
      ))}
    </>
  );
}
