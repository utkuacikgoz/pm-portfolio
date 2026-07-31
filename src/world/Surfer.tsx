import { forwardRef, useMemo } from "react";
import * as THREE from "three";

const SKIN = "#c98252";
const HAIR = "#3b2418";
const BOARD_TOP = "#f4eedf";
const Y_UP = new THREE.Vector3(0, 1, 0);

function Limb({ a, b, radius, color }: { a: [number, number, number]; b: [number, number, number]; radius: number; color: string }) {
  const transform = useMemo(() => {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const direction = new THREE.Vector3().subVectors(to, from);
    return {
      position: new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(Y_UP, direction.clone().normalize()),
      length: direction.length(),
    };
  }, [a, b]);
  return (
    <mesh position={transform.position} quaternion={transform.quaternion} raycast={() => null}>
      <capsuleGeometry args={[radius, Math.max(0.02, transform.length - radius * 2), 3, 6]} />
      <meshStandardMaterial color={color} roughness={0.78} flatShading />
    </mesh>
  );
}

function Joint({ position, radius, color, scale = [1, 1, 1] }: { position: [number, number, number]; radius: number; color: string; scale?: [number, number, number] }) {
  return (
    <mesh position={position} scale={scale} raycast={() => null}>
      <icosahedronGeometry args={[radius, 1]} />
      <meshStandardMaterial color={color} roughness={0.8} flatShading />
    </mesh>
  );
}

function Board({ accent }: { accent: string }) {
  const geometry = useMemo(() => {
    const outline = new THREE.Shape();
    outline.moveTo(0, 1.75);
    outline.bezierCurveTo(0.46, 1.55, 0.56, 0.7, 0.48, -0.7);
    outline.bezierCurveTo(0.42, -1.35, 0.25, -1.65, 0, -1.72);
    outline.bezierCurveTo(-0.25, -1.65, -0.42, -1.35, -0.48, -0.7);
    outline.bezierCurveTo(-0.56, 0.7, -0.46, 1.55, 0, 1.75);
    const built = new THREE.ExtrudeGeometry(outline, { depth: 0.09, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.035, bevelSegments: 2, curveSegments: 12 });
    built.rotateX(Math.PI / 2);
    built.translate(0, 0.02, 0);
    built.computeVertexNormals();
    return built;
  }, []);
  return (
    <group>
      <mesh geometry={geometry} raycast={() => null}>
        <meshStandardMaterial color={BOARD_TOP} roughness={0.42} flatShading />
      </mesh>
      <mesh position={[0, 0.105, 0]} scale={[0.025, 0.015, 1.48]} raycast={() => null}>
        <boxGeometry />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.16, -1.32]} rotation={[0.2, 0, 0]} raycast={() => null}>
        <coneGeometry args={[0.13, 0.38, 5]} />
        <meshStandardMaterial color={accent} roughness={0.65} flatShading />
      </mesh>
    </group>
  );
}

/** Deliberately stylized low-poly rider with a readable, balanced surf stance. */
const Surfer = forwardRef<THREE.Group, { accent?: string }>(function Surfer({ accent = "#6E86D6" }, riderRef) {
  return (
    <group>
      <Board accent={accent} />
      <group ref={riderRef} position={[0, 0.14, 0]}>
        {/* Bent knees and an open stance keep the silhouette athletic, not mannequin-like. */}
        <Limb a={[-0.25, 0.1, 0.55]} b={[-0.12, 0.43, 0.3]} radius={0.105} color={SKIN} />
        <Limb a={[-0.12, 0.43, 0.3]} b={[0.02, 0.68, 0.05]} radius={0.14} color={accent} />
        <Limb a={[0.25, 0.1, -0.52]} b={[0.14, 0.42, -0.28]} radius={0.105} color={SKIN} />
        <Limb a={[0.14, 0.42, -0.28]} b={[0.02, 0.68, 0.02]} radius={0.14} color={accent} />
        <Joint position={[-0.25, 0.08, 0.56]} radius={0.12} color={SKIN} scale={[1.5, 0.45, 1]} />
        <Joint position={[0.25, 0.08, -0.52]} radius={0.12} color={SKIN} scale={[1.5, 0.45, 1]} />

        {/* One clean torso mass and rash vest replace anatomical decoration. */}
        <mesh position={[0, 0.92, 0.08]} rotation={[0.08, 0, 0]} raycast={() => null}>
          <coneGeometry args={[0.22, 0.62, 7]} />
          <meshStandardMaterial color="#e7d7bd" roughness={0.72} flatShading />
        </mesh>
        <Joint position={[0, 0.66, 0.03]} radius={0.23} color={accent} scale={[1.15, 0.62, 1]} />
        <Joint position={[0, 1.18, 0.1]} radius={0.17} color={SKIN} scale={[0.9, 1.08, 0.92]} />
        <mesh position={[0, 1.25, 0.02]} rotation={[0.15, 0, 0]} raycast={() => null}>
          <sphereGeometry args={[0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color={HAIR} roughness={0.88} flatShading />
        </mesh>

        {/* Long counterbalanced arms communicate carve direction at a glance. */}
        <Limb a={[-0.2, 1.02, 0.08]} b={[-0.62, 0.88, 0.42]} radius={0.085} color={SKIN} />
        <Limb a={[-0.62, 0.88, 0.42]} b={[-0.82, 0.72, 0.56]} radius={0.075} color={SKIN} />
        <Limb a={[0.2, 1.02, 0.08]} b={[0.58, 1.12, -0.28]} radius={0.085} color={SKIN} />
        <Limb a={[0.58, 1.12, -0.28]} b={[0.78, 1.2, -0.48]} radius={0.075} color={SKIN} />
        <Joint position={[-0.83, 0.71, 0.57]} radius={0.085} color={SKIN} />
        <Joint position={[0.79, 1.21, -0.49]} radius={0.085} color={SKIN} />
      </group>
    </group>
  );
});

export default Surfer;
