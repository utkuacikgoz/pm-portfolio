import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { INDIE_PROJECTS } from "../projects/projects";
import { indiePylonTop } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";

interface Props {
  /** The product in focus, from either side: a hovered row or a hovered pylon. */
  focus: string | null;
  onFocus: (id: string | null) => void;
  onOpenProduct: (id: string) => void;
}

/**
 * Ties the indie island to its panel. The pylons themselves are baked into the
 * scene's one InstancedMesh, so this layer adds what they cannot have: a hit
 * box each (hover to highlight the row, click to open the product) and an
 * accent beam that rises from whichever pylon is in focus.
 */
export default function IndiePylons({ focus, onFocus, onOpenProduct }: Props) {
  const n = INDIE_PROJECTS.length;
  return (
    <>
      {INDIE_PROJECTS.map((p, i) => (
        <Pylon
          key={p.id}
          id={p.id}
          accent={p.accent}
          top={indiePylonTop(i, n)}
          focused={focus === p.id}
          onFocus={onFocus}
          onOpenProduct={onOpenProduct}
        />
      ))}
    </>
  );
}

function Pylon({
  id,
  accent,
  top,
  focused,
  onFocus,
  onOpenProduct,
}: {
  id: string;
  accent: string;
  top: [number, number, number];
  focused: boolean;
  onFocus: Props["onFocus"];
  onOpenProduct: Props["onOpenProduct"];
}) {
  const gl = useThree((s) => s.gl);
  const reduced = usePrefersReducedMotion();
  const beam = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const level = useRef(0);
  const [x, y, z] = top;

  useFrame((state, dt) => {
    const target = focused ? 1 : 0;
    level.current = reduced ? target : THREE.MathUtils.damp(level.current, target, 10, Math.min(dt, 0.05));
    if (mat.current) mat.current.opacity = level.current * (0.32 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 3) * 0.06));
    if (beam.current) {
      beam.current.visible = level.current > 0.01;
      beam.current.scale.set(1, 0.2 + 0.8 * level.current, 1);
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Hit box over the whole stack. Transparent rather than invisible, so
          the raycaster still sees it. */}
      <mesh
        position={[0, y / 2, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = "pointer";
          onFocus(id);
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = "default";
          onFocus(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenProduct(id);
        }}
      >
        <boxGeometry args={[1.8, y + 0.8, 1.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={beam} position={[0, y + 4.5, 0]} visible={false} raycast={() => null}>
        <cylinderGeometry args={[0.18, 0.75, 9, 10, 1, true]} />
        <meshBasicMaterial
          ref={mat}
          color={accent}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
