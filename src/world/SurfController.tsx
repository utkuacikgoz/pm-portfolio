import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WATER_Y, seaHeight } from "./geometry";
import Surfer from "./Surfer";
import { nearestTakeoff, type SurfSpot } from "./surf-spots";
import { surfSignal } from "./surf-signal";
import { SURF_COLLIDERS, COINS, CHECKPOINTS, collectedCoins, resetJourney, type Checkpoint } from "./surf-journey";
import { sfx } from "../audio/sfx";

// Free-roam surf mode: hop on a board and steer around the ocean with WASD /
// arrow keys, third-person chase camera. Active only while `active` is true;
// CameraRig goes inert during that time so the two don't fight over the camera.
//
// Reach a legendary break and you AUTO drop in and ride it — no key needed —
// which reveals its name as a reward (roaming is otherwise unlabelled, so the
// breaks are a discovery). Space pops a separate ollie anywhere. The cursor moves
// the view (move-look): point where you want to look, center it to fall back
// behind the board.
const GRAVITY = 30;
const JUMP_V = 10; // ollie pop
const CATCH_RADIUS = 26; // enter this close to a break's takeoff and you drop in
const CATCH_MIN_SPEED = 4; // need some pace to catch
const RIDE_DUR = 3.6; // seconds a caught ride lasts
const REVEAL_HOLD = 5; // seconds the break's name stays on the HUD after catching
const MAX_YAW = 0.6; // how far the cursor can swing the view (radians)
const MAX_PITCH = 0.45;

export default function SurfController({
  active,
  onNearSpot,
  onCoin,
  onCheckpoint,
}: {
  active: boolean;
  onNearSpot?: (spot: SurfSpot | null) => void;
  onCoin?: (count: number) => void;
  onCheckpoint?: (cp: Checkpoint | null) => void;
}) {
  const board = useRef<THREE.Group>(null);
  const rider = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(60, WATER_Y + 0.3, 0));
  const heading = useRef(Math.PI); // face back toward the islands
  const speed = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const jumpQueued = useRef(false);
  const vy = useRef(0); // vertical velocity for the ollie
  const airY = useRef(0); // height above the water line
  const riding = useRef(false);
  const rideStart = useRef(0);
  const zoneId = useRef<string | null>(null); // takeoff zone we're currently inside
  const rodeThisVisit = useRef(false); // caught the wave since entering this zone?
  const lean = useRef(0); // rider carve lean, eased
  const cursor = useRef({ x: 0, y: 0 }); // normalized pointer, -1..1
  const lookYaw = useRef(0);
  const lookPitch = useRef(0);
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
  // Journey: coin count + the checkpoint currently shown.
  const onCoinRef = useRef(onCoin);
  onCoinRef.current = onCoin;
  const onCheckpointRef = useRef(onCheckpoint);
  onCheckpointRef.current = onCheckpoint;
  const coinCount = useRef(0);
  const shownCpId = useRef<number | null>(null);
  const cpRevealUntil = useRef(0);

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
    // Move-look: cursor position (normalized) drives the view offset.
    const moveLook = (e: PointerEvent) => {
      cursor.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      cursor.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      regress();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("pointermove", moveLook);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("pointermove", moveLook);
      keys.current = {};
    };
  }, [active, regress]);

  // Seed the board near where the camera was looking when surf mode starts.
  useEffect(() => {
    if (!active) return;
    pos.current.set(camera.position.x, WATER_Y + 0.3, camera.position.z - 6);
    heading.current = Math.PI;
    speed.current = 0;
    airY.current = 0;
    vy.current = 0;
    riding.current = false;
    zoneId.current = null;
    rodeThisVisit.current = false;
    cursor.current.x = 0;
    cursor.current.y = 0;
    lookYaw.current = 0;
    lookPitch.current = 0;
    // Fresh run: coins reappear, count resets.
    resetJourney();
    coinCount.current = 0;
    shownCpId.current = null;
    onCoinRef.current?.(0);
  }, [active, camera]);

  // Leaving surf mode clears the HUD labels + spray signal.
  useEffect(() => {
    if (!active) {
      shownSpotId.current = null;
      onNearSpotRef.current?.(null);
      shownCpId.current = null;
      onCheckpointRef.current?.(null);
      surfSignal.rideSpotId = null;
    }
  }, [active]);

  useFrame((state, dt) => {
    if (!active || !board.current) return;
    const d = Math.min(dt, 0.05); // clamp so a stutter can't launch the board
    const t = state.clock.elapsedTime;
    const k = keys.current;
    const fwd = (k["w"] || k["arrowup"] ? 1 : 0) - (k["s"] || k["arrowdown"] ? 1 : 0);
    const turn = (k["a"] || k["arrowleft"] ? 1 : 0) - (k["d"] || k["arrowright"] ? 1 : 0);

    // Carve harder the faster you go, and get a little drive out of a hard turn
    // (a cutback pump) — it's a surfer's world.
    const bite = 0.6 + Math.min(1, Math.abs(speed.current) / 18) * 0.75;
    heading.current += turn * 2.1 * bite * d;
    let targetSpeed = fwd * 18; // units / sec
    if (turn !== 0 && speed.current > 6) targetSpeed += Math.min(6, speed.current * 0.35);
    speed.current += (targetSpeed - speed.current) * (1 - Math.exp(-3 * d));

    // ── Jump (ollie) ─────────────────────────────────────────────────────────
    if (jumpQueued.current) {
      jumpQueued.current = false;
      if (airY.current <= 0.05 && !riding.current) vy.current = JUMP_V;
    }

    // ── Auto drop-in: entering a break's takeoff zone with pace catches it ────
    const zone = nearestTakeoff(pos.current.x, pos.current.z, CATCH_RADIUS);
    const zid = zone ? zone.id : null;
    if (zid !== zoneId.current) rodeThisVisit.current = false; // fresh entry
    if (zone && !riding.current && !rodeThisVisit.current && speed.current > CATCH_MIN_SPEED) {
      riding.current = true;
      rideStart.current = t;
      rodeThisVisit.current = true;
      vy.current = 0;
      shownSpotId.current = zone.id;
      revealUntil.current = t + REVEAL_HOLD;
      onNearSpotRef.current?.(zone);
      surfSignal.rideSpotId = zone.id; // tell the wave to throw spray
      surfSignal.rideStart = t;
    }
    zoneId.current = zid;

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

    // ── Walls: reflect off the ocean bounds, but ONLY when heading into them.
    // (Reflecting unconditionally oscillates and pins you against the edge.) ──
    const reflectWall = (nx: number, nz: number) => {
      const vx = Math.sin(heading.current);
      const vz = Math.cos(heading.current);
      const dot = vx * nx + vz * nz;
      if (dot < 0) {
        heading.current = Math.atan2(vx - 2 * dot * nx, vz - 2 * dot * nz);
        speed.current *= 0.5;
      }
    };
    if (pos.current.x <= -60) { pos.current.x = -60; reflectWall(1, 0); }
    else if (pos.current.x >= 220) { pos.current.x = 220; reflectWall(-1, 0); }
    if (pos.current.z <= -130) { pos.current.z = -130; reflectWall(0, 1); }
    else if (pos.current.z >= 130) { pos.current.z = 130; reflectWall(0, -1); }

    // ── Collision: bounce the board off solid landmasses (no ghosting) ───────
    for (const col of SURF_COLLIDERS) {
      const dx = pos.current.x - col.x;
      const dz = pos.current.z - col.z;
      const dist = Math.hypot(dx, dz) || 1e-4;
      const min = col.r + 1.6; // + board half-width
      if (dist < min) {
        const nx = dx / dist;
        const nz = dz / dist;
        pos.current.x = col.x + nx * min;
        pos.current.z = col.z + nz * min;
        // Reflect heading about the surface normal → a real bounce.
        const vx = Math.sin(heading.current);
        const vz = Math.cos(heading.current);
        const dot = vx * nx + vz * nz;
        if (dot < 0) {
          heading.current = Math.atan2(vx - 2 * dot * nx, vz - 2 * dot * nz);
          speed.current *= 0.5;
        }
      }
    }

    // ── Coins: collect on proximity ──────────────────────────────────────────
    for (const coin of COINS) {
      if (collectedCoins.has(coin.id)) continue;
      const dx = pos.current.x - coin.x;
      const dz = pos.current.z - coin.z;
      if (dx * dx + dz * dz < 9) {
        collectedCoins.add(coin.id);
        coinCount.current += 1;
        onCoinRef.current?.(coinCount.current);
        sfx.play("coin");
      }
    }

    // ── Checkpoints: show a "how I work" card while inside, hold after ───────
    let cp: Checkpoint | null = null;
    for (const c of CHECKPOINTS) {
      const dx = pos.current.x - c.x;
      const dz = pos.current.z - c.z;
      if (dx * dx + dz * dz < 196) {
        cp = c;
        break;
      }
    }
    if (cp) {
      if (cp.id !== shownCpId.current) {
        shownCpId.current = cp.id;
        onCheckpointRef.current?.(cp);
      }
      cpRevealUntil.current = t + 4;
    } else if (shownCpId.current !== null && t > cpRevealUntil.current) {
      shownCpId.current = null;
      onCheckpointRef.current?.(null);
    }

    // Ride the moving swell (float ON the surface, never under it).
    const bobY = WATER_Y + seaHeight(pos.current.x, pos.current.z, t) + 0.4;
    board.current.position.set(pos.current.x, bobY + airY.current, pos.current.z);
    const airPitch = airY.current * 0.06; // nose lifts as it leaves the water
    const carveRoll = riding.current ? Math.sin((t - rideStart.current) * 4.2) * 0.4 : 0;
    board.current.rotation.set(
      Math.sin(t * 1.4) * 0.05 - airPitch,
      heading.current,
      turn * -0.26 + Math.sin(t * 1.8) * 0.04 + carveRoll
    );
    // Rider leans hard into the carve (independent of the board roll).
    const leanTarget = turn * 0.45 + carveRoll * 0.6;
    lean.current += (leanTarget - lean.current) * (1 - Math.exp(-6 * d));
    if (rider.current) rider.current.rotation.z = lean.current;

    // ── Move-look: cursor swings the view; centering it eases back behind ─────
    const dz = 0.08; // deadzone
    const cx = Math.abs(cursor.current.x) < dz ? 0 : cursor.current.x;
    const cy = Math.abs(cursor.current.y) < dz ? 0 : cursor.current.y;
    lookYaw.current += (cx * MAX_YAW - lookYaw.current) * (1 - Math.exp(-5 * d));
    lookPitch.current += (-cy * MAX_PITCH - lookPitch.current) * (1 - Math.exp(-5 * d));

    // Chase camera: behind + above the board, pulling in tighter while riding,
    // yawed/pitched by the cursor.
    const camYaw = heading.current + lookYaw.current;
    const behind = riding.current ? 9 : 12;
    const height = (riding.current ? 7.5 : 6) + airY.current * 0.4 + lookPitch.current * 4;
    camTarget.current.set(
      pos.current.x - Math.sin(camYaw) * behind,
      bobY + height,
      pos.current.z - Math.cos(camYaw) * behind
    );
    camera.position.lerp(camTarget.current, 1 - Math.exp(-4 * d));
    lookTarget.current.set(
      pos.current.x,
      bobY + 1 + airY.current * 0.5 + lookPitch.current * 2,
      pos.current.z
    );
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
      <Surfer ref={rider} />
    </group>
  );
}
