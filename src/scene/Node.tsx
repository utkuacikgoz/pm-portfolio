import { useMemo } from "react";
import * as THREE from "three";

export default function Node({
  position,
  size = 0.18,
  emissive = 0.25,
  opacity = 0.95,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  key: _key,
}: {
  position: [number, number, number];
  size?: number;
  emissive?: number;
  opacity?: number;
  key?: string | number;
}) {
  const geom = useMemo(() => new THREE.IcosahedronGeometry(size, 0), [size]);

  return (
    <mesh geometry={geom} position={position}>
      <meshStandardMaterial
        color={"white"}
        emissive={"white"}
        emissiveIntensity={emissive}
        transparent
        opacity={opacity}
        roughness={0.35}
        metalness={0.2}
      />
    </mesh>
  );
}
