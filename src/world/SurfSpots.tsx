import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WATER_Y } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";
import { SURF_SPOTS } from "./surf-spots";

// Low-poly landmarks for the legendary breaks the free-surf ocean tours. Mounted
// by World only while surfing, so the on-rails diorama stays clean and the extra
// geometry never costs anything on the default path. Each break is a handful of
// flat-shaded boxes given life with motion — bobbing waves + buoys, swaying palms,
// circling gulls, a sweeping lighthouse beam, a foam shoreline that grounds it in
// the sea. All motion respects reduced-motion; everything opts out of raycast.

const FOAM = "#dff6f1";
const WAVE_BODY = "#0e6f74";
const SLAB_BODY = "#0b535a";
const ROCK_LIGHT = "#b8ad95";
const ROCK_MID = "#8f8672";
const ROCK_DARK = "#6d6552";
const REEF = "#123a3a";
const REEF_DARK = "#0e2a2e";
const SAND = "#e0cf9a";
const PALM_TRUNK = "#6b4a2b";
const PALM_LEAF = "#2f9a5f";
const GULL = "#0b0d14";

type Vec3 = [number, number, number];

function Slab({ pos, size, color, rot }: { pos: Vec3; size: Vec3; color: string; rot?: Vec3 }) {
  return (
    <mesh position={pos} rotation={rot} raycast={() => null}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

// A stylized breaking wave: a tilted face, a curling foam lip, a foam base washing
// forward. Bobs and rolls so the break heaves like real swell without simulation.
function Wave({
  width,
  height,
  color = WAVE_BODY,
  phase = 0,
  opacity = 0.94,
  curl = 0.55,
}: {
  width: number;
  height: number;
  color?: string;
  phase?: number;
  opacity?: number;
  curl?: number;
}) {
  const g = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (!g.current || reduced) return;
    const t = s.clock.elapsedTime;
    g.current.position.y = Math.sin(t * 1.05 + phase) * 0.45;
    g.current.position.z = Math.sin(t * 0.6 + phase) * 0.6; // the wall heaves in and out
    g.current.rotation.z = Math.sin(t * 0.7 + phase) * 0.03;
  });
  const depth = width * 0.14;
  return (
    <group ref={g}>
      {/* face */}
      <mesh position={[0, height / 2, 0]} rotation={[curl * 0.6, 0, 0]} raycast={() => null}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} flatShading transparent opacity={opacity} />
      </mesh>
      {/* curling foam lip */}
      <mesh position={[0, height * 0.9, depth * 0.7]} rotation={[curl * 1.3, 0, 0]} raycast={() => null}>
        <boxGeometry args={[width, height * 0.34, depth * 0.8]} />
        <meshStandardMaterial color={FOAM} flatShading />
      </mesh>
      {/* foam base washing forward */}
      <mesh position={[0, height * 0.14, depth * 1.1]} raycast={() => null}>
        <boxGeometry args={[width * 1.02, height * 0.22, width * 0.18]} />
        <meshStandardMaterial color={FOAM} flatShading transparent opacity={0.82} />
      </mesh>
    </group>
  );
}

// A faint accent pillar so a break is visible from across the ocean → gives the
// free-surf roam a set of destinations to steer toward.
function Beacon({ color }: { color: string }) {
  return (
    <mesh position={[0, 22, 0]} raycast={() => null}>
      <cylinderGeometry args={[0.5, 0.5, 44, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// A glowing marker buoy bobbing on the swell at the takeoff spot.
function Buoy({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    if (!reduced) ref.current.position.y = 0.7 + Math.sin(t * 1.7) * 0.28;
  });
  return (
    <mesh ref={ref} position={[0, 0.7, 0]} raycast={() => null}>
      <cylinderGeometry args={[0.5, 0.75, 1.5, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} flatShading />
    </mesh>
  );
}

// A soft ring of whitewater at the waterline so the landmark reads as land the
// sea breaks against, not a box dropped on the water.
function Shore({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} raycast={() => null}>
      <ringGeometry args={[radius * 0.78, radius, 44]} />
      <meshBasicMaterial color={FOAM} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// A slow ring of gulls circling overhead — cheap silhouettes, big life.
function Gulls({ radius = 15, height = 15, count = 3 }: { radius?: number; height?: number; count?: number }) {
  const g = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (!g.current || reduced) return;
    g.current.rotation.y = s.clock.elapsedTime * 0.22;
  });
  return (
    <group ref={g}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.cos(a) * radius, height + Math.sin(a * 2) * 1.6, Math.sin(a) * radius]}
            rotation={[0, -a, 0]}
          >
            <mesh position={[-0.45, 0, 0]} rotation={[0, 0, 0.5]} raycast={() => null}>
              <boxGeometry args={[1.1, 0.12, 0.4]} />
              <meshStandardMaterial color={GULL} flatShading />
            </mesh>
            <mesh position={[0.45, 0, 0]} rotation={[0, 0, -0.5]} raycast={() => null}>
              <boxGeometry args={[1.1, 0.12, 0.4]} />
              <meshStandardMaterial color={GULL} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// A palm that sways at the base in the sea breeze.
function Palm({ pos, phase = 0 }: { pos: Vec3; phase?: number }) {
  const g = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (!g.current || reduced) return;
    g.current.rotation.z = Math.sin(s.clock.elapsedTime * 1.1 + phase) * 0.07;
  });
  return (
    <group position={pos}>
      <group ref={g}>
        <Slab pos={[0, 2.5, 0]} size={[0.5, 5, 0.5]} color={PALM_TRUNK} />
        <Slab pos={[0, 5, 0]} size={[3, 0.4, 1]} color={PALM_LEAF} />
        <Slab pos={[0, 5, 0]} size={[1, 0.4, 3]} color={PALM_LEAF} />
        <Slab pos={[0, 5.2, 0]} size={[2.2, 0.4, 2.2]} color="#3fae6b" rot={[0, 0.78, 0]} />
      </group>
    </group>
  );
}

function Cabana({ pos, color }: { pos: Vec3; color: string }) {
  return (
    <group position={pos}>
      <Slab pos={[0, 0.7, 0]} size={[1.6, 1.4, 1.6]} color="#f0ead8" />
      <Slab pos={[0, 1.7, 0]} size={[2.1, 0.5, 2.1]} color={color} />
    </group>
  );
}

// The lighthouse lamp casting a beam that sweeps the horizon.
function LighthouseBeam({ pos }: { pos: Vec3 }) {
  const g = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  useFrame((s) => {
    if (!g.current || reduced) return;
    g.current.rotation.y = s.clock.elapsedTime * 0.8;
  });
  return (
    <group ref={g} position={pos}>
      <mesh position={[9, 0, 0]} rotation={[0, 0, -Math.PI / 2]} raycast={() => null}>
        <coneGeometry args={[2.4, 18, 12, 1, true]} />
        <meshBasicMaterial
          color="#ffe6a0"
          transparent
          opacity={0.11}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Per-break compositions ───────────────────────────────────────────────────

function Nazare() {
  return (
    <group>
      <Shore radius={16} />
      {/* the headland cliff */}
      <Slab pos={[-10, 4, -2]} size={[10, 9, 10]} color={ROCK_MID} />
      <Slab pos={[-10, 9, -2]} size={[7, 3, 7]} color={ROCK_LIGHT} />
      <Slab pos={[-13, 2, 3]} size={[5, 5, 6]} color={ROCK_DARK} />
      {/* the lighthouse on top */}
      <group position={[-10, 11, -2]}>
        <Slab pos={[0, 2, 0]} size={[1.4, 4, 1.4]} color="#eef2f0" />
        <Slab pos={[0, 4.2, 0]} size={[1.8, 0.6, 1.8]} color="#e0552b" />
        <mesh position={[0, 4.9, 0]} raycast={() => null}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffe08a" emissive="#ffe08a" emissiveIntensity={1.3} />
        </mesh>
        <LighthouseBeam pos={[0, 4.9, 0]} />
      </group>
      {/* the giant wave */}
      <group position={[7, 0, 1]}>
        <Wave width={28} height={13} phase={0} curl={0.6} />
      </group>
    </group>
  );
}

function Pipeline() {
  return (
    <group>
      <Shore radius={14} />
      {/* shallow reef shelf */}
      <Slab pos={[0, 0.2, 6]} size={[16, 0.6, 8]} color={REEF} />
      {/* sand cay with palms */}
      <Slab pos={[-8, 0.8, 8]} size={[8, 1.4, 6]} color={SAND} />
      <Palm pos={[-9.5, 1.4, 8]} phase={0} />
      <Palm pos={[-6.5, 1.4, 9.5]} phase={1.3} />
      {/* the barrel */}
      <group position={[2, 0, -2]}>
        <Wave width={20} height={8} curl={0.95} phase={1.4} />
      </group>
    </group>
  );
}

function Teahupoo() {
  return (
    <group>
      <Shore radius={12} />
      {/* dark reef rock at the end of the road */}
      <Slab pos={[9, 0.4, 5]} size={[6, 1.2, 5]} color={REEF_DARK} />
      <Slab pos={[10, 1.4, 6]} size={[3, 2.4, 3]} color={ROCK_DARK} />
      {/* the heavy slab: thick, low, curling hard */}
      <group position={[0, 0, 0]}>
        <Wave width={22} height={7} curl={1.2} phase={0.6} color={SLAB_BODY} opacity={0.96} />
      </group>
    </group>
  );
}

function Impossibles() {
  return (
    <group>
      <Shore radius={15} />
      {/* stacked limestone terraces */}
      <Slab pos={[-11, 3.5, 0]} size={[8, 7, 9]} color={ROCK_LIGHT} />
      <Slab pos={[-7, 1.5, 4]} size={[5, 4, 6]} color={ROCK_MID} />
      <Slab pos={[-14, 5.5, -3]} size={[5, 5, 5]} color={ROCK_MID} />
      <Palm pos={[-9, 7.5, 1]} phase={0.7} />
      {/* the long peeling wall */}
      <group position={[3, 0, 2]} rotation={[0, -0.3, 0]}>
        <Wave width={30} height={7} curl={0.5} phase={2.1} />
      </group>
    </group>
  );
}

function Bondi() {
  return (
    <group>
      <Shore radius={16} />
      {/* crescent of sand */}
      <Slab pos={[0, 0.6, -7]} size={[22, 1.2, 7]} color={SAND} />
      <Slab pos={[-10, 0.6, -4]} size={[7, 1.2, 6]} color={SAND} rot={[0, 0.5, 0]} />
      <Slab pos={[10, 0.6, -4]} size={[7, 1.2, 6]} color={SAND} rot={[0, -0.5, 0]} />
      {/* cabanas */}
      <Cabana pos={[-4, 1.2, -6]} color="#FF0080" />
      <Cabana pos={[0, 1.2, -7]} color="#00CFFF" />
      <Cabana pos={[4, 1.2, -6]} color="#FFD700" />
      {/* the gentle rolling wave */}
      <group position={[0, 0, 3]}>
        <Wave width={22} height={4} curl={0.35} phase={0.9} opacity={0.9} />
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
    </>
  );
}
