import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WATER_Y } from "./geometry";
import Surfer from "./Surfer";
import { nearestSpot, type SurfSpot } from "./surf-spots";

// Free-roam surf mode: hop on a board and steer around the ocean with WASD /
// arrow keys, third-person chase camera. Active only while `active` is true;
// CameraRig goes inert during that time so the two don't fight over the camera.
//
// Space pops an ollie. Pop it while you're on top of a legendary break and you
// drop in and RIDE it — a boosted carve down the wave face. Catching a break is
// the only thing that reveals its name (via onNearSpot); roaming stays unlabelled
// on purpose, so the spots are something you discover, not a signposted tour.
const GRAVITY = 30;
const JUMP_V = 10; // ollie pop
const RIDE_RADIUS = 30; // how close to a break's center counts as "on the wave"
const RIDE_DUR = 3.4; // seconds a caught ride lasts
const REVEAL_HOLD = 5; // seconds the break's name stays on the HUD after catching

export default function SurfController({
  active,
  onNearSpot,
}: {
  active: boolean;
  onNearSpot?: (spot: SurfSpot | null) => void;
}) {
  const board = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(60, WATER_Y + 0.3, 0));
  const heading = useRef(Math.PI); // face back toward the islands
  const speed = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const jumpQueued = useRef(false);
  const vy = useRef(0); // vertical velocity for the ollie
  const airY = useRef(0); // height above the water line
  const riding = useRef(false);
  const rideStart = useRef(0);
  const camTarget = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const camera = useThree((s) => s.camera);
  const regress = useThree((s) => s.performance.regress);
  // Keep the callback in a ref so the frame loop always calls the latest one
  // without re-subscribing effects; track the shown break so the HUD only fires
  // on a real change, and time out the reveal so it fades after a ride.
  const onNearSpotRef = useRef(onNearSpot);
  onNearSpotRef.current = onNearSpot;
  const shownSpotId = useRef<string | null>(null);
  const revealUntil = useRef(0);

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "spacebar") {
        e.preventDefault();
        if (!e.repeat) jumpQueued.current = true; // edge-triggered: one pop per press
        return;
      }
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
    airY.current = 0;
    vy.current = 0;
    riding.current = false;
  }, [active, camera]);

  // Leaving surf mode clears the HUD label.
  useEffect(() => {
    if (!active) {
      shownSpotId.current = null;
      onNearSpotRef.current?.(null);
    }
  }, [active]);

  useFrame((state, dt) => {
    if (!active || !board.current) return;
    const d = Math.min(dt, 0.05); // clamp so a stutter can't launch the board
    const t = state.clock.elapsedTime;
    const k = keys.current;
    const fwd = (k["w"] || k["arrowup"] ? 1 : 0) - (k["s"] || k["arrowdown"] ? 1 : 0);
    const turn = (k["a"] || k["arrowleft"] ? 1 : 0) - (k["d"] || k["arrowright"] ? 1 : 0);

    heading.current += turn * 1.9 * d;
    const targetSpeed = fwd * 18; // units / sec
    speed.current += (targetSpeed - speed.current) * (1 - Math.exp(-3 * d));

    // ── Jump / catch a wave ──────────────────────────────────────────────────
    if (jumpQueued.current) {
      jumpQueued.current = false;
      if (airY.current <= 0.05 && !riding.current) {
        const onSpot = nearestSpot(pos.current.x, pos.current.z, RIDE_RADIUS);
        if (onSpot) {
          // Drop in: catch the break and ride it, revealing its name as a reward.
          riding.current = true;
          rideStart.current = t;
          vy.current = 0;
          shownSpotId.current = onSpot.id;
          revealUntil.current = t + REVEAL_HOLD;
          onNearSpotRef.current?.(onSpot);
        } else {
          vy.current = JUMP_V; // plain ollie out in open water
        }
      }
    }

    // Vertical motion: a scripted carve while riding, else ballistic ollie.
    if (riding.current) {
      const rp = (t - rideStart.current) / RIDE_DUR; // 0..1
      if (rp >= 1) {
        riding.current = false;
        airY.current = 0;
      } else {
        speed.current = Math.max(speed.current, 30); // the wave carries you
        airY.current = Math.abs(Math.sin(rp * Math.PI * 3)) * 3.4 * (1 - rp * 0.6);
      }
    }
    if (!riding.current) {
      vy.current -= GRAVITY * d;
      airY.current += vy.current * d;
      if (airY.current <= 0) {
        airY.current = 0;
        vy.current = 0;
      }
    }

    pos.current.x += Math.sin(heading.current) * speed.current * d;
    pos.current.z += Math.cos(heading.current) * speed.current * d;
    // Keep the surfer within a generous ocean bound.
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -60, 220);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -130, 130);

    const bobY = WATER_Y + 0.3 + Math.sin(t * 2.4) * 0.14;
    board.current.position.set(pos.current.x, bobY + airY.current, pos.current.z);
    const airPitch = airY.current * 0.06; // nose lifts as it leaves the water
    const carveRoll = riding.current ? Math.sin((t - rideStart.current) * 4.2) * 0.45 : 0;
    board.current.rotation.set(
      Math.sin(t * 1.4) * 0.05 - airPitch,
      heading.current,
      turn * -0.18 + Math.sin(t * 1.8) * 0.04 + carveRoll
    );

    // Chase camera: behind + above the board, pulling in tighter while riding.
    const behind = riding.current ? 9 : 12;
    const height = riding.current ? 7.5 : 6;
    camTarget.current.set(
      pos.current.x - Math.sin(heading.current) * behind,
      bobY + height + airY.current * 0.4,
      pos.current.z - Math.cos(heading.current) * behind
    );
    camera.position.lerp(camTarget.current, 1 - Math.exp(-4 * d));
    lookTarget.current.set(pos.current.x, bobY + 1 + airY.current * 0.5, pos.current.z);
    camera.lookAt(lookTarget.current);
    if (Math.abs(speed.current) > 0.5 || turn !== 0 || airY.current > 0.05) regress();

    // Fade the reward label a few seconds after the ride.
    if (shownSpotId.current && t > revealUntil.current) {
      shownSpotId.current = null;
      onNearSpotRef.current?.(null);
    }
  });

  if (!active) return null;
  return (
    <group ref={board}>
      <Surfer />
    </group>
  );
}
