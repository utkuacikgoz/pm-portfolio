import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SPACING, islandBaseZ } from "./geometry";

interface Props {
  activeIndex: number;
  accent: string;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * On-rails camera. A continuous `progress` value damps toward the active island
 * (framerate-independent) and is sampled along the weaving island path, so jumps
 * across multiple islands glide rather than snap. Reuses vectors (zero per-frame
 * allocation). Carries the accent point light — intensity is in physically-based
 * units (r3f v9 / three r155+), hence the large value.
 */
export default function CameraRig({ activeIndex, accent }: Props) {
  const lightRef = useRef<THREE.PointLight>(null);
  const progress = useRef(activeIndex);
  const look = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const targetPos = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-3.5 * dt);
    progress.current += (activeIndex - progress.current) * k;

    const p = progress.current;
    const i0 = Math.floor(p);
    const i1 = i0 + 1;
    const f = p - i0;

    const cx = p * SPACING;
    const cz = lerp(islandBaseZ(i0), islandBaseZ(i1), f);

    const t = state.clock.elapsedTime;
    // Position is already smooth (driven by smoothed progress); add gentle idle drift.
    targetPos.current.set(cx + Math.sin(t * 0.18) * 0.7, 7 + Math.sin(t * 0.45) * 0.25, 16 + cz * 0.35);
    state.camera.position.copy(targetPos.current);

    targetLook.current.set(cx, 1.4, cz);
    look.current.lerp(targetLook.current, k);
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
