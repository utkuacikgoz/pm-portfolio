import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WATER_Y, seaHeight, seaSlopeX, seaSlopeZ } from "./geometry";
import Surfer from "./Surfer";
import { nearestTakeoff, SURF_LAUNCH, type SurfSpot } from "./surf-spots";
import { surfSignal } from "./surf-signal";
import { surfTouch } from "./surf-touch";
import { SURF_COLLIDERS, COINS, COIN_TOTAL, CHECKPOINTS, CHECKPOINT_TOTAL, collectedCoins, type Checkpoint } from "./surf-journey";
import { sfx } from "../audio/sfx";
import {
  BOARD_CLEARANCE,
  SURF_BOUNDS,
  boardFloatY,
  isDoubleSpacePress,
  approach,
  paceRatio,
  turnRate,
  courseChase,
  clampSlip,
  leanTarget,
  wrapAngle,
  cameraFov,
  aspectFov,
  cameraDistance,
  cameraHeight,
  cameraLookHeight,
  cameraBank,
  chaseStiffness,
  chaseDamping,
  wakeInterval,
  wakeScale,
  carveRatio,
  carveWakeScale,
  carveWakeDuration,
  sprayInterval,
} from "./surf-controls";

// Free-roam surf mode: hop on a board and steer around the ocean with WASD /
// arrow keys, third-person chase camera. Active only while `active` is true;
// CameraRig goes inert during that time so the two don't fight over the camera.
//
// Reach a break to catch a short player-steered boost. It adds speed
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
const RIDE_ENTRY_RADIUS = 10; // catches happen close enough to cleanly enter the authored line
// Matches the Canvas camera in World.tsx (45), which is NOT the surf base
// (SURF_FOV, 46). Surf widens the lens with speed and has to hand back exactly
// the rail's value on exit, or the diorama keeps a slightly wide angle forever.
const RAIL_FOV = 45;
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
const WAKE_N = 28;
const WAKE_DUR = 2.4;
const WAKE_GEO = new THREE.CircleGeometry(0.34, 7);
// Spray thrown off the tail. Pooled exactly like the wake: fixed slots reused in
// a ring, so a continuous plume never allocates inside the render loop.
const SPRAY_N = 22;
// Short on purpose. A droplet drifts backward at roughly the board's own speed,
// so with the camera ~15 units behind it reaches the lens in about 0.6s and,
// being camera-facing, arrives as a screen-filling white slab. It has to die
// near the tail, where it belongs.
const SPRAY_DUR = 0.42;
const SPRAY_GRAVITY = 14;
// Round, not square: a hard-edged quad reads as a sheet of paper, not water.
const SPRAY_GEO = new THREE.CircleGeometry(0.13, 8);

export default function SurfController({
  active,
  onCoin,
  onCheckpoint,
  onWave,
  onTotals,
  onComplete,
}: {
  active: boolean;
  onCoin?: (count: number) => void;
  onCheckpoint?: (cp: Checkpoint | null) => void;
  /** Registry id of the project whose wave was just caught, or null on kick-out. */
  onWave?: (projectId: string | null) => void;
  /**
   * How many coins and checkpoints this run contains, reported once on entry.
   * The HUD lives in the DOM shell, which must not import them: doing so put
   * the whole island geometry graph in the entry chunk for every visitor.
   */
  onTotals?: (coins: number, checkpoints: number) => void;
  onComplete?: () => void;
}) {
  const board = useRef<THREE.Group>(null);
  const rider = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(60, WATER_Y + 0.3, 0));
  const heading = useRef(Math.PI); // where the nose POINTS
  // Where the board actually TRAVELS. It chases `heading` rather than matching
  // it, and the lag between the two is the tail washing out. Without it the
  // board turns like a cursor instead of something with mass on water.
  const course = useRef(Math.PI);
  const camVel = useRef(new THREE.Vector3()); // chase-camera spring velocity
  const camDelta = useRef(new THREE.Vector3()); // scratch: target minus current
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
  // Keep the callbacks in refs so the frame loop always calls the latest one
  // without re-subscribing effects.
  // Journey: coin count + the checkpoint currently shown.
  const onCoinRef = useRef(onCoin);
  onCoinRef.current = onCoin;
  const onCheckpointRef = useRef(onCheckpoint);
  onCheckpointRef.current = onCheckpoint;
  const onWaveRef = useRef(onWave);
  onWaveRef.current = onWave;
  const onTotalsRef = useRef(onTotals);
  onTotalsRef.current = onTotals;
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
  // `carve` and `scale` are fixed at birth. Width used to be read from the
  // board's CURRENT speed every frame, so slowing down retroactively shrank a
  // trail that was already lying on the water: the arc you just drew narrowed
  // behind you as you came off the throttle.
  const wakeSlots = useRef(
    Array.from({ length: WAKE_N }, () => ({ born: -99, x: 0, z: 0, heading: 0, carve: 0, scale: 1 }))
  );
  const wakeCursor = useRef(0);
  const lastWakeAt = useRef(-99);
  // Wave-slope tilt, low-passed. The raw field is far too lively to drive the
  // board directly: it reads as vibration rather than as sitting on water.
  const pitchSlope = useRef(0);
  const rollSlope = useRef(0);
  const sprayMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const spraySlots = useRef(
    Array.from({ length: SPRAY_N }, () => ({ born: -99, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }))
  );
  const sprayCursor = useRef(0);
  const lastSprayAt = useRef(-99);

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
    // Touch is excluded on purpose. A thumb on the glass is STEERING, and if the
    // same contact also swung the view, every carve would whip the camera the
    // opposite way from the turn it was asked for.
    const moveLook = (e: PointerEvent) => {
      if (surfTouch.enabled || e.pointerType === "touch") return;
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

  // Launch in open water with the gentle beach break ahead, outside its catch zone.
  useEffect(() => {
    if (!active) return;
    pos.current.set(SURF_LAUNCH.position[0], WATER_Y + 0.3, SURF_LAUNCH.position[1]);
    heading.current = SURF_LAUNCH.heading;
    course.current = SURF_LAUNCH.heading;
    camVel.current.set(0, 0, 0);
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
    onTotalsRef.current?.(COIN_TOTAL, CHECKPOINT_TOTAL);
    onCoinRef.current?.(coinCount.current);
    stamina.current = 1;
    spinning.current = false;
    spinQueued.current = false;
    lastSpaceDown.current = -Infinity;
    splashStart.current = -Infinity;
    wakeCursor.current = 0;
    lastWakeAt.current = -99;
    for (const slot of wakeSlots.current) slot.born = -99;
    sprayCursor.current = 0;
    lastSprayAt.current = -99;
    for (const slot of spraySlots.current) slot.born = -99;
    pitchSlope.current = 0;
    rollSlope.current = 0;
    introStart.current = -1; // begin the paddle-in intro on the first frame
    turnVel.current = 0;
    riderPitch.current = PRONE_PITCH; // start prone (belly down, head toward the nose)
    bobSmooth.current = -1; // re-seed the swell filter on the first frame
    cameraLook.current.set(pos.current.x, WATER_Y + 1, pos.current.z);
  }, [active, camera]);

  // Leaving surf mode clears the checkpoint card + spray signal, and hands the
  // lens back at its rail width: the speed-widened FOV is ours, not CameraRig's.
  useEffect(() => {
    if (!active) {
      shownCpId.current = null;
      onCheckpointRef.current?.(null);
      onWaveRef.current?.(null);
      surfSignal.rideSpotId = null;
      surfSignal.pace = 0;
      const persp = camera as THREE.PerspectiveCamera;
      if (persp.isPerspectiveCamera && persp.fov !== RAIL_FOV) {
        persp.fov = RAIL_FOV;
        persp.updateProjectionMatrix();
      }
    }
  }, [active, camera]);

  useFrame((state, dt) => {
    if (!active || !board.current) return;
    const d = Math.min(dt, 0.05); // clamp so a stutter can't launch the board
    const t = state.clock.elapsedTime;
    const k = keys.current;
    const keyFwd = (k["w"] || k["arrowup"] ? 1 : 0) - (k["s"] || k["arrowdown"] ? 1 : 0);
    const keyTurn = (k["a"] || k["arrowleft"] ? 1 : 0) - (k["d"] || k["arrowright"] ? 1 : 0);
    // Touch (phones) and the keyboard describe the same board, so they feed the
    // same two numbers. A held key always wins: the pad is mounted for the whole
    // run and rests at full throttle, so without this precedence a visitor on a
    // touchscreen laptop could never brake with S.
    const touching = surfTouch.enabled;
    const fwd = keyFwd !== 0 ? keyFwd : touching ? surfTouch.throttle : 0;
    const turn = keyTurn !== 0 ? keyTurn : touching ? surfTouch.steer : 0;
    // One-shot trick requests from the pad, consumed here so a tap fires exactly
    // one ollie however many frames pass before the loop next runs.
    if (surfTouch.jump) {
      surfTouch.jump = false;
      jumpQueued.current = true;
    }
    if (surfTouch.spin) {
      surfTouch.spin = false;
      spinQueued.current = true;
    }

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
    const targetTurnRate = turnRate(turnIn, speed.current);
    turnVel.current += (targetTurnRate - turnVel.current) * approach(6.5, d);
    heading.current += turnVel.current * d;
    // The line catches up to the nose, and never further than MAX_SLIP behind it.
    course.current = wrapAngle(
      course.current + wrapAngle(heading.current - course.current) * approach(courseChase(speed.current), d)
    );
    course.current = clampSlip(heading.current, course.current);
    // Boost / pump: hold Shift for a burst while stamina lasts; recharge otherwise.
    const boosting =
      !intro && (!!k["shift"] || (touching && surfTouch.boost)) && stamina.current > 0.02 && fwd > 0;
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
      surfSignal.rideSpotId = zone.id; // tell the wave to throw spray
      surfSignal.rideStart = t;
      // Every break is one of the five products. Catching it is how the ocean
      // introduces the work: the caption rides along, nothing stops.
      if (zone.projectId) onWaveRef.current?.(zone.projectId);
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

    // Pace, for the DOM speed overlay outside the canvas.
    surfSignal.pace = paceRatio(speed.current);

    pos.current.x += Math.sin(course.current) * speed.current * d;
    pos.current.z += Math.cos(course.current) * speed.current * d;

    // Reused wake pool: one small foam patch every few frames. Each patch
    // expands and fades in place, producing a persistent tail without creating
    // or destroying objects during the render loop.
    if (!intro && airY.current < 0.12 && Math.abs(speed.current) > 3 && t - lastWakeAt.current > wakeInterval(speed.current)) {
      const slot = wakeSlots.current[wakeCursor.current % WAKE_N];
      slot.born = t;
      slot.x = pos.current.x - Math.sin(heading.current) * 1.35;
      slot.z = pos.current.z - Math.cos(heading.current) * 1.35;
      slot.heading = course.current;
      slot.carve = carveRatio(heading.current, course.current);
      slot.scale = carveWakeScale(wakeScale(speed.current), slot.carve);
      wakeCursor.current += 1;
      lastWakeAt.current = t;
    }
    for (let i = 0; i < WAKE_N; i++) {
      const mesh = wakeMeshes.current[i];
      if (!mesh) continue;
      const slot = wakeSlots.current[i];
      const age = t - slot.born;
      // Foam thrown in a carve lives longer, so the arc is still on the water
      // when you come back round to look at it.
      const life = carveWakeDuration(WAKE_DUR, slot.carve);
      if (age < 0 || age > life) {
        mesh.visible = false;
        continue;
      }
      const p = age / life;
      mesh.visible = true;
      // Clearance matters more than it looks: the CPU `seaHeight` mirror and the
      // shader that actually draws the water agree closely but not exactly, which
      // is why the board carries BOARD_CLEARANCE rather than sitting at the
      // computed surface. Foam needs the same margin or it spends its life a few
      // centimetres under an opaque wave and never appears at all.
      mesh.position.set(slot.x, WATER_Y + seaHeight(slot.x, slot.z, t) + BOARD_CLEARANCE * 0.8, slot.z);
      mesh.rotation.set(-Math.PI / 2, slot.heading, 0);
      const w = slot.scale;
      mesh.scale.set((0.9 + p * 3.4) * w, (0.6 + p * 1.7) * w, 1);
      // Fade late rather than linearly: a trail that holds and then goes is more
      // legible edge-on than one that starts dimming immediately.
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        (1 - p * p) * (riding.current ? 0.72 : 0.52);
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
    if (pos.current.x <= SURF_BOUNDS.minX) { pos.current.x = SURF_BOUNDS.minX; softDeflect(1, 0); }
    else if (pos.current.x >= SURF_BOUNDS.maxX) { pos.current.x = SURF_BOUNDS.maxX; softDeflect(-1, 0); }
    if (pos.current.z <= SURF_BOUNDS.minZ) { pos.current.z = SURF_BOUNDS.minZ; softDeflect(0, 1); }
    else if (pos.current.z >= SURF_BOUNDS.maxZ) { pos.current.z = SURF_BOUNDS.maxZ; softDeflect(0, -1); }

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

    // Sit ON the surface rather than merely at its height: sample the wave field
    // a board length fore/aft and rail to rail, and tilt to the slope between.
    // Four extra seaHeight calls per frame, no allocation. This is the single
    // thing that makes the board read as floating instead of sliding on glass.
    const fx = Math.sin(heading.current);
    const fz = Math.cos(heading.current);
    // Exact partial derivatives rather than four finite-difference probes: same
    // answer, half the trigonometry, and no span constant to tune.
    const gx = seaSlopeX(pos.current.x, pos.current.z, t);
    const gz = seaSlopeZ(pos.current.x, pos.current.z, t);
    // Airborne, the board holds its own attitude instead of the water's.
    const grounded = Math.max(0, 1 - airY.current * 0.8);
    const pitchAim = Math.atan(gx * fx + gz * fz) * grounded;
    const rollAim = Math.atan(gx * fz - gz * fx) * grounded;
    pitchSlope.current += (pitchAim - pitchSlope.current) * approach(5, d);
    rollSlope.current += (rollAim - rollSlope.current) * approach(5, d);

    const airPitch = airY.current * 0.06; // nose lifts as it leaves the water
    const carveRoll = riding.current ? Math.sin((t - rideStart.current) * 4.2) * 0.4 : 0;
    const spinP = spinning.current ? THREE.MathUtils.clamp((t - spinStart.current) / SPIN_DUR, 0, 1) : 0;
    const trickSpin = spinP * spinP * (3 - 2 * spinP) * Math.PI * 2;
    const turnRatio = THREE.MathUtils.clamp(turnVel.current / 1.9, -1, 1);
    board.current.rotation.set(
      // Climbing a face lifts the nose, so the slope enters negated.
      -pitchSlope.current - airPitch,
      heading.current + trickSpin,
      turnRatio * -0.18 + rollSlope.current * 0.7 + carveRoll
    );
    // Rider leans into the carve (z) and is pitched prone during the paddle-in (x).
    // A gentle paddle sway while prone sells the stroke.
    const leanAim =
      leanTarget(turnIn, turnVel.current, speed.current) + carveRoll * 0.6 + (intro ? Math.sin(t * 6) * 0.08 : 0);
    lean.current += (leanAim - lean.current) * approach(6, d);
    if (rider.current) {
      rider.current.rotation.z = lean.current;
      rider.current.rotation.x = riderPitch.current;
    }

    // Tail spray: thrown only with real pace and only in contact with the water.
    // Each droplet gets its own outward and upward velocity so the plume fans
    // instead of moving as one sheet.
    const fast = Math.abs(speed.current);
    if (!intro && airY.current < 0.12 && t - lastSprayAt.current > sprayInterval(speed.current)) {
      const slot = spraySlots.current[sprayCursor.current % SPRAY_N];
      const side = (Math.random() - 0.5) * 2;
      slot.born = t;
      slot.x = pos.current.x - Math.sin(heading.current) * 0.9;
      slot.y = bobY + 0.1;
      slot.z = pos.current.z - Math.cos(heading.current) * 0.9;
      // Back along the wake, fanned sideways, with a kick of lift that scales
      // with how hard the board is being driven.
      const back = -(0.35 + fast * 0.06);
      const lateral = side * (1.1 + Math.abs(turnRatio) * 2.6);
      slot.vx = Math.sin(heading.current) * back + Math.cos(heading.current) * lateral;
      slot.vz = Math.cos(heading.current) * back - Math.sin(heading.current) * lateral;
      slot.vy = 3.4 + Math.random() * 1.8 + Math.abs(turnRatio) * 2.6;
      sprayCursor.current += 1;
      lastSprayAt.current = t;
    }
    for (let i = 0; i < SPRAY_N; i++) {
      const mesh = sprayMeshes.current[i];
      if (!mesh) continue;
      const slot = spraySlots.current[i];
      const age = t - slot.born;
      if (age < 0 || age > SPRAY_DUR) {
        mesh.visible = false;
        continue;
      }
      const p = age / SPRAY_DUR;
      mesh.visible = true;
      mesh.position.set(
        slot.x + slot.vx * age,
        slot.y + slot.vy * age - 0.5 * SPRAY_GRAVITY * age * age,
        slot.z + slot.vz * age
      );
      // Always face the camera, so a flat quad never turns edge-on and vanishes.
      mesh.quaternion.copy(camera.quaternion);
      mesh.scale.setScalar(0.7 + p * 0.9);
      // Hold, then go: a droplet that starts fading at once never registers.
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1, (1 - p) * 1.8) * 0.6;
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
    //
    // The height/distance ratio is not a taste call, it decides whether you can
    // see the sea at all. At 6 up over 12 back the camera looks down at 26.6
    // degrees while its vertical half-FOV is 22.5, so the horizon sat ~4 degrees
    // ABOVE the top edge of the frame: no skyline, no wave relief, just a flat
    // teal plan view of a board. Staying under the half-FOV puts the horizon back
    // on screen, and then the swell reads as relief because you see it edge-on.
    const paceT = paceRatio(speed.current);
    // Trail the COURSE, not the nose: with slip, framing off the heading swings
    // the whole view sideways every time the tail steps out.
    const camYaw = course.current + lookYaw.current + (riding.current ? 0.48 : 0);
    const behind = cameraDistance(speed.current, riding.current);
    const height = cameraHeight(speed.current, riding.current) + airY.current * 0.4 + lookPitch.current * 4;
    camTarget.current.set(
      pos.current.x - Math.sin(camYaw) * behind,
      bobY + height,
      pos.current.z - Math.cos(camYaw) * behind
    );
    // Critically-damped spring rather than a lerp. A lerp is a first-order lag:
    // it always trails by the same proportion and can never overshoot, so it
    // reads as a camera being dragged. A spring settles, and softening it with
    // pace is what makes fast travel feel loose without ever losing the board.
    const springK = chaseStiffness(speed.current);
    const springC = chaseDamping(springK);
    // Reused scratch vector: `camTarget.clone()` here would allocate a Vector3
    // every frame, which is the exact thing CameraRig was once fixed for.
    camDelta.current.subVectors(camTarget.current, camera.position);
    camVel.current.addScaledVector(camDelta.current, springK * d);
    camVel.current.addScaledVector(camVel.current, -springC * d);
    camera.position.addScaledVector(camVel.current, d);
    // Aim down the line, and let the aim point SINK toward the water as pace
    // builds: that levels the lens, drops the board into the lower third and
    // climbs the horizon into frame. It is the whole difference between an ocean
    // and a teal plane.
    const lookAhead = (riding.current ? 4 : 2.5) + paceT * 5;
    lookTarget.current.set(
      pos.current.x + Math.sin(course.current) * lookAhead,
      bobY + cameraLookHeight(speed.current, riding.current) + airY.current * 0.5 + lookPitch.current * 2,
      pos.current.z + Math.cos(course.current) * lookAhead
    );
    cameraLook.current.lerp(lookTarget.current, approach(10, d));
    camera.lookAt(cameraLook.current);
    // A little roll into the carve. Applied after lookAt, which zeroes roll.
    camera.rotateZ(cameraBank(lean.current, speed.current));
    // Speed widens the lens. Small in degrees, large in how fast it feels.
    const persp = camera as THREE.PerspectiveCamera;
    // Corrected for the window's shape: a portrait phone crops the SIDES off
    // this lens, not the top and bottom, so the same number is a much narrower
    // view there than it is on a laptop.
    const targetFov = aspectFov(cameraFov(speed.current, airY.current), persp.aspect);
    if (Math.abs(persp.fov - targetFov) > 0.02) {
      persp.fov += (targetFov - persp.fov) * approach(2.6, d);
      persp.updateProjectionMatrix();
    }
    if (Math.abs(speed.current) > 0.5 || turnIn !== 0 || intro || airY.current > 0.05) regress();
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
        {spraySlots.current.map((_, i) => (
          <mesh
            key={i}
            ref={(mesh) => { sprayMeshes.current[i] = mesh; }}
            visible={false}
            raycast={() => null}
          >
            <primitive object={SPRAY_GEO} attach="geometry" />
            <meshBasicMaterial color="#f2fbf8" transparent opacity={0} depthWrite={false} />
          </mesh>
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
