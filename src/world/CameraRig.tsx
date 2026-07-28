import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SPACING, EMP_COUNT, INDIE_INDEX, WATER_Y, islandX, islandBaseZ } from "./geometry";
import { markEgg } from "../state/progress";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";

interface Props {
  activeIndex: number;
  accent: string;
  entered: boolean;
  surfing: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const CENTER_X = ((EMP_COUNT - 1) / 2) * SPACING;
const ORBIT_RADIUS = 16;
const ORBIT_HEIGHT = 7;

/**
 * On-rails camera + 360° orbit + the "surf" ride to the indie island.
 * Travel is sampled along the gapped island path (islandX), so heading past the
 * last employment island glides across the water gap to the indie island. While
 * over water, a surfboard (with a little rider) rides the surface for personality.
 */
export default function CameraRig({ activeIndex, accent, entered, surfing }: Props) {
  const gl = useThree((s) => s.gl);
  const regress = useThree((s) => s.performance.regress);
  const reduced = usePrefersReducedMotion();
  const lightRef = useRef<THREE.PointLight>(null);
  const boardRef = useRef<THREE.Group>(null);
  const progress = useRef(activeIndex);
  const enterT = useRef(entered ? 1 : 0);
  const orbit = useRef(0);
  const tilt = useRef(0);
  const look = useRef(new THREE.Vector3(CENTER_X, 1, 0));
  const tPos = useRef(new THREE.Vector3());
  const tLook = useRef(new THREE.Vector3());
  const wPos = useRef(new THREE.Vector3());
  const iPos = useRef(new THREE.Vector3());

  useEffect(() => {
    const el = gl.domElement;
    el.style.cursor = "grab";
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      orbit.current -= (e.clientX - lastX) * 0.008;
      tilt.current = THREE.MathUtils.clamp(tilt.current + (e.clientY - lastY) * 0.02, -3, 5);
      lastX = e.clientX;
      lastY = e.clientY;
      regress(); // drop resolution while dragging, restore when it settles
    };
    const up = () => {
      dragging = false;
      el.style.cursor = "grab";
    };
    // Keyboard orbit (Q/E) so the spin is reachable without a mouse.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q") orbit.current += 0.22;
      else if (e.key === "e" || e.key === "E") orbit.current -= 0.22;
      else return;
      regress();
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", onKey);
    };
  }, [gl, regress]);

  useFrame((state, dt) => {
    // Surf mode owns the camera; stand down so we don't fight over it.
    if (surfing) return;
    const k = 1 - Math.exp(-3.5 * dt);
    // Slower enter easing → a more cinematic dive from the establishing shot.
    enterT.current += ((entered ? 1 : 0) - enterT.current) * (1 - Math.exp(-1.5 * dt));
    progress.current += (activeIndex - progress.current) * k;

    // While the camera is actually travelling or diving in, let r3f regress the
    // resolution so the motion stays smooth; it snaps back to crisp when idle.
    if (Math.abs(activeIndex - progress.current) > 0.01 || Math.abs((entered ? 1 : 0) - enterT.current) > 0.01) {
      regress();
    }

    const p = progress.current;
    const i0 = Math.floor(p);
    const i1 = Math.min(i0 + 1, INDIE_INDEX);
    const f = p - i0;
    const cx = lerp(islandX(i0), islandX(i1), f);
    const cz = lerp(islandBaseZ(i0), islandBaseZ(i1), f);
    const t = state.clock.elapsedTime;

    const a = orbit.current;
    iPos.current.set(
      cx + Math.sin(a) * ORBIT_RADIUS,
      ORBIT_HEIGHT + tilt.current + Math.sin(t * 0.45) * 0.15,
      cz + Math.cos(a) * ORBIT_RADIUS
    );
    // Establishing shot: higher + further back so "Begin" descends further.
    // Pulled back a touch for the roomier world.
    wPos.current.set(CENTER_X + Math.sin(t * 0.1) * 3, 30, 64);

    const e = enterT.current;
    tPos.current.copy(wPos.current).lerp(iPos.current, e);
    tLook.current.set(lerp(CENTER_X, cx, e), lerp(1, 1.4, e), lerp(0, cz, e));
    state.camera.position.copy(tPos.current);
    look.current.lerp(tLook.current, k);
    state.camera.lookAt(look.current);

    if (lightRef.current) {
      lightRef.current.position.set(cx, 9, cz + 5);
      // The accent key light breathes over the active island once entered.
      lightRef.current.intensity = 240 + (reduced ? 0 : e * Math.sin(t * 2.5) * 55);
    }

    // Surfboard rides the water while crossing the gap to the indie island.
    if (boardRef.current) {
      const overWater = cx > (EMP_COUNT - 1) * SPACING + 3;
      boardRef.current.visible = overWater && e > 0.6;
      boardRef.current.position.set(cx, WATER_Y + 0.3 + Math.sin(t * 2.2) * 0.18, cz);
      boardRef.current.rotation.set(Math.sin(t * 1.3) * 0.06, Math.PI / 2, Math.sin(t * 1.7) * 0.1);
    }
  });

  return (
    <>
      <pointLight ref={lightRef} color={accent} intensity={240} distance={55} decay={2} position={[0, 9, 5]} />
      {/* Hidden easter egg: only visible (and clickable) while surfing the gap. */}
      <group
        ref={boardRef}
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          markEgg();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = "grab";
        }}
      >
        <mesh>
          <boxGeometry args={[0.9, 0.18, 3.4]} />
          <meshStandardMaterial color="#ffce54" flatShading />
        </mesh>
        <mesh position={[0, 0.75, -0.2]}>
          <boxGeometry args={[0.5, 1.1, 0.5]} />
          <meshStandardMaterial color="#FF0080" flatShading />
        </mesh>
        <mesh position={[0, 1.5, -0.2]}>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshStandardMaterial color="#f0c19c" flatShading />
        </mesh>
      </group>
    </>
  );
}
