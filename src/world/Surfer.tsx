import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { T } from "../theme";

// A low-poly surfer — muscular, tanned, long-haired — shared by the free-surf
// board (SurfController) and the water-gap easter-egg board (CameraRig). Rounded
// capsule limbs + a smooth shortboard. The RIDER sits in its own group, exposed
// via `ref`, so SurfController can lean it into carves AND pitch it prone for the
// paddle-in intro each frame without re-rendering React. All meshes opt out of
// raycast; hit-testing (the egg click) lives on the parent group.

const SKIN = "#e3a878"; // tanned
const HAIR = "#6e4a26"; // sun-bleached brown
const BOARD = "#f4ead2";

const Y_UP = new THREE.Vector3(0, 1, 0);

// A capsule limb spanning two points — computes midpoint + orientation so legs
// and arms can be posed by endpoints rather than hand-tuned euler angles.
function Limb({
  a,
  b,
  r,
  color,
  flat = false,
}: {
  a: [number, number, number];
  b: [number, number, number];
  r: number;
  color: string;
  flat?: boolean;
}) {
  const { pos, quat, len } = useMemo(() => {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const dir = new THREE.Vector3().subVectors(to, from);
    const l = dir.length();
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(Y_UP, dir.clone().normalize());
    return { pos: mid, quat: q, len: l };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} raycast={() => null}>
      <capsuleGeometry args={[r, Math.max(0.02, len - r * 2), 4, 10]} />
      <meshStandardMaterial color={color} roughness={0.7} flatShading={flat} />
    </mesh>
  );
}

function Blob({ pos, r, color, scale }: { pos: [number, number, number]; r: number; color: string; scale?: [number, number, number] }) {
  return (
    <mesh position={pos} scale={scale} raycast={() => null}>
      <sphereGeometry args={[r, 12, 10]} />
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  );
}

// A foot: rounded (scaled sphere, not a hard box) and yawed across the board so
// the stance reads as surfing rather than skiing. Toes are a second, smaller blob
// so the silhouette tapers instead of ending in a slab.
function Foot({ pos, yaw }: { pos: [number, number, number]; yaw: number }) {
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <mesh raycast={() => null} scale={[0.15, 0.06, 0.24]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.01, 0.2]} raycast={() => null} scale={[0.12, 0.045, 0.09]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color={SKIN} roughness={0.8} />
      </mesh>
    </group>
  );
}

const Surfer = forwardRef<THREE.Group, { accent?: string }>(function Surfer({ accent = T.blue }, riderRef) {
  return (
    <group>
      {/* ── Shortboard (smooth, rounded nose + tail) ── */}
      <mesh position={[0, 0.06, 0]} scale={[0.52, 0.11, 1.75]} raycast={() => null}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={BOARD} roughness={0.35} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.15, 0]} raycast={() => null}>
        <boxGeometry args={[0.05, 0.03, 3.1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, -0.16, -1.4]} rotation={[0.5, 0, 0]} raycast={() => null}>
        <coneGeometry args={[0.16, 0.44, 4]} />
        <meshStandardMaterial color={accent} flatShading />
      </mesh>

      {/* ── Rider (own group → leaned / pitched by the parent) ── */}
      <group ref={riderRef} position={[0, 0.16, 0]}>
        {/* Feet: a real surf stance. Both were axis-aligned boxes pointing down
            the board like skis, which read as flat and toy-like. Now they are
            rounded and angled off the stringer (front foot open ~35 degrees, back
            foot across ~55) the way a rider actually stands, with short ankles
            joining them to the shins. */}
        <Foot pos={[0.02, 0.05, 0.54]} yaw={0.6} />
        <Foot pos={[-0.04, 0.05, -0.52]} yaw={0.95} />
        <Blob pos={[0.02, 0.14, 0.5]} r={0.1} color={SKIN} scale={[1, 0.9, 1]} />
        <Blob pos={[-0.04, 0.14, -0.48]} r={0.1} color={SKIN} scale={[1, 0.9, 1]} />

        {/* legs: bare shins (skin) + boardshorts on the thighs (accent) */}
        <Limb a={[0.02, 0.12, 0.54]} b={[0.05, 0.46, 0.34]} r={0.14} color={SKIN} />
        <Limb a={[0.05, 0.44, 0.36]} b={[0.02, 0.64, 0.06]} r={0.17} color={accent} />
        <Limb a={[-0.04, 0.12, -0.52]} b={[-0.03, 0.44, -0.28]} r={0.14} color={SKIN} />
        <Limb a={[-0.03, 0.42, -0.3]} b={[-0.02, 0.64, -0.04]} r={0.17} color={accent} />
        {/* boardshorts waistband */}
        <Blob pos={[0.01, 0.64, 0.0]} r={0.24} color={accent} scale={[1, 0.6, 1]} />

        {/* muscular torso (shirtless, tanned) + pecs */}
        <Limb a={[0.0, 0.66, 0.0]} b={[0.05, 1.02, 0.14]} r={0.27} color={SKIN} />
        <Blob pos={[0.14, 0.92, 0.3]} r={0.12} color={SKIN} />
        <Blob pos={[-0.06, 0.92, 0.32]} r={0.12} color={SKIN} />

        {/* broad shoulders (delts) */}
        <Blob pos={[0.32, 1.0, 0.06]} r={0.15} color={SKIN} />
        <Blob pos={[-0.28, 1.02, 0.02]} r={0.15} color={SKIN} />

        {/* thick arms: leading down-forward, trailing up-back for balance */}
        <Limb a={[0.32, 1.0, 0.08]} b={[0.52, 0.6, 0.5]} r={0.12} color={SKIN} />
        <Limb a={[-0.28, 1.02, 0.02]} b={[-0.56, 1.2, -0.36]} r={0.12} color={SKIN} />
        {/* hands: the arms used to just stop mid-air */}
        <Blob pos={[0.53, 0.57, 0.53]} r={0.11} color={SKIN} scale={[0.9, 1, 1.1]} />
        <Blob pos={[-0.59, 1.23, -0.39]} r={0.11} color={SKIN} scale={[0.9, 1, 1.1]} />

        {/* head */}
        <Blob pos={[0.08, 1.22, 0.18]} r={0.17} color={SKIN} />

        {/* long, sun-bleached hair: a crown cap + strands flowing down the back */}
        <Blob pos={[0.06, 1.3, 0.06]} r={0.2} color={HAIR} scale={[1, 0.85, 1.05]} />
        <Limb a={[0.05, 1.34, 0.02]} b={[0.02, 0.82, -0.2]} r={0.07} color={HAIR} flat />
        <Limb a={[0.17, 1.3, 0.05]} b={[0.2, 0.9, -0.12]} r={0.06} color={HAIR} flat />
        <Limb a={[-0.06, 1.3, 0.05]} b={[-0.14, 0.9, -0.12]} r={0.06} color={HAIR} flat />
        <Limb a={[0.22, 1.24, 0.2]} b={[0.27, 0.98, 0.18]} r={0.045} color={HAIR} flat />
      </group>
    </group>
  );
});

export default Surfer;
