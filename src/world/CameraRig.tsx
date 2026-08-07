import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SPACING, EMP_COUNT, INDIE_INDEX, WATER_Y, islandX, islandBaseZ, seaHeight } from "./geometry";
import { markEgg } from "../state/progress";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";
import Surfer from "./Surfer";

interface Props {
  activeIndex: number;
  accent: string;
  entered: boolean;
  surfing: boolean;
  /**
   * Whether this mount should play the dive from the establishing shot.
   *
   * It cannot be inferred from `entered`. World only mounts once `entered` is
   * already true (the hero is pure DOM until then, by design), so seeding the
   * enter easing from `entered` started it at 1 and the cinematic dive never
   * played at all. A deep link should still skip it and open on its island.
   */
  dive: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const CENTER_X = ((EMP_COUNT - 1) / 2) * SPACING;

// Fixed isometric framing (no free orbit): the camera always sits at the same
// 45-degree angle a set distance back, pulled far enough that the whole island
// plus its floating icon stay in frame. Easier to navigate + no grazing-angle
// crop/z-fight than the old low orbit.
const ISO = new THREE.Vector3(1, 0.82, 1).normalize();
const ISO_DIST = 30;
const LOOK_Y = 2.5;
// Spring that carries the camera between islands: underdamped so travel gives a
// little bounce (the "3D universe" feel) rather than a flat glide. Softened so
// the crossing is unhurried — you can actually see the surfer riding the gap.
const STIFF = 68;
const DAMP = 12;

/**
 * On-rails camera at a fixed 45-degree angle, with a springy bounce between
 * islands and the "surf" ride across the water gap to the indie island. Travel is
 * sampled along the gapped island path (islandX). While over water, a surfboard
 * (with a little rider) rides the surface for personality.
 */
export default function CameraRig({ activeIndex, accent, entered, surfing, dive }: Props) {
  const gl = useThree((s) => s.gl);
  const regress = useThree((s) => s.performance.regress);
  const reduced = usePrefersReducedMotion();
  const lightRef = useRef<THREE.PointLight>(null);
  const boardRef = useRef<THREE.Group>(null);
  const progress = useRef(activeIndex);
  const vel = useRef(0); // spring velocity for the island-to-island bounce
  // Starts at 0 only when this mount is an entrance; the per-frame easing below
  // then carries it to 1, which is the dive.
  const enterT = useRef(dive ? 0 : 1);
  const wasSurfing = useRef(false); // true on the frame surf hands the camera back
  const look = useRef(new THREE.Vector3(CENTER_X, 1, 0));
  const tPos = useRef(new THREE.Vector3());
  const tLook = useRef(new THREE.Vector3());
  const wPos = useRef(new THREE.Vector3());
  const iPos = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    // Surf mode owns the camera; stand down so we don't fight over it.
    if (surfing) {
      wasSurfing.current = true;
      return;
    }
    const d = Math.min(dt, 0.05); // clamp so a stutter can't destabilize the spring
    // Handing the camera BACK from surf mode: our look/spring refs have been
    // frozen the whole time the surf chase-cam was driving, so resuming from them
    // eases out of a stale pose (and, if a panel opened in the same tick, the
    // stale target is somewhere out at sea). Re-acquire on the first frame back.
    const reacquire = wasSurfing.current;
    if (reacquire) {
      wasSurfing.current = false;
      vel.current = 0;
      progress.current = activeIndex;
    }
    const k = reacquire ? 1 : 1 - Math.exp(-3.5 * dt);
    // Slower enter easing → a more cinematic dive from the establishing shot.
    enterT.current += ((entered ? 1 : 0) - enterT.current) * (1 - Math.exp(-1.5 * dt));

    // Spring toward the active island (underdamped → a settling bounce).
    const disp = activeIndex - progress.current;
    vel.current += (STIFF * disp - DAMP * vel.current) * d;
    progress.current += vel.current * d;

    if (Math.abs(disp) > 0.01 || Math.abs(vel.current) > 0.02 || Math.abs((entered ? 1 : 0) - enterT.current) > 0.01) {
      regress(); // drop resolution while moving; snaps back crisp when settled
    }

    const p = progress.current;
    const i0 = Math.max(0, Math.min(Math.floor(p), INDIE_INDEX));
    const i1 = Math.min(i0 + 1, INDIE_INDEX);
    const f = p - i0;
    const cx = lerp(islandX(i0), islandX(i1), f);
    const cz = lerp(islandBaseZ(i0), islandBaseZ(i1), f);
    const t = state.clock.elapsedTime;

    // Fixed iso position, plus a barely-there idle float for life.
    const bob = reduced ? 0 : Math.sin(t * 0.45) * 0.15;
    iPos.current.set(cx + ISO.x * ISO_DIST, ISO.y * ISO_DIST + bob, cz + ISO.z * ISO_DIST);
    // Establishing shot: high + far back so entering descends into the framing.
    wPos.current.set(CENTER_X + Math.sin(t * 0.1) * 3, 34, 70);

    const e = enterT.current;
    tPos.current.copy(wPos.current).lerp(iPos.current, e);
    tLook.current.set(lerp(CENTER_X, cx, e), lerp(1, LOOK_Y, e), lerp(0, cz, e));
    state.camera.position.copy(tPos.current);
    look.current.lerp(tLook.current, k);
    state.camera.lookAt(look.current);

    if (lightRef.current) {
      lightRef.current.position.set(cx, 9, cz + 5);
      // The accent key light breathes over the active island once entered.
      lightRef.current.intensity = 240 + (reduced ? 0 : e * Math.sin(t * 2.5) * 55);
    }

    // Surfboard rides the water while crossing the gap to the indie island —
    // scaled up + shown a touch earlier so you can tell someone's surfing there.
    if (boardRef.current) {
      const overWater = cx > (EMP_COUNT - 1) * SPACING - 2;
      boardRef.current.visible = overWater && e > 0.5;
      boardRef.current.position.set(cx, WATER_Y + seaHeight(cx, cz, t) + 0.45, cz);
      boardRef.current.rotation.set(Math.sin(t * 1.3) * 0.06, Math.PI / 2, Math.sin(t * 1.7) * 0.1);
    }
  });

  return (
    <>
      <pointLight ref={lightRef} visible={!surfing} color={accent} intensity={240} distance={55} decay={2} position={[0, 9, 5]} />
      {/* Hidden easter egg: only visible (and clickable) while surfing the gap. */}
      <group
        ref={boardRef}
        visible={false}
        scale={1.5}
        onClick={(e) => {
          e.stopPropagation();
          markEgg();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = "default";
        }}
      >
        <Surfer />
        {/* Invisible hitbox so the group still catches the egg click (the Surfer
            meshes opt out of raycast). */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[1.4, 2, 3.6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}
