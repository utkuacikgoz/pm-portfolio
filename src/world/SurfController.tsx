import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WATER_Y } from "./geometry";

// Free-roam surf mode: hop on a board and steer around the ocean with WASD /
// arrow keys, third-person chase camera. Active only while `active` is true;
// CameraRig goes inert during that time so the two don't fight over the camera.
export default function SurfController({ active }: { active: boolean }) {
  const board = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(60, WATER_Y + 0.3, 0));
  const heading = useRef(Math.PI); // face back toward the islands
  const speed = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const camTarget = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const camera = useThree((s) => s.camera);
  const regress = useThree((s) => s.performance.regress);

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
        keys.current[k] = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.current = {};
    };
  }, [active]);

  // Seed the board near where the camera was looking when surf mode starts.
  useEffect(() => {
    if (!active) return;
    pos.current.set(camera.position.x, WATER_Y + 0.3, camera.position.z - 6);
    heading.current = Math.PI;
    speed.current = 0;
  }, [active, camera]);

  useFrame((state, dt) => {
    if (!active || !board.current) return;
    const d = Math.min(dt, 0.05); // clamp so a stutter can't launch the board
    const k = keys.current;
    const fwd = (k["w"] || k["arrowup"] ? 1 : 0) - (k["s"] || k["arrowdown"] ? 1 : 0);
    const turn = (k["a"] || k["arrowleft"] ? 1 : 0) - (k["d"] || k["arrowright"] ? 1 : 0);

    heading.current += turn * 1.9 * d;
    const targetSpeed = fwd * 18; // units / sec
    speed.current += (targetSpeed - speed.current) * (1 - Math.exp(-3 * d));

    pos.current.x += Math.sin(heading.current) * speed.current * d;
    pos.current.z += Math.cos(heading.current) * speed.current * d;
    // Keep the surfer within a generous ocean bound.
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -60, 220);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -130, 130);

    const t = state.clock.elapsedTime;
    const bobY = WATER_Y + 0.3 + Math.sin(t * 2.4) * 0.14;
    board.current.position.set(pos.current.x, bobY, pos.current.z);
    board.current.rotation.set(Math.sin(t * 1.4) * 0.05, heading.current, turn * -0.18 + Math.sin(t * 1.8) * 0.04);

    // Chase camera: behind + above the board, easing toward the target.
    const behind = 12;
    const height = 6;
    camTarget.current.set(
      pos.current.x - Math.sin(heading.current) * behind,
      bobY + height,
      pos.current.z - Math.cos(heading.current) * behind
    );
    camera.position.lerp(camTarget.current, 1 - Math.exp(-4 * d));
    lookTarget.current.set(pos.current.x, bobY + 1, pos.current.z);
    camera.lookAt(lookTarget.current);
    if (Math.abs(speed.current) > 0.5 || turn !== 0) regress();
  });

  if (!active) return null;
  return (
    <group ref={board}>
      <mesh raycast={() => null}>
        <boxGeometry args={[0.9, 0.18, 3.4]} />
        <meshStandardMaterial color="#ffce54" flatShading />
      </mesh>
      <mesh position={[0, 0.75, -0.2]} raycast={() => null}>
        <boxGeometry args={[0.5, 1.1, 0.5]} />
        <meshStandardMaterial color="#FF0080" flatShading />
      </mesh>
      <mesh position={[0, 1.5, -0.2]} raycast={() => null}>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color="#f0c19c" flatShading />
      </mesh>
    </group>
  );
}
