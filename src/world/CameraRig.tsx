import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

/**
 * On-rails camera. During the intro (`entered` false) it holds a wide cinematic
 * establishing shot of the whole archipelago; on "Begin" it flies into the active
 * island (enterT eases 0→1). Once entered, a continuous `progress` value damps
 * toward the active island and is sampled along the weaving path so multi-island
 * jumps glide. Reuses vectors (zero per-frame allocation). Carries the accent
 * point light (physically-based intensity).
 */
export default function CameraRig({ activeIndex, accent, entered }: Props) {
  const lightRef = useRef<THREE.PointLight>(null);
  const progress = useRef(activeIndex);
  const enterT = useRef(entered ? 1 : 0);
  const look = useRef(new THREE.Vector3(CENTER_X, 1, 0));
  const tPos = useRef(new THREE.Vector3());
  const tLook = useRef(new THREE.Vector3());
  const wPos = useRef(new THREE.Vector3());
  const wLook = useRef(new THREE.Vector3());
  const iPos = useRef(new THREE.Vector3());
  const iLook = useRef(new THREE.Vector3());

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

    // Island framing (with gentle idle drift).
    iPos.current.set(cx + Math.sin(t * 0.18) * 0.7, 7 + Math.sin(t * 0.45) * 0.25, 16 + cz * 0.35);
    iLook.current.set(cx, 1.4, cz);
    // Wide establishing framing (slow drift) for the intro.
    wPos.current.set(CENTER_X + Math.sin(t * 0.1) * 3, 22, 50);
    wLook.current.set(CENTER_X, 1, 0);

    const e = enterT.current;
    tPos.current.copy(wPos.current).lerp(iPos.current, e);
    tLook.current.copy(wLook.current).lerp(iLook.current, e);
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
