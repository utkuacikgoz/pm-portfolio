import { Line } from "@react-three/drei";
import * as THREE from "three";

export default function Edge({
  from,
  to,
  opacity = 0.25,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  key: _key,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  opacity?: number;
  key?: string | number;
}) {
  return (
    <Line
      points={[from, to]}
      color="white"
      transparent
      opacity={opacity}
      lineWidth={1}
    />
  );
}
