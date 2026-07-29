import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WATER_Y, rng } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";
import { SURF_SPOTS } from "./surf-spots";
import { surfSignal } from "./surf-signal";
import { COINS, COIN_Y, collectedCoins, CHECKPOINTS } from "./surf-journey";

// Low-poly landmarks for the legendary breaks the free-surf ocean tours. Mounted
// by World only while surfing, so the on-rails diorama stays clean and the extra
// geometry never costs anything on the default path. The realism lives in the
// WAVES: curved, heaving barrels (open half-pipes, not flat boxes) that throw
// spray when you drop in. Landmarks (cliffs, palms, cabanas, lighthouse) frame
// each break. Materials are shared module singletons (no per-mesh material churn)
// and every mesh opts out of raycast; all motion respects reduced-motion.

const FOAM = "#e6f7f2";
const GULL = "#0b0d14";

// ── Shared materials (created once, reused across every spot) ────────────────
const std = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, ...o });

const M = {
  foam: std(FOAM),
  foamSoft: std(FOAM, { transparent: true, opacity: 0.8 }),
  waveBody: std("#0e7f86", { transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  waveSlab: std("#0a4a52", { transparent: true, opacity: 0.95, side: THREE.DoubleSide }),
  waveGentle: std("#1a99a0", { transparent: true, opacity: 0.88, side: THREE.DoubleSide }),
  rockLight: std("#b8ad95"),
  rockMid: std("#8f8672"),
  rockDark: std("#6d6552"),
  reef: std("#123a3a"),
  reefDark: std("#0e2a2e"),
  sand: std("#e0cf9a"),
  trunk: std("#6b4a2b"),
  leaf: std("#2f9a5f"),
  leaf2: std("#3fae6b"),
  gull: std(GULL),
  house: std("#f0ead8"),
  towerWhite: std("#eef2f0", { flatShading: false }),
  towerRed: std("#e0552b"),
  spray: std(FOAM, { transparent: true, opacity: 0.9 }),
} as const;
const LAMP = new THREE.MeshStandardMaterial({ color: "#ffe08a", emissive: "#ffe08a", emissiveIntensity: 1.3 });
const SPRAY_GEO = new THREE.SphereGeometry(0.34, 6, 6);
const SPRAY_N = 10;
// Bitcoin coins: a gold-orange disc with a white ₿ stamped on each face.
const COIN_GEO = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 20);
const COIN_MAT = new THREE.MeshStandardMaterial({ color: "#f2a900", emissive: "#f2a900", emissiveIntensity: 0.35, metalness: 0.7, roughness: 0.35 });
function btcTexture(): THREE.Texture {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (!ctx) return tex;
  ctx.font = `bold ${Math.floor(size * 0.8)}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("₿", size / 2, size * 0.55);
  return tex;
}
const BTC_TEX = btcTexture();
const BTC_GEO = new THREE.PlaneGeometry(1.2, 1.2);
const BTC_MAT = new THREE.MeshBasicMaterial({ map: BTC_TEX, transparent: true });

type Vec3 = [number, number, number];

function Slab({ pos, size, mat, rot }: { pos: Vec3; size: Vec3; mat: THREE.Material; rot?: Vec3 }) {
  return (
    <mesh position={pos} rotation={rot} material={mat} raycast={() => null}>
      <boxGeometry args={size} />
    </mesh>
  );
}

// ── Sculpted landforms ───────────────────────────────────────────────────────
// Natural masses (cliffs, reefs, sand banks) are warped icosahedra rather than
// stacked boxes: organic silhouette, still hard-faceted so they belong to the
// same flat-shaded world as the voxel career islands.
//
// The warp is a pure function of vertex POSITION (phases seeded per rock), not a
// per-vertex random. IcosahedronGeometry is non-indexed, so neighbouring faces
// repeat the same corner vertex — offsetting by position keeps those duplicates
// in lockstep and avoids cracks along every shared edge.
const rockCache = new Map<string, THREE.BufferGeometry>();
function rockGeo(seed: number, detail = 0, ampScale = 1): THREE.BufferGeometry {
  const key = `${seed}:${detail}:${ampScale}`;
  const hit = rockCache.get(key);
  if (hit) return hit;
  const r = rng(seed);
  const a = 0.6 + r() * 2.4;
  const b = 0.6 + r() * 2.4;
  const c = 0.6 + r() * 2.4;
  const pa = r() * Math.PI * 2;
  const pb = r() * Math.PI * 2;
  const pc = r() * Math.PI * 2;
  const amp = (0.16 + r() * 0.14) * ampScale;
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * a + pa) * Math.cos(v.y * b + pb) * Math.sin(v.z * c + pc);
    const k = 1 + n * amp;
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  rockCache.set(key, g);
  return g;
}

// `size` is full extents, matching Slab, so a Slab can be swapped for a Rock
// without moving anything — the unit geometry has radius 1, hence the halving.
function Rock({
  pos,
  size,
  mat,
  rot,
  seed,
  detail = 0,
  ampScale = 1,
}: {
  pos: Vec3;
  size: Vec3;
  mat: THREE.Material;
  rot?: Vec3;
  seed: number;
  detail?: number;
  ampScale?: number;
}) {
  return (
    <mesh
      position={pos}
      rotation={rot}
      scale={[size[0] / 2, size[1] / 2, size[2] / 2]}
      geometry={rockGeo(seed, detail, ampScale)}
      material={mat}
      raycast={() => null}
    />
  );
}

// A curved breaking wave: an open half-pipe cylinder (crest along X, concave face
// opening toward +Z) with a foam lip + a whitewater wash, heaving on the swell.
// Throws a spray burst when the matching break is caught (via surfSignal).
function Barrel({
  spotId,
  width,
  radius,
  mat,
  phase = 0,
}: {
  spotId: string;
  width: number;
  radius: number;
  mat: THREE.Material;
  phase?: number;
}) {
  const g = useRef<THREE.Group>(null);
  const spray = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  const baseY = radius * 0.92;
  const dirs = useMemo(
    () =>
      Array.from({ length: SPRAY_N }, () => ({
        x: (Math.random() * 2 - 1) * 1.2,
        y: 0.6 + Math.random(),
        z: 0.4 + Math.random() * 1.4,
        r: 0.5 + Math.random(),
      })),
    []
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (g.current && !reduced) {
      g.current.position.y = baseY + Math.sin(t * 1.0 + phase) * 0.4;
      g.current.position.z = Math.sin(t * 0.55 + phase) * 0.7; // the wall heaves
      g.current.rotation.x = Math.sin(t * 0.6 + phase) * 0.03;
    }
    if (spray.current) {
      const active = surfSignal.rideSpotId === spotId && !reduced;
      const age = t - surfSignal.rideStart;
      const on = active && age >= 0 && age < 0.9;
      spray.current.visible = on;
      if (on) {
        const p = age / 0.9;
        for (let i = 0; i < spray.current.children.length; i++) {
          const m = spray.current.children[i] as THREE.Mesh;
          const dd = dirs[i];
          m.position.set(dd.x * 4 * p, radius + dd.y * 6 * p - p * p * 3.5, dd.z * p * 3);
          m.scale.setScalar(Math.max(0.001, (1 - p) * dd.r));
        }
      }
    }
  });
  const thetaStart = -0.12 * Math.PI;
  const thetaLength = 1.16 * Math.PI; // just past vertical → an overhanging lip
  return (
    <group ref={g} position={[0, baseY, 0]}>
      {/* the curling face */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={mat} raycast={() => null}>
        <cylinderGeometry args={[radius, radius, width, 22, 1, true, thetaStart, thetaLength]} />
      </mesh>
      {/* foam lip along the overhang */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={M.foam} raycast={() => null}>
        <cylinderGeometry args={[radius * 1.02, radius * 1.02, width, 22, 1, true, 0.72 * Math.PI, 0.34 * Math.PI]} />
      </mesh>
      {/* whitewater wash at the base, in front */}
      <mesh position={[0, -radius * 0.75, radius * 0.7]} material={M.foamSoft} raycast={() => null}>
        <boxGeometry args={[width * 1.02, radius * 0.5, radius * 0.6]} />
      </mesh>
      {/* spray burst on drop-in */}
      <group ref={spray} visible={false}>
        {dirs.map((_, i) => (
          <mesh key={i} geometry={SPRAY_GEO} material={M.spray} raycast={() => null} />
        ))}
      </group>
    </group>
  );
}

function Beacon({ color }: { color: string }) {
  return (
    <mesh position={[0, 22, 0]} raycast={() => null}>
      <cylinderGeometry args={[0.5, 0.5, 44, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function Buoy({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (ref.current && !reduced) ref.current.position.y = 0.7 + Math.sin(s.clock.elapsedTime * 1.7) * 0.28;
  });
  return (
    <mesh ref={ref} position={[0, 0.7, 0]} raycast={() => null}>
      <cylinderGeometry args={[0.5, 0.75, 1.5, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} flatShading />
    </mesh>
  );
}

function Shore({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} material={M.foamSoft} raycast={() => null}>
      <ringGeometry args={[radius * 0.78, radius, 44]} />
    </mesh>
  );
}

function Gulls({ radius = 15, height = 15, count = 3 }: { radius?: number; height?: number; count?: number }) {
  const g = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (g.current && !reduced) g.current.rotation.y = s.clock.elapsedTime * 0.22;
  });
  return (
    <group ref={g}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * radius, height + Math.sin(a * 2) * 1.6, Math.sin(a) * radius]} rotation={[0, -a, 0]}>
            <mesh position={[-0.45, 0, 0]} rotation={[0, 0, 0.5]} material={M.gull} raycast={() => null}>
              <boxGeometry args={[1.1, 0.12, 0.4]} />
            </mesh>
            <mesh position={[0.45, 0, 0]} rotation={[0, 0, -0.5]} material={M.gull} raycast={() => null}>
              <boxGeometry args={[1.1, 0.12, 0.4]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Palm({ pos, phase = 0 }: { pos: Vec3; phase?: number }) {
  const g = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (g.current && !reduced) g.current.rotation.z = Math.sin(s.clock.elapsedTime * 1.1 + phase) * 0.07;
  });
  return (
    <group position={pos}>
      <group ref={g}>
        <Slab pos={[0, 2.5, 0]} size={[0.5, 5, 0.5]} mat={M.trunk} />
        <Slab pos={[0, 5, 0]} size={[3, 0.4, 1]} mat={M.leaf} />
        <Slab pos={[0, 5, 0]} size={[1, 0.4, 3]} mat={M.leaf} />
        <Slab pos={[0, 5.2, 0]} size={[2.2, 0.4, 2.2]} mat={M.leaf2} rot={[0, 0.78, 0]} />
      </group>
    </group>
  );
}

function Cabana({ pos, color }: { pos: Vec3; color: string }) {
  return (
    <group position={pos}>
      <Slab pos={[0, 0.7, 0]} size={[1.6, 1.4, 1.6]} mat={M.house} />
      <mesh position={[0, 1.7, 0]} raycast={() => null}>
        <boxGeometry args={[2.1, 0.5, 2.1]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </group>
  );
}

function LighthouseBeam() {
  const g = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (g.current && !reduced) g.current.rotation.y = s.clock.elapsedTime * 0.8;
  });
  return (
    <group ref={g}>
      <mesh position={[9, 0, 0]} rotation={[0, 0, -Math.PI / 2]} raycast={() => null}>
        <coneGeometry args={[2.4, 18, 12, 1, true]} />
        <meshBasicMaterial color="#ffe6a0" transparent opacity={0.11} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Per-break compositions ───────────────────────────────────────────────────

function Nazare() {
  return (
    <group>
      <Shore radius={16} />
      <Rock pos={[-10, 4, -2]} size={[10, 9, 10]} mat={M.rockMid} seed={11} detail={1} />
      <Rock pos={[-10, 9, -2]} size={[7, 3, 7]} mat={M.rockLight} seed={12} />
      <Rock pos={[-13, 2, 3]} size={[5, 5, 6]} mat={M.rockDark} seed={13} rot={[0, 0.6, 0]} />
      <group position={[-10, 11, -2]}>
        <Slab pos={[0, 2, 0]} size={[1.4, 4, 1.4]} mat={M.towerWhite} />
        <Slab pos={[0, 4.2, 0]} size={[1.8, 0.6, 1.8]} mat={M.towerRed} />
        <mesh position={[0, 4.9, 0]} material={LAMP} raycast={() => null}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
        <LighthouseBeam />
      </group>
      {/* the giant wave — Nazare is THE big one: one enormous barrel */}
      <group position={[9, 0, 2]} rotation={[0, Math.PI, 0]}>
        <Barrel spotId="nazare" width={42} radius={18} mat={M.waveBody} phase={0} />
      </group>
    </group>
  );
}

function Pipeline() {
  return (
    <group>
      <Shore radius={14} />
      <Rock pos={[0, 0.2, 6]} size={[16, 0.6, 8]} mat={M.reef} seed={21} ampScale={0.6} />
      <Rock pos={[-8, 0.8, 8]} size={[8, 1.4, 6]} mat={M.sand} seed={22} ampScale={0.5} />
      <Palm pos={[-9.5, 1.4, 8]} phase={0} />
      <Palm pos={[-6.5, 1.4, 9.5]} phase={1.3} />
      {/* the barrel */}
      <group position={[2, 0, -2]} rotation={[0, Math.PI, 0]}>
        <Barrel spotId="pipeline" width={20} radius={7} mat={M.waveBody} phase={1.4} />
      </group>
    </group>
  );
}

function Teahupoo() {
  return (
    <group>
      <Shore radius={12} />
      <Rock pos={[9, 0.4, 5]} size={[6, 1.2, 5]} mat={M.reefDark} seed={31} ampScale={0.6} />
      <Rock pos={[10, 1.4, 6]} size={[3, 2.4, 3]} mat={M.rockDark} seed={32} />
      {/* the heavy slab */}
      <group position={[0, 0, -4]}>
        <Barrel spotId="teahupoo" width={22} radius={6.5} mat={M.waveSlab} phase={0.6} />
      </group>
    </group>
  );
}

function Impossibles() {
  return (
    <group>
      <Shore radius={15} />
      <Rock pos={[-11, 3.5, 0]} size={[8, 7, 9]} mat={M.rockLight} seed={41} detail={1} />
      <Rock pos={[-7, 1.5, 4]} size={[5, 4, 6]} mat={M.rockMid} seed={42} rot={[0, -0.4, 0]} />
      <Rock pos={[-14, 5.5, -3]} size={[5, 5, 5]} mat={M.rockMid} seed={43} />
      <Palm pos={[-9, 7.5, 1]} phase={0.7} />
      {/* the long peeling wall */}
      <group position={[4, 0, 3]} rotation={[0, -0.6, 0]}>
        <Barrel spotId="impossibles" width={30} radius={6} mat={M.waveGentle} phase={2.1} />
      </group>
    </group>
  );
}

function Bondi() {
  return (
    <group>
      <Shore radius={16} />
      <Rock pos={[0, 0.6, -7]} size={[22, 1.2, 7]} mat={M.sand} seed={51} ampScale={0.4} />
      <Rock pos={[-10, 0.6, -4]} size={[7, 1.2, 6]} mat={M.sand} seed={52} rot={[0, 0.5, 0]} ampScale={0.4} />
      <Rock pos={[10, 0.6, -4]} size={[7, 1.2, 6]} mat={M.sand} seed={53} rot={[0, -0.5, 0]} ampScale={0.4} />
      <Cabana pos={[-4, 1.2, -6]} color="#6E86D6" />
      <Cabana pos={[0, 1.2, -7]} color="#6E86D6" />
      <Cabana pos={[4, 1.2, -6]} color="#E0A45C" />
      {/* gentle rolling wave */}
      <group position={[0, 0, 3]}>
        <Barrel spotId="bondi" width={22} radius={4} mat={M.waveGentle} phase={0.9} />
      </group>
    </group>
  );
}

function Landmark({ id }: { id: string }) {
  switch (id) {
    case "nazare":
      return <Nazare />;
    case "pipeline":
      return <Pipeline />;
    case "teahupoo":
      return <Teahupoo />;
    case "impossibles":
      return <Impossibles />;
    case "bondi":
      return <Bondi />;
    default:
      return null;
  }
}

// Collectible coins strewn along the journey; spin, and hide once collected
// (SurfController owns collection via the shared collectedCoins set).
function Coins() {
  const ref = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    const kids = ref.current.children;
    for (let i = 0; i < kids.length; i++) {
      const g = kids[i];
      g.visible = !collectedCoins.has(COINS[i].id);
      if (!reduced) g.rotation.y = t * 2.5 + i * 0.7;
    }
  });
  return (
    <group ref={ref}>
      {COINS.map((c) => (
        <group key={c.id} position={[c.x, COIN_Y, c.z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} geometry={COIN_GEO} material={COIN_MAT} raycast={() => null} />
          <mesh position={[0, 0, 0.11]} geometry={BTC_GEO} material={BTC_MAT} raycast={() => null} />
          <mesh position={[0, 0, -0.11]} rotation={[0, Math.PI, 0]} geometry={BTC_GEO} material={BTC_MAT} raycast={() => null} />
        </group>
      ))}
    </group>
  );
}

// Checkpoint gates: two glowing posts + a beam, marking a "how I work" card.
function Checkpoints() {
  return (
    <group>
      {CHECKPOINTS.map((c) => (
        <group key={c.id} position={[c.x, WATER_Y, c.z]} rotation={[0, c.angle, 0]}>
          <mesh position={[-3.6, 4, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.4, 0.4, 8, 8]} />
            <meshStandardMaterial color={c.accent} emissive={c.accent} emissiveIntensity={0.7} flatShading />
          </mesh>
          <mesh position={[3.6, 4, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.4, 0.4, 8, 8]} />
            <meshStandardMaterial color={c.accent} emissive={c.accent} emissiveIntensity={0.7} flatShading />
          </mesh>
          <mesh position={[0, 8, 0]} raycast={() => null}>
            <boxGeometry args={[7.6, 0.5, 0.5]} />
            <meshStandardMaterial color={c.accent} emissive={c.accent} emissiveIntensity={0.6} flatShading />
          </mesh>
          <mesh position={[0, 14, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.5, 0.5, 28, 6]} />
            <meshBasicMaterial color={c.accent} transparent opacity={0.09} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function SurfSpots() {
  return (
    <>
      {SURF_SPOTS.map((s) => (
        <group key={s.id} position={[s.pos[0], WATER_Y, s.pos[1]]}>
          <Beacon color={s.accent} />
          <Buoy color={s.accent} />
          <Gulls />
          <Landmark id={s.id} />
        </group>
      ))}
      <Coins />
      <Checkpoints />
    </>
  );
}
