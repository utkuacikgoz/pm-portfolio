

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SPACING, islandBaseZ } from "./geometry";
import { PUBLISHED_PROJECTS } from "../projects/projects";

interface Props {
  activeIndex: number;
  accent: string;
  entered: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const CENTER_X = ((PUBLISHED_PROJECTS.length - 1) / 2) * SPACING;
const ORBIT_RADIUS = 16;
const ORBIT_HEIGHT = 7;

/**
 * On-rails camera + free 360° orbit of the active structure.
 * - Intro (`entered` false): a wide cinematic establishing shot; "Begin" flies in.
 * - Travel: a continuous `progress` value damps toward the active island and is
 *   sampled along the weaving path so jumps glide.
 * - Orbit: drag on the canvas to swing the camera all the way around the focused
 *   island (the user asked to "spin the towers 360°"). Vertical drag tilts slightly.
 * Reuses vectors (zero per-frame allocation); carries the accent point light.
 */
export default function CameraRig({ activeIndex, accent, entered }: Props) {
  const gl = useThree((s) => s.gl);
  const lightRef = useRef<THREE.PointLight>(null);
  const progress = useRef(activeIndex);
  const enterT = useRef(entered ? 1 : 0);
  const orbit = useRef(0); // azimuth radians
  const tilt = useRef(0); // small vertical offset
  const look = useRef(new THREE.Vector3(CENTER_X, 1, 0));
  const tPos = useRef(new THREE.Vector3());
  const tLook = useRef(new THREE.Vector3());
  const wPos = useRef(new THREE.Vector3());
  const iPos = useRef(new THREE.Vector3());

  // Drag-to-orbit (mouse / pointer). Window-level move/up so leaving the canvas
  // mid-drag doesn't drop it.
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
    };
    const up = () => {
      dragging = false;
      el.style.cursor = "grab";
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-3.5 * dt);
    enterT.current += ((entered ? 1 : 0) - enterT.current) * (1 - Math.exp(-2.2 * dt));
    progress.current += (activeIndex - progress.current) * k;

    const p = progress.current;
    const i0 = Math.floor(p);
    const f = p - i0;
    const cx = p * SPACING;
    const cz = lerp(islandBaseZ(i0), islandBaseZ(i0 + 1), f);
    const t = state.clock.elapsedTime;

    // Island framing — orbit around the island center.
    const a = orbit.current;
    iPos.current.set(
      cx + Math.sin(a) * ORBIT_RADIUS,
      ORBIT_HEIGHT + tilt.current + Math.sin(t * 0.45) * 0.15,
      cz + Math.cos(a) * ORBIT_RADIUS
    );
    // Wide establishing framing for the intro.
    wPos.current.set(CENTER_X + Math.sin(t * 0.1) * 3, 22, 50);

    const e = enterT.current;
    tPos.current.copy(wPos.current).lerp(iPos.current, e);
    tLook.current.set(lerp(CENTER_X, cx, e), lerp(1, 1.4, e), lerp(0, cz, e));
    state.camera.position.copy(tPos.current);
    look.current.lerp(tLook.current, k);
    state.camera.lookAt(look.current);

    if (lightRef.current) lightRef.current.position.set(cx, 9, cz + 5);
  });

  return (
    <pointLight
      ref={lightRef}
      color={accent}
      intensity={240}
      distance={55}
      decay={2}
      position={[0, 9, 5]}
    />
  );
}
