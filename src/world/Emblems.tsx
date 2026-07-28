import { useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PUBLISHED_PROJECTS, type Project, type StructureType } from "../projects/projects";
import { islandPosition } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";

// A literal, floating domain icon over each island (a bitcoin over BiLira, a cart
// over Mestores, ...) so the monument's meaning reads at a glance. Emoji/glyphs
// drawn to a CanvasTexture on a camera-facing sprite (always readable), over a
// soft accent halo. Cheap: a couple of sprites per island, textures cached.

// Hover height per structure: just above each silhouette, kept modest so a tall
// tower's icon doesn't clip at the top of the frame.
const HOVER_BY_STRUCTURE: Record<StructureType, number> = {
  tower: 11,
  market: 7,
  campus: 7,
  arcade: 8,
  bridge: 8,
  beacon: 8,
};

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

// ── Cached canvas textures ───────────────────────────────────────────────────
const ICON_SIZE = 256;
function drawGlyph(ctx: CanvasRenderingContext2D, char: string, color: string) {
  ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);
  ctx.font = `${Math.floor(ICON_SIZE * 0.74)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // fillStyle colors plain glyphs (e.g. the bitcoin symbol); color emoji ignore it.
  ctx.fillStyle = color;
  ctx.fillText(char, ICON_SIZE / 2, ICON_SIZE * 0.54);
}

const iconCache = new Map<string, THREE.Texture>();
function iconTexture(char: string, color: string): THREE.Texture {
  const key = char + color;
  const hit = iconCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = ICON_SIZE;
  const ctx = c.getContext("2d")!;
  drawGlyph(ctx, char, color);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  // Emoji fonts often aren't ready on first paint → the glyph draws blank. Redraw
  // once fonts load so icons like the cart actually appear.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    document.fonts.ready.then(() => {
      drawGlyph(ctx, char, color);
      tex.needsUpdate = true;
    });
  }
  iconCache.set(key, tex);
  return tex;
}

const haloCache = new Map<string, THREE.Texture>();
function haloTexture(color: string): THREE.Texture {
  const hit = haloCache.get(color);
  if (hit) return hit;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color + "ee");
  g.addColorStop(0.35, color + "66");
  g.addColorStop(1, color + "00");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  haloCache.set(color, tex);
  return tex;
}

function EmojiEmblem({ project, index, active, reduced }: { project: Project; index: number; active: boolean; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const [px, , pz] = islandPosition(index);
  const hoverY = HOVER_BY_STRUCTURE[project.structure] ?? 8;
  const bright = mix(project.accent, "#ffffff", 0.55);
  const tex = useMemo(() => iconTexture(project.icon ?? "✨", bright), [project.icon, bright]);
  const halo = useMemo(() => haloTexture(project.accent), [project.accent]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = hoverY + (reduced ? 0 : Math.sin(t * 1.1 + index) * 0.3);
    ref.current.scale.setScalar(active && !reduced ? 1 + Math.sin(t * 2.4) * 0.06 : 1);
  });

  return (
    <group ref={ref} position={[px, hoverY, pz]}>
      <sprite scale={[11, 11, 1]} position={[0, 0, -0.1]} raycast={() => null}>
        <spriteMaterial map={halo} transparent depthWrite={false} opacity={active ? 1 : 0.72} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[6.2, 6.2, 1]} raycast={() => null}>
        <spriteMaterial map={tex} transparent depthWrite={false} />
      </sprite>
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
        <EmojiEmblem key={p.id} project={p} index={i} active={i === active} reduced={reduced} />
      ))}
      {PUBLISHED_PROJECTS.map((p, i) => (
        <Hitbox key={`hit-${p.id}`} index={i} onOpen={onOpen} />
      ))}
    </>
  );
}
