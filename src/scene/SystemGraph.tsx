import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type SceneState =
  | "chaos"
  | "constraints"
  | "decisions"
  | "deterministic"
  | "proof";

type Props = {
  scene: SceneState;
};

type Node = {
  id: string;
  base: THREE.Vector3;
  chaos: THREE.Vector3;
};

const NODES: Node[] = [
  { id: "user",   base: new THREE.Vector3(-2, 0.5, 0), chaos: new THREE.Vector3(-1.2, 1.4, 0.2) },
  { id: "engine", base: new THREE.Vector3( 0, 0.0, 0), chaos: new THREE.Vector3( 0.6, 1.1,-0.2) },
  { id: "ledger", base: new THREE.Vector3( 2,-0.4, 0), chaos: new THREE.Vector3( 1.6,-1.2, 0.1) },
];

const EDGES = [
  { a: 0, b: 1 }, // user → engine
  { a: 1, b: 2 }, // engine → ledger
];

export default function SystemGraph({ scene }: Props) {
  const group = useRef<THREE.Group>(null!);
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const lineRefs = useRef<THREE.Line[]>([]);

  const order = useMemo(() => {
    switch (scene) {
      case "chaos": return 0.0;
      case "constraints": return 0.4;
      case "decisions": return 0.7;
      case "deterministic": return 0.9;
      case "proof":
      default: return 1.0;
    }
  }, [scene]);

  const focusedEdges = useMemo(() => {
    switch (scene) {
      case "chaos":
        return new Set<number>();
      case "constraints":
        return new Set<number>([0]); // user → engine
      case "decisions":
        return new Set<number>([0, 1]);
      case "deterministic":
        return new Set<number>([1]); // engine → ledger
      case "proof":
        return new Set<number>([0, 1]);
      default:
        return new Set<number>();
    }
  }, [scene]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;

    // nodes
    nodeRefs.current.forEach((mesh, i) => {
      const n = NODES[i];
      const targetPos = new THREE.Vector3().lerpVectors(n.chaos, n.base, order);
      mesh.position.lerp(targetPos, 1 - Math.pow(0.001, delta));
    });

    // edges
    lineRefs.current.forEach((line, i) => {
      const mat = line.material as THREE.LineBasicMaterial;
      const isFocused = focusedEdges.has(i);
      const targetOpacity = isFocused ? 1.0 : 0.15;
      const targetColor = isFocused ? "#ffffff" : "#6b7280";

      mat.transparent = true;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
      mat.color.lerp(new THREE.Color(targetColor), 0.1);
    });

    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, 0.12 * (1 - order), 0.02);
  });

  return (
    <group ref={group}>
      {/* nodes */}
      {NODES.map((n, i) => (
        <mesh
          key={n.id}
          ref={(el: THREE.Mesh | null) => el && (nodeRefs.current[i] = el)}
        >
          <sphereGeometry args={[0.25, 24, 24]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* edges */}
      {EDGES.map(({ a, b }, i) => (
        <line
          key={i}
          ref={(el: THREE.Line | null) => el && (lineRefs.current[i] = el)}
        >
          <bufferGeometry
            setFromPoints={[NODES[a].base, NODES[b].base]}
          />
          <lineBasicMaterial color="#6b7280" opacity={0.15} />
        </line>
      ))}
    </group>
  );
}
