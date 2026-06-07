import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SPACING } from "./geometry";

interface Props {
  activeIndex: number;
  accent: string;
}

/**
 * Drives the on-rails camera: damps position + lookAt toward the active
 * island's waypoint every frame (framerate-independent, zero per-frame
 * allocation — all vectors are reused refs). Also carries the accent point
 * light so the focused island gets a neon wash.
 */
export default function CameraRig({ activeIndex, accent }: Props) {
  const lightRef = useRef<THREE.PointLight>(null);
  const look = useRef(new THREE.Vector3(0, 1.5, 0));
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const x = activeIndex * SPACING;
    targetPos.current.set(x, 7, 16);
    targetLook.current.set(x, 1.5, 0);

    const k = 1 - Math.exp(-3.5 * dt); // smooth, framerate-independent
    state.camera.position.lerp(targetPos.current, k);
    look.current.lerp(targetLook.current, k);
    state.camera.lookAt(look.current);

    if (lightRef.current) lightRef.current.position.set(x, 9, 5);
  });

  return (
    <pointLight
      ref={lightRef}
      color={accent}
      intensity={2.2}
      distance={55}
      position={[0, 9, 5]}
    />
  );
}
