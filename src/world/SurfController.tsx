import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WATER_Y, seaHeight } from "./geometry";
import Surfer from "./Surfer";
import { nearestTakeoff, type SurfSpot } from "./surf-spots";
import { surfSignal } from "./surf-signal";
import { SURF_COLLIDERS, COINS, COIN_TOTAL, CHECKPOINTS, collectedCoins, type Checkpoint } from "./surf-journey";
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
const SPIN_RATE = 9.4; // ~one full board rotation per ollie
const TRICK_SPRAY_N = 8;
const TRICK_SPRAY_GEO = new THREE.SphereGeometry(0.22, 6, 6);
const TRICK_SPRAY_MAT = new THREE.MeshStandardMaterial({ color: "#dff6f1", transparent: true, opacity: 0.9, flatShading: true });

export default function SurfController({
  active,
  onNearSpot,
  onCoin,
  onCheckpoint,
  onComplete,
}: {
  active: boolean;
  onNearSpot?: (spot: SurfSpot | null) => void;
  onCoin?: (count: number) => void;
  onCheckpoint?: (cp: Checkpoint | null) => void;
  onComplete?: () => void;
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
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  // Boost/pump stamina (0..1). Internal only — it gates the boost, and there is
  // no longer a meter in the HUD reading it.
  const stamina = useRef(1);
  // Paddle-in intro (prone -> pop-up) + smoothed turning + eased rider pitch.
  const introStart = useRef(-1);
  const turnVel = useRef(0);
  const riderPitch = useRef(0);
  // Trick-on-jump: air spin + a board-local spray burst.
  const jumpStart = useRef(0);
  const spinning = useRef(false);
  const spraySpawn = useRef(-99);
  const trickSpray = useRef<THREE.Group>(null);
  const trickDirs = useMemo(
    () =>
      Array.from({ length: TRICK_SPRAY_N }, () => ({
        x: (Math.random() * 2 - 1) * 1.2,
        y: 0.6 + Math.random(),
        z: (Math.random() * 2 - 1) * 1.2,
        r: 0.5 + Math.random(),
      })),
    []
  );

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "spacebar") {
        e.preventDefault();
        if (!e.repeat) jumpQueued.current = true; // edge-triggered: one pop per press
        return;
      }
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) {
        if (k !== "shift") e.preventDefault();
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
    // One run per visit: coins do NOT reappear when you re-enter surf mode, so
    // the loop can actually be finished instead of farmed. Resume the count from
    // what's already collected; a page refresh starts a fresh run.
    coinCount.current = collectedCoins.size;
    shownCpId.current = null;
    onCoinRef.current?.(coinCount.current);
    stamina.current = 1;
    spinning.current = false;
    spraySpawn.current = -99;
    introStart.current = -1; // begin the paddle-in intro on the first frame
    turnVel.current = 0;
    riderPitch.current = 1.5; // start prone (belly down, head toward the nose)
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
    // ── Paddle-in intro: prone paddle, then pop up. Controls locked until then.
    if (introStart.current < 0) introStart.current = t;
    const introP = Math.min(1, (t - introStart.current) / 1.6); // 0..1
    const intro = introP < 1;
    const fwdIn = intro ? 0.5 : fwd; // auto-glide while paddling
    const turnIn = intro ? 0 : turn;
    // Rider pose: prone while paddling, pops up over the last third.
    const pitchTarget = introP < 0.66 ? -1.5 : THREE.MathUtils.lerp(-1.5, 0, (introP - 0.66) / 0.34);
    riderPitch.current += (pitchTarget - riderPitch.current) * (1 - Math.exp(-9 * d));

    // Smoothed turning: ease angular velocity toward the target rate (no twitch).
    const bite = 0.6 + Math.min(1, Math.abs(speed.current) / 24) * 0.8;
    const targetTurnRate = turnIn * 2.6 * bite;
    turnVel.current += (targetTurnRate - turnVel.current) * (1 - Math.exp(-8 * d));
    heading.current += turnVel.current * d;
    // Boost / pump: hold Shift for a burst while stamina lasts; recharge otherwise.
    const boosting = !intro && !!k["shift"] && stamina.current > 0.02 && fwd > 0;
    stamina.current = THREE.MathUtils.clamp(stamina.current + (boosting ? -0.5 : 0.28) * d, 0, 1);
    let targetSpeed = fwdIn * (intro ? 9 : 24) * (boosting ? 1.6 : 1); // units / sec
    if (turnIn !== 0 && speed.current > 6) targetSpeed += Math.min(8, speed.current * 0.35);
    speed.current += (targetSpeed - speed.current) * (1 - Math.exp(-3 * d));

    // ── Jump (ollie) + trick spin ────────────────────────────────────────────
    if (jumpQueued.current) {
      jumpQueued.current = false;
      if (!intro && airY.current <= 0.05 && !riding.current) {
        vy.current = JUMP_V;
        jumpStart.current = t; // wind up a spin
        spinning.current = true;
        spraySpawn.current = t; // spray off the takeoff
      }
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
        if (spinning.current) {
          spinning.current = false;
          spraySpawn.current = t; // spray on landing
          sfx.play("open"); // a soft snap when you stomp the landing
        }
      }
    }

    pos.current.x += Math.sin(heading.current) * speed.current * d;
    pos.current.z += Math.cos(heading.current) * speed.current * d;

    // Soft glide-away off a surface: only when heading INTO it (dot < 0), ease
    // the heading toward the deflected direction over a few frames and keep most
    // of the speed → the board curves off it smoothly instead of snapping/wedging.
    const softDeflect = (nx: number, nz: number) => {
      const vx = Math.sin(heading.current);
      const vz = Math.cos(heading.current);
      const dot = vx * nx + vz * nz;
      if (dot >= 0) return;
      const target = Math.atan2(vx - 2 * dot * nx, vz - 2 * dot * nz);
      let diff = target - heading.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // wrap to [-PI, PI]
      heading.current += diff * 0.25;
      speed.current *= 0.85;
    };

    // ── Walls: soft-bounce off the ocean bounds (no wedging into corners) ────
    if (pos.current.x <= -60) { pos.current.x = -60; softDeflect(1, 0); }
    else if (pos.current.x >= 220) { pos.current.x = 220; softDeflect(-1, 0); }
    if (pos.current.z <= -130) { pos.current.z = -130; softDeflect(0, 1); }
    else if (pos.current.z >= 130) { pos.current.z = 130; softDeflect(0, -1); }

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
        softDeflect(nx, nz); // soft glide-away off the monument
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
        // Last coin of the run: hand the moment to the page so it can offer a
        // reason to stop surfing and start talking.
        if (coinCount.current >= COIN_TOTAL) onCompleteRef.current?.();
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
    const trickSpin = spinning.current ? (t - jumpStart.current) * SPIN_RATE : 0; // air 360
    board.current.rotation.set(
      Math.sin(t * 1.4) * 0.05 - airPitch,
      heading.current + trickSpin,
      turnIn * -0.26 + Math.sin(t * 1.8) * 0.04 + carveRoll
    );
    // Rider leans into the carve (z) and is pitched prone during the paddle-in (x).
    // A gentle paddle sway while prone sells the stroke.
    const leanTarget = turnIn * 0.45 + carveRoll * 0.6 + (intro ? Math.sin(t * 6) * 0.12 : 0);
    lean.current += (leanTarget - lean.current) * (1 - Math.exp(-6 * d));
    if (rider.current) {
      rider.current.rotation.z = lean.current;
      rider.current.rotation.x = riderPitch.current;
    }

    // Trick spray burst (takeoff + landing): little foam flecks off the board.
    if (trickSpray.current) {
      const age = t - spraySpawn.current;
      const on = age >= 0 && age < 0.5;
      trickSpray.current.visible = on;
      if (on) {
        const p = age / 0.5;
        const kids = trickSpray.current.children;
        for (let i = 0; i < kids.length; i++) {
          const m = kids[i] as THREE.Mesh;
          const dd = trickDirs[i];
          m.position.set(dd.x * 3 * p, 0.3 + dd.y * 3 * p - p * p * 2.2, dd.z * 3 * p);
          m.scale.setScalar(Math.max(0.001, (1 - p) * dd.r));
        }
      }
    }

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
    if (Math.abs(speed.current) > 0.5 || turnIn !== 0 || intro || airY.current > 0.05) regress();

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
      <group ref={trickSpray} visible={false}>
        {trickDirs.map((_, i) => (
          <mesh key={i} geometry={TRICK_SPRAY_GEO} material={TRICK_SPRAY_MAT} raycast={() => null} />
        ))}
      </group>
    </group>
  );
}
