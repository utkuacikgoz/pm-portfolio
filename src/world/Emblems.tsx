import { useEffect, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PUBLISHED_PROJECTS, type Project } from "../projects/projects";
import { EMBLEM_HOVER, islandPosition } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";

// Floating low-poly domain marks make each island legible without depending on
// platform emoji fonts or screen-facing CanvasTexture stickers.

// Hover height per structure: just above each silhouette, kept modest so a tall
// tower's icon doesn't clip at the top of the frame.
function DomainMark({ project }: { project: Project }) {
  const material = {
    color: project.accent,
    emissive: project.accent,
    emissiveIntensity: 0.3,
    roughness: 0.38,
    metalness: 0.16,
  };

  // Each mark faces the fixed iso camera, so it is read as a flat symbol first
  // and a solid second. Yaw is kept small for the same reason: turned far enough
  // and a cross reads as two random slabs.
  switch (project.mark) {
    // A struck coin, standing on edge: fintech.
    case "coin":
      return (
        <group rotation={[0.1, 0.3, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.3, 1.3, 0.3, 16]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh>
            <torusGeometry args={[1.3, 0.11, 6, 20]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.75} />
          </mesh>
          {/* the vertical stroke through a currency glyph */}
          <mesh position={[0, 0, 0.18]}>
            <boxGeometry args={[0.17, 1.55, 0.1]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.95} />
          </mesh>
        </group>
      );
    // A shopping bag with a carry handle: retail.
    case "bag":
      return (
        <group rotation={[0.1, 0.3, 0]}>
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[1.85, 1.7, 0.95]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <torusGeometry args={[0.52, 0.1, 6, 16, Math.PI]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.85} />
          </mesh>
        </group>
      );
    // A medical cross: health.
    case "cross":
      return (
        <group rotation={[0.08, 0.28, 0]}>
          <mesh>
            <boxGeometry args={[0.78, 2.5, 0.6]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh>
            <boxGeometry args={[2.5, 0.78, 0.6]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
        </group>
      );
    // An arcade stick on its deck: games.
    case "joystick":
      return (
        <group rotation={[0.12, 0.32, 0]}>
          <mesh position={[0, -0.85, 0]}>
            <boxGeometry args={[2.1, 0.45, 1.3]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh position={[-0.35, -0.05, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 1.35, 8]} />
            <meshStandardMaterial {...material} flatShading />
          </mesh>
          <mesh position={[-0.35, 0.75, 0]}>
            <sphereGeometry args={[0.38, 10, 8]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.9} flatShading />
          </mesh>
          {[0.45, 0.92].map((x, i) => (
            <mesh key={x} position={[x, -0.55, i === 0 ? 0.3 : -0.25]}>
              <cylinderGeometry args={[0.21, 0.21, 0.16, 10]} />
              <meshStandardMaterial {...material} emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      );
    // Three rising bars under an arrow: a growth curve.
    case "growth":
      return (
        <group rotation={[0.08, 0.3, 0]}>
          {([[-0.9, 0.9], [0, 1.6], [0.9, 2.3]] as const).map(([x, h]) => (
            <mesh key={x} position={[x, -1.25 + h / 2, 0]}>
              <boxGeometry args={[0.58, h, 0.58]} />
              <meshStandardMaterial {...material} flatShading />
            </mesh>
          ))}
          <mesh position={[0.9, 1.4, 0]}>
            <coneGeometry args={[0.46, 0.78, 4]} />
            <meshStandardMaterial {...material} emissiveIntensity={0.9} flatShading />
          </mesh>
        </group>
      );
    // Pre-launch islands have nothing to symbolise yet, so they keep a spark.
    default:
      return (
        <mesh rotation={[0.25, 0.4, 0]}>
          <icosahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial {...material} flatShading />
        </mesh>
      );
  }
}

function Emblem({ project, index, active, reduced, hovered }: { project: Project; index: number; active: boolean; reduced: boolean; hovered: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const [px, , pz] = islandPosition(index);
  const hoverY = EMBLEM_HOVER[project.structure];
  const scale = 0.72;
  const emphasis = useRef(0);
  const ring = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, dt) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    emphasis.current = reduced ? Number(hovered) : THREE.MathUtils.damp(emphasis.current, Number(hovered), 12, Math.min(dt, .05));
    if (ring.current) ring.current.opacity = (active ? .68 : .32) + emphasis.current * (active ? .24 : .5);
    ref.current.position.y = hoverY + (reduced ? 0 : Math.sin(t * 1.1 + index) * 0.3);
    ref.current.scale.setScalar(scale * (1 + (reduced ? 0 : emphasis.current * .12)) * (active && !reduced ? 1 + Math.sin(t * 2.4) * 0.06 : 1));
  });

  return (
    <group ref={ref} position={[px, hoverY, pz]} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[1.8, 1.92, 8]} />
        <meshBasicMaterial ref={ring} color={project.accent} transparent opacity={active ? 0.68 : 0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <DomainMark project={project} />
    </group>
  );
}

// Invisible, generously-sized click target covering each island + its icon.
// Raycast stays ON (unlike Ocean's visual-only meshes) so the structure opens its
// case study. A drag guard suppresses opens that were really camera-orbit drags.
function Hitbox({ index, onOpen, onHover }: { index: number; onOpen: (i: number) => void; onHover: (index: number | null) => void }) {
  const [px, , pz] = islandPosition(index);
  const hoverY = EMBLEM_HOVER[PUBLISHED_PROJECTS[index].structure];
  const gl = useThree((s) => s.gl);
  const down = useRef<{ x: number; y: number } | null>(null);

  return (
    <mesh
      position={[px, (hoverY - 2) / 2, pz]}
      onPointerOver={(e) => {
        if (e.nativeEvent.pointerType === "touch") return;
        e.stopPropagation();
        gl.domElement.style.cursor = "pointer";
        onHover(index);
      }}
      onPointerOut={() => {
        gl.domElement.style.cursor = "default";
        onHover(null);
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
      <boxGeometry args={[18, hoverY + 6, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export default function Emblems({ active, onOpen }: { active: number; onOpen: (i: number) => void }) {
  const reduced = usePrefersReducedMotion();
  const [hover, setHover] = useState<{ index: number | null; active: number } | null>(null);
  const hovered = hover?.active === active ? hover.index : null;
  const gl = useThree(s => s.gl);
  useEffect(() => () => { gl.domElement.style.cursor = "default"; }, [gl, active]);
  return (
    <>
      {PUBLISHED_PROJECTS.map((p, i) => (
        <Emblem key={p.id} project={p} index={i} active={i === active} reduced={reduced} hovered={hovered === i} />
      ))}
      {PUBLISHED_PROJECTS.map((p, i) => (
        <Hitbox key={`hit-${p.id}`} index={i} onOpen={onOpen} onHover={index => setHover({ index, active })} />
      ))}
    </>
  );
}
