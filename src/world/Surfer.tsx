import { forwardRef, useMemo } from "react";
import * as THREE from "three";

// A low-poly surfer in a real surf crouch, shared by the free-surf board
// (SurfController) and the water-gap easter-egg board (CameraRig). Rounded
// primitives (capsule limbs, a smooth shortboard, a sphere head) instead of the
// old blocky voxel, so it reads as a person carving, not a Minecraft figure.
//
// The parent owns position / bob / heading. The RIDER sits in its own group,
// exposed via `ref`, so SurfController can lean it into carves each frame without
// re-rendering React (CameraRig just leaves it upright). All meshes opt out of
// raycast; hit-testing (the egg click) lives on the parent group.

const SKIN = "#f0c19c";
const HAIR = "#2f2016";
const WETSUIT = "#0e5a63";
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
      <meshStandardMaterial color={color} roughness={0.72} flatShading={flat} />
    </mesh>
  );
}

const Surfer = forwardRef<THREE.Group, { accent?: string }>(function Surfer({ accent = "#FF0080" }, riderRef) {
  return (
    <group>
      {/* ── Shortboard (smooth, rounded nose + tail) ── */}
      <mesh position={[0, 0.06, 0]} scale={[0.52, 0.11, 1.75]} raycast={() => null}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={BOARD} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* stringer stripe */}
      <mesh position={[0, 0.15, 0]} raycast={() => null}>
        <boxGeometry args={[0.05, 0.03, 3.1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
      </mesh>
      {/* fin */}
      <mesh position={[0, -0.16, -1.4]} rotation={[0.5, 0, 0]} raycast={() => null}>
        <coneGeometry args={[0.16, 0.44, 4]} />
        <meshStandardMaterial color={accent} flatShading />
      </mesh>

      {/* ── Rider (own group → leaned into carves by the parent) ── */}
      <group ref={riderRef} position={[0, 0.16, 0]}>
        {/* feet */}
        <mesh position={[0.02, 0.05, 0.52]} raycast={() => null}>
          <boxGeometry args={[0.26, 0.12, 0.44]} />
          <meshStandardMaterial color={WETSUIT} roughness={0.8} />
        </mesh>
        <mesh position={[-0.04, 0.05, -0.5]} raycast={() => null}>
          <boxGeometry args={[0.26, 0.12, 0.44]} />
          <meshStandardMaterial color={WETSUIT} roughness={0.8} />
        </mesh>

        {/* front leg (bent: thigh + shin) */}
        <Limb a={[0.02, 0.12, 0.52]} b={[0.05, 0.46, 0.34]} r={0.13} color={WETSUIT} />
        <Limb a={[0.05, 0.46, 0.34]} b={[0.02, 0.62, 0.06]} r={0.14} color={WETSUIT} />
        {/* back leg (bent) */}
        <Limb a={[-0.04, 0.12, -0.5]} b={[-0.03, 0.44, -0.28]} r={0.13} color={WETSUIT} />
        <Limb a={[-0.03, 0.44, -0.28]} b={[-0.02, 0.62, -0.04]} r={0.14} color={WETSUIT} />

        {/* torso, crouched forward */}
        <Limb a={[0, 0.6, 0]} b={[0.06, 1.0, 0.16]} r={0.2} color={WETSUIT} />
        {/* accent chest panel */}
        <mesh position={[0.06, 0.86, 0.22]} rotation={[0.5, 0, 0]} raycast={() => null}>
          <capsuleGeometry args={[0.15, 0.24, 4, 10]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>

        {/* arms: leading arm reaching down-forward, trailing arm up-back for balance */}
        <Limb a={[0.18, 0.98, 0.2]} b={[0.42, 0.62, 0.5]} r={0.09} color={SKIN} />
        <Limb a={[-0.12, 0.98, 0.06]} b={[-0.48, 1.16, -0.34]} r={0.09} color={SKIN} />

        {/* head + hair */}
        <mesh position={[0.09, 1.18, 0.2]} raycast={() => null}>
          <sphereGeometry args={[0.17, 14, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh position={[0.08, 1.26, 0.17]} scale={[1, 0.72, 1]} raycast={() => null}>
          <sphereGeometry args={[0.185, 12, 10]} />
          <meshStandardMaterial color={HAIR} roughness={0.9} flatShading />
        </mesh>
      </group>
    </group>
  );
});

export default Surfer;
