import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SPACING, WATER_Y, islandPosition, seaHeight } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";
import { T } from "../theme";

/**
 * Ambient life for the rail diorama: a few sailboats working the channels
 * between islands and a small flock wheeling beside the active island. Pure
 * decoration, so it is cheap by construction: ten small meshes, shared
 * geometries and materials, no per-frame allocation, nothing raycastable, and
 * frozen in place for reduced motion.
 *
 * No clouds: from the rail's iso angle the only sky in frame is the band the
 * story caption and the RESUME link sit in, and anything drifting there
 * competes with the one line a recruiter has to read.
 */
export default function Ambient({ active }: { active: number }) {
  return (
    <group>
      <Boats />
      <Flock active={active} />
    </group>
  );
}

const noRaycast = () => null;

// ── Sailboats ────────────────────────────────────────────────────────────────
const HULL = new THREE.BoxGeometry(1.6, 0.35, 0.6);
const SAIL = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 1.7, 0, 0.9, 0.1, 0], 3));
  g.computeVertexNormals();
  return g;
})();
const HULL_MAT = new THREE.MeshStandardMaterial({ color: T.inkRaised, roughness: 0.8, flatShading: true });
const SAIL_MAT = new THREE.MeshStandardMaterial({ color: T.textSoft, roughness: 0.9, side: THREE.DoubleSide });

// Each boat sails a slow ellipse in the open water beside a channel.
const BOATS = [
  { cx: SPACING * 0.5, cz: 12, rx: 7, rz: 3, speed: 0.05, phase: 0 },
  { cx: SPACING * 2.5, cz: -11, rx: 8, rz: 3.5, speed: 0.04, phase: 2.1 },
  { cx: SPACING * 3.6, cz: 13, rx: 6, rz: 2.5, speed: 0.06, phase: 4.2 },
];

function Boats() {
  const reduced = usePrefersReducedMotion();
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = reduced ? 0 : clock.elapsedTime;
    BOATS.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = b.phase + t * b.speed;
      const x = b.cx + Math.cos(a) * b.rx;
      const z = b.cz + Math.sin(a) * b.rz;
      g.position.set(x, WATER_Y + seaHeight(x, z, t) + 0.15, z);
      // Bow along the direction of travel (the ellipse's tangent), with a roll.
      g.rotation.set(Math.sin(t * 1.3 + i) * 0.06, Math.atan2(-b.rz * Math.cos(a), -b.rx * Math.sin(a)) + Math.PI, Math.sin(t * 1.1 + i) * 0.08);
    });
  });
  return (
    <>
      {BOATS.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <mesh geometry={HULL} material={HULL_MAT} raycast={noRaycast} />
          <mesh geometry={SAIL} material={SAIL_MAT} position={[-0.2, 0.15, 0]} raycast={noRaycast} />
        </group>
      ))}
    </>
  );
}

// ── Flock ────────────────────────────────────────────────────────────────────
const WING = new THREE.BoxGeometry(0.32, 0.03, 0.1);
const BIRD_MAT = new THREE.MeshBasicMaterial({ color: T.inkRaised, transparent: true, opacity: 0.8 });
const BIRDS = Array.from({ length: 7 }, (_, i) => ({
  offset: i * 0.42,
  radius: 5 + (i % 3) * 0.9,
  height: 5.5 + (i % 4) * 0.5,
  flap: 7 + (i % 3),
}));

// The flock wheels in the open water to the left of whichever island is
// active (screen left at this iso angle is -x, +z), low enough to stay below
// the caption band, so it is in shot wherever the rail camera stops.
function Flock({ active }: { active: number }) {
  const reduced = usePrefersReducedMotion();
  const center = useRef(new THREE.Vector3(...islandPosition(active)));
  const target = useRef(new THREE.Vector3());
  const birds = useRef<(THREE.Group | null)[]>([]);
  const left = useRef<(THREE.Group | null)[]>([]);
  const right = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }, dt) => {
    const t = reduced ? 0 : clock.elapsedTime;
    const [ax, , az] = islandPosition(active);
    target.current.set(ax - 8, 0, az + 8);
    center.current.lerp(target.current, reduced ? 1 : 1 - Math.exp(-0.8 * Math.min(dt, 0.05)));
    BIRDS.forEach((b, i) => {
      const g = birds.current[i];
      if (!g) return;
      const a = t * 0.35 - b.offset;
      g.position.set(center.current.x + Math.cos(a) * b.radius * 1.6, b.height + Math.sin(t * 0.7 + i) * 0.4, center.current.z + Math.sin(a) * b.radius);
      g.rotation.y = -a; // face along the circle
      const w = reduced ? 0.25 : Math.sin(t * b.flap + i) * 0.6;
      left.current[i]?.rotation.set(0, 0, w);
      right.current[i]?.rotation.set(0, 0, -w);
    });
  });
  return (
    <>
      {BIRDS.map((_, i) => (
        <group key={i} ref={(el) => { birds.current[i] = el; }}>
          {/* Each wing hangs off a pivot at the body, so it flaps rather than seesaws. */}
          <group ref={(el) => { left.current[i] = el; }}>
            <mesh geometry={WING} material={BIRD_MAT} position={[-0.16, 0, 0]} raycast={noRaycast} />
          </group>
          <group ref={(el) => { right.current[i] = el; }}>
            <mesh geometry={WING} material={BIRD_MAT} position={[0.16, 0, 0]} raycast={noRaycast} />
          </group>
        </group>
      ))}
    </>
  );
}
