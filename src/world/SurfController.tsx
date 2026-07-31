import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WATER_Y, seaHeight } from "./geometry";
import Surfer from "./Surfer";
import { nearestTakeoff, SURF_LAUNCH, type SurfSpot } from "./surf-spots";
import { surfSignal } from "./surf-signal";
import { SURF_COLLIDERS, COINS, COIN_TOTAL, CHECKPOINTS, collectedCoins, type Checkpoint } from "./surf-journey";
import { sfx } from "../audio/sfx";
import { BOARD_CLEARANCE, boardFloatY, isDoubleSpacePress } from "./surf-controls";

// Free-roam surf mode: hop on a board and steer around the ocean with WASD /
// arrow keys, third-person chase camera. Active only while `active` is true;
// CameraRig goes inert during that time so the two don't fight over the camera.
//
// Reach a legendary break to catch a short player-steered boost. It adds speed
// and lift without teleporting the board onto a scripted rail. Space pops a
// separate ollie anywhere. The cursor moves the view (move-look): point where
// you want to look, center it to fall back behind the board.
const GRAVITY = 30;
const JUMP_V = 10; // ollie pop
// Prone pitch for the paddle-in. Positive tips the rider's head toward the nose
// (belly down); the entry seed and the intro target MUST share this constant or
// the pop-up plays mirrored.
const PRONE_PITCH = 1.5;
const ease = (p: number) => p * p * (3 - 2 * p); // smoothstep
const CATCH_RADIUS = 26; // enter this close to a break's takeoff and you drop in
const CATCH_MIN_SPEED = 4; // need some pace to catch
const RIDE_DUR = 5; // enough time to feel a full face, carve, and clean exit
const REVEAL_HOLD = 5; // seconds the break's name stays on the HUD after catching
const RIDE_ENTRY_RADIUS = 10; // catches happen close enough to cleanly enter the authored line
const MAX_YAW = 0.6; // how far the cursor can swing the view (radians)
const MAX_PITCH = 0.45;
const SPIN_DUR = 0.48; // a fast but readable 360 after the second Space press
const LANDING_SPLASH_DUR = 2.4;
const LANDING_RING_GEO = new THREE.RingGeometry(0.5, 0.68, 24);
const LANDING_DROP_GEO = new THREE.ConeGeometry(0.09, 0.52, 4);
const LANDING_RING_MAT = new THREE.MeshBasicMaterial({ color: "#e6f7f2", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
const LANDING_DROP_MAT = new THREE.MeshBasicMaterial({ color: "#e6f7f2", transparent: true, opacity: 0, depthWrite: false });
const LANDING_DROPLETS = Array.from({ length: 8 }, (_, i) => ({
  angle: (i / 8) * Math.PI * 2 + 0.18,
  distance: 0.65 + (i % 3) * 0.18,
  height: 0.6 + (i % 4) * 0.16,
}));
// Foam trail left on the water behind the board. Pooled: the slots are reused in
// a ring so a long tail never allocates inside the render loop.
const WAKE_N = 20;
const WAKE_DUR = 1.8;
const WAKE_GEO = new THREE.CircleGeometry(0.34, 7);

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
  const spinQueued = useRef(false);
  const lastSpaceDown = useRef(-Infinity);
  const vy = useRef(0); // vertical velocity for the ollie
  const airY = useRef(0); // height above the water line
  const riding = useRef(false);
  const rideStart = useRef(0);
  const rideSpot = useRef<SurfSpot | null>(null);
  const zoneId = useRef<string | null>(null); // takeoff zone we're currently inside
  const rodeThisVisit = useRef(false); // caught the wave since entering this zone?
  const lean = useRef(0); // rider carve lean, eased
  const cursor = useRef({ x: 0, y: 0 }); // normalized pointer, -1..1
  const lookYaw = useRef(0);
  const lookPitch = useRef(0);
  const camTarget = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const cameraLook = useRef(new THREE.Vector3());
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
  const bobSmooth = useRef(-1); // low-passed swell height (-1 = unseeded)
  const bounceUntil = useRef(0); // per-contact cooldown so a bounce fires once
  const riderPitch = useRef(0);
  // Trick-on-jump: a second Space while airborne turns an ollie into a 360.
  const spinStart = useRef(0);
  const spinning = useRef(false);
  // A ride exits into a small, world-anchored splash. It is deliberately not a
  // child of the board, so it stays behind in the water instead of reading as
  // bubbles glued to the surfboard.
  const landingSplash = useRef<THREE.Group>(null);
  const splashStart = useRef(-Infinity);
  const splashPos = useRef(new THREE.Vector3());
  const wakeMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const wakeSlots = useRef(Array.from({ length: WAKE_N }, () => ({ born: -99, x: 0, z: 0, heading: 0 })));
  const wakeCursor = useRef(0);
  const lastWakeAt = useRef(-99);

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "spacebar") {
        e.preventDefault();
        if (!e.repeat) {
          const now = performance.now() / 1000;
          if (isDoubleSpacePress(now, lastSpaceDown.current)) spinQueued.current = true;
          else jumpQueued.current = true;
          lastSpaceDown.current = now;
        }
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

  // Launch in open water with Bondi in the initial heading, outside its catch zone.
  useEffect(() => {
    if (!active) return;
    pos.current.set(SURF_LAUNCH.position[0], WATER_Y + 0.3, SURF_LAUNCH.position[1]);
    heading.current = SURF_LAUNCH.heading;
    speed.current = 0;
    airY.current = 0;
    vy.current = 0;
    riding.current = false;
    rideSpot.current = null;
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
    spinQueued.current = false;
    lastSpaceDown.current = -Infinity;
    splashStart.current = -Infinity;
    wakeCursor.current = 0;
    lastWakeAt.current = -99;
    for (const slot of wakeSlots.current) slot.born = -99;
    introStart.current = -1; // begin the paddle-in intro on the first frame
    turnVel.current = 0;
    riderPitch.current = PRONE_PITCH; // start prone (belly down, head toward the nose)
    bobSmooth.current = -1; // re-seed the swell filter on the first frame
    cameraLook.current.set(pos.current.x, WATER_Y + 1, pos.current.z);
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
    const turnIn = intro ? 0 : turn * (riding.current ? 0.65 : 1);
    // Rider pose: prone while paddling, pops up over the last third. PRONE is
    // +PRONE_PITCH (rotating +X tips the head toward the nose, belly down); the
    // seed in the entry effect uses the same sign, so the pop-up plays forwards.
    const pitchTarget =
      introP < 0.66 ? PRONE_PITCH : THREE.MathUtils.lerp(PRONE_PITCH, 0, ease((introP - 0.66) / 0.34));
    riderPitch.current += (pitchTarget - riderPitch.current) * (1 - Math.exp(-9 * d));

    // Smoothed turning: ease angular velocity toward the target rate (no twitch).
    // Speed now WIDENS the arc instead of tightening it — carving fast should feel
    // committed, not twitchy — and the peak rate is lower than it was.
    const bite = 1.15 - Math.min(1, Math.abs(speed.current) / 26) * 0.45;
    const targetTurnRate = turnIn * 1.9 * bite;
    turnVel.current += (targetTurnRate - turnVel.current) * (1 - Math.exp(-6.5 * d));
    heading.current += turnVel.current * d;
    // Boost / pump: hold Shift for a burst while stamina lasts; recharge otherwise.
    const boosting = !intro && !!k["shift"] && stamina.current > 0.02 && fwd > 0;
    stamina.current = THREE.MathUtils.clamp(stamina.current + (boosting ? -0.5 : 0.28) * d, 0, 1);
    let targetSpeed = fwdIn * (intro ? 9 : 24) * (boosting ? 1.6 : 1); // units / sec
    if (turnIn !== 0 && speed.current > 6) targetSpeed += Math.min(8, speed.current * 0.35);
    speed.current += (targetSpeed - speed.current) * (1 - Math.exp(-3 * d));

    // ── Jump (ollie) + double-Space 360 ─────────────────────────────────────
    if (jumpQueued.current) {
      jumpQueued.current = false;
      if (!intro && airY.current <= 0.05 && !riding.current) {
        vy.current = JUMP_V;
      }
    }
    // A second Space during the ollie throws one smooth, complete board 360.
    // Waiting for air keeps a double tap from spinning the board on the water.
    if (spinQueued.current && airY.current > 0.05 && !spinning.current) {
      spinning.current = true;
      spinStart.current = t;
      spinQueued.current = false;
    }

    // ── Auto drop-in: entering a break's takeoff zone with pace catches it ────
    const zone = nearestTakeoff(pos.current.x, pos.current.z, CATCH_RADIUS);
    const zid = zone ? zone.id : null;
    if (zid !== zoneId.current) rodeThisVisit.current = false; // fresh entry
    if (zone && !riding.current && !rodeThisVisit.current && speed.current > CATCH_MIN_SPEED && Math.hypot(pos.current.x - zone.take[0], pos.current.z - zone.take[1]) < RIDE_ENTRY_RADIUS) {
      riding.current = true;
      rideStart.current = t;
      rideSpot.current = zone;
      rodeThisVisit.current = true;
      vy.current = 0;
      turnVel.current = 0;
      shownSpotId.current = zone.id;
      revealUntil.current = t + REVEAL_HOLD;
      onNearSpotRef.current?.(zone);
      surfSignal.rideSpotId = zone.id; // tell the wave to throw spray
      surfSignal.rideStart = t;
    }
    zoneId.current = zid;

    // A caught wave boosts the board but leaves steering and travel in the
    // player's hands. The old version snapped position onto a scripted line,
    // which made every drop-in feel like control had been taken away.
    if (riding.current) {
      const rp = (t - rideStart.current) / RIDE_DUR; // 0..1
      const spot = rideSpot.current;
      if (rp >= 1) {
        riding.current = false;
        rideSpot.current = null;
        airY.current = 0;
        surfSignal.rideSpotId = null;
        splashStart.current = t;
        splashPos.current.set(pos.current.x, 0, pos.current.z);
      } else if (spot) {
        // Ease onto the authored face, then hand steering back progressively.
        // This gives the drop-in shape without snapping onto an invisible rail.
        const rideHeading = Math.atan2(spot.ride.direction[0], spot.ride.direction[1]);
        const headingDelta = Math.atan2(Math.sin(rideHeading - heading.current), Math.cos(rideHeading - heading.current));
        heading.current += headingDelta * (1 - rp) * (1 - Math.exp(-2.4 * d));
        speed.current = Math.max(speed.current, 27 + Math.sin(rp * Math.PI) * 7);
        airY.current = Math.sin(rp * Math.PI) * spot.ride.lift;
      }
    }
    if (!riding.current) {
      vy.current -= GRAVITY * d;
      airY.current += vy.current * d;
      if (airY.current <= 0) {
        airY.current = 0;
        // Absorb the landing instead of hard-zeroing: keep a little of the
        // downward velocity as compression so the board settles rather than
        // stopping dead against the water.
        vy.current = 0;
        if (spinning.current) {
          spinning.current = false;
          sfx.play("open"); // a soft snap when you stomp the landing
        }
      }
    }

    pos.current.x += Math.sin(heading.current) * speed.current * d;
    pos.current.z += Math.cos(heading.current) * speed.current * d;

    // Reused wake pool: one small foam patch every few frames. Each patch
    // expands and fades in place, producing a persistent tail without creating
    // or destroying objects during the render loop.
    if (!intro && airY.current < 0.12 && Math.abs(speed.current) > 3 && t - lastWakeAt.current > 0.09) {
      const slot = wakeSlots.current[wakeCursor.current % WAKE_N];
      slot.born = t;
      slot.x = pos.current.x - Math.sin(heading.current) * 1.35;
      slot.z = pos.current.z - Math.cos(heading.current) * 1.35;
      slot.heading = heading.current;
      wakeCursor.current += 1;
      lastWakeAt.current = t;
    }
    for (let i = 0; i < WAKE_N; i++) {
      const mesh = wakeMeshes.current[i];
      if (!mesh) continue;
      const slot = wakeSlots.current[i];
      const age = t - slot.born;
      if (age < 0 || age > WAKE_DUR) {
        mesh.visible = false;
        continue;
      }
      const p = age / WAKE_DUR;
      mesh.visible = true;
      mesh.position.set(slot.x, WATER_Y + 0.16, slot.z);
      mesh.rotation.set(-Math.PI / 2, slot.heading, 0);
      mesh.scale.set(0.7 + p * 2.6, 0.45 + p * 1.2, 1);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - p) * (riding.current ? 0.62 : 0.38);
    }

    // Soft glide-away off a surface: only when heading INTO it (dot < 0), ease
    // the heading toward the deflected direction over a few frames and keep most
    // of the speed → the board curves off it smoothly instead of snapping/wedging.
    // `once` guards the landmass case: while you sit against a rock this used to
    // re-fire every frame, compounding speed *= 0.85 into a dead stop that felt
    // like being stuck. One firmer deflection per contact reads as a clean bounce.
    const softDeflect = (nx: number, nz: number, once = false) => {
      const vx = Math.sin(heading.current);
      const vz = Math.cos(heading.current);
      const dot = vx * nx + vz * nz;
      if (dot >= 0) return;
      if (once) {
        if (t < bounceUntil.current) return;
        bounceUntil.current = t + 0.35;
      }
      const target = Math.atan2(vx - 2 * dot * nx, vz - 2 * dot * nz);
      let diff = target - heading.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // wrap to [-PI, PI]
      heading.current += diff * (once ? 0.3 : 0.18);
      speed.current *= once ? 0.8 : 0.9;
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
        softDeflect(nx, nz, true); // one clean bounce per contact, not per frame
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

    // Ride the moving swell (float ON the surface, never under it). Following the
    // wave field 1:1 at 24 units/sec shook the board and, because the camera reads
    // the same value, the entire view. So: follow a damped share of the swell and
    // low-pass it. Everything downstream (board, camera position, camera look)
    // reads the SMOOTHED value — the unfiltered one was the main source of jitter.
    const surfaceY = WATER_Y + seaHeight(pos.current.x, pos.current.z, t);
    const bobRaw = surfaceY + BOARD_CLEARANCE;
    if (bobSmooth.current < 0) bobSmooth.current = bobRaw; // first frame: no lurch
    bobSmooth.current += (bobRaw - bobSmooth.current) * (1 - Math.exp(-4.5 * d));
    const bobY = boardFloatY(surfaceY, bobSmooth.current);
    board.current.position.set(pos.current.x, bobY + airY.current, pos.current.z);
    const airPitch = airY.current * 0.06; // nose lifts as it leaves the water
    const carveRoll = riding.current ? Math.sin((t - rideStart.current) * 4.2) * 0.4 : 0;
    const spinP = spinning.current ? THREE.MathUtils.clamp((t - spinStart.current) / SPIN_DUR, 0, 1) : 0;
    const trickSpin = spinP * spinP * (3 - 2 * spinP) * Math.PI * 2;
    const turnRatio = THREE.MathUtils.clamp(turnVel.current / 1.9, -1, 1);
    board.current.rotation.set(
      Math.sin(t * 1.4) * 0.05 - airPitch,
      heading.current + trickSpin,
      turnRatio * -0.18 + Math.sin(t * 1.8) * 0.025 + carveRoll
    );
    // Rider leans into the carve (z) and is pitched prone during the paddle-in (x).
    // A gentle paddle sway while prone sells the stroke.
    const leanTarget = turnRatio * 0.36 + carveRoll * 0.6 + (intro ? Math.sin(t * 6) * 0.08 : 0);
    lean.current += (leanTarget - lean.current) * (1 - Math.exp(-6 * d));
    if (rider.current) {
      rider.current.rotation.z = lean.current;
      rider.current.rotation.x = riderPitch.current;
    }

    // Ride exit splash: two soft ripples and angular water droplets, fading out
    // in place over a few seconds. It stays on the real wave height, never below it.
    if (landingSplash.current) {
      const age = t - splashStart.current;
      const on = age >= 0 && age < LANDING_SPLASH_DUR;
      landingSplash.current.visible = on;
      if (on) {
        const p = age / LANDING_SPLASH_DUR;
        const { x, z } = splashPos.current;
        landingSplash.current.position.set(x, WATER_Y + seaHeight(x, z, t) + 0.035, z);
        LANDING_RING_MAT.opacity = (1 - p) * 0.46;
        LANDING_DROP_MAT.opacity = (1 - p) * (1 - p) * 0.72;
        const kids = landingSplash.current.children as THREE.Mesh[];
        kids[0].scale.setScalar(1 + p * 5.2);
        kids[1].scale.setScalar(1 + p * 8.4);
        for (let i = 0; i < LANDING_DROPLETS.length; i++) {
          const drop = LANDING_DROPLETS[i];
          const m = kids[i + 2];
          const distance = drop.distance + p * 2.4;
          m.position.set(
            Math.cos(drop.angle) * distance,
            0.12 + Math.sin(p * Math.PI) * drop.height,
            Math.sin(drop.angle) * distance
          );
          m.scale.setScalar(Math.max(0.001, 1 - p * 0.7));
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
    const camYaw = heading.current + lookYaw.current + (riding.current ? 0.48 : 0);
    const behind = riding.current ? 11.5 : 12;
    const height = (riding.current ? 8.5 : 6) + airY.current * 0.4 + lookPitch.current * 4;
    camTarget.current.set(
      pos.current.x - Math.sin(camYaw) * behind,
      bobY + height,
      pos.current.z - Math.cos(camYaw) * behind
    );
    camera.position.lerp(camTarget.current, 1 - Math.exp(-7 * d));
    lookTarget.current.set(
      pos.current.x + (riding.current ? Math.sin(heading.current) * 2 : 0),
      bobY + 1 + airY.current * 0.5 + lookPitch.current * 2,
      pos.current.z + (riding.current ? Math.cos(heading.current) * 2 : 0)
    );
    cameraLook.current.lerp(lookTarget.current, 1 - Math.exp(-10 * d));
    camera.lookAt(cameraLook.current);
    if (Math.abs(speed.current) > 0.5 || turnIn !== 0 || intro || airY.current > 0.05) regress();

    // Fade the reward label a few seconds after the ride.
    if (shownSpotId.current && t > revealUntil.current) {
      shownSpotId.current = null;
      onNearSpotRef.current?.(null);
    }
  });

  if (!active) return null;
  return (
    <>
      <group ref={board}>
        <Surfer ref={rider} />
      </group>
      <group ref={landingSplash} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={LANDING_RING_GEO} material={LANDING_RING_MAT} raycast={() => null} />
        <mesh rotation={[-Math.PI / 2, 0.5, 0]} geometry={LANDING_RING_GEO} material={LANDING_RING_MAT} raycast={() => null} />
        {LANDING_DROPLETS.map((_, i) => (
          <mesh key={i} geometry={LANDING_DROP_GEO} material={LANDING_DROP_MAT} raycast={() => null} />
        ))}
      </group>
      <group>
        {wakeSlots.current.map((_, i) => (
          <mesh
            key={i}
            ref={(mesh) => { wakeMeshes.current[i] = mesh; }}
            visible={false}
            raycast={() => null}
          >
            <primitive object={WAKE_GEO} attach="geometry" />
            <meshBasicMaterial color="#e6f7f2" transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}
