import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Instances, Instance, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { PUBLISHED_PROJECTS } from "../projects/projects";
import { buildWorld } from "./geometry";
import CameraRig from "./CameraRig";
import Emblems from "./Emblems";
import { Water, IndieIsland } from "./Ocean";

interface Props {
  activeIndex: number;
  entered: boolean;
}

/**
 * The entire interactive world in ONE <Canvas> / one WebGLRenderer. Every cube
 * across every island lives in a single <Instances> (one draw call, per-instance
 * color) — no per-cube draw calls. Lazy-loaded so three.js only ships here.
 */
export default function World({ activeIndex, entered }: Props) {
  const cubes = useMemo(() => buildWorld(PUBLISHED_PROJECTS), []);
  const accent = PUBLISHED_PROJECTS[activeIndex]?.accent ?? "#FF0080";
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 7, 16], fov: 45 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0 }}
      aria-hidden="true"
    >
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#05060a", 20, 70]} />

      {/* Physically-based intensities (r3f v9 / three r155+). Ambient + hemisphere
          carry base visibility (distance-independent); directional adds form. */}
      <ambientLight intensity={1.3} />
      <hemisphereLight args={["#9fb4ff", "#0a0c12", 1.6]} />
      <directionalLight position={[8, 14, 6]} intensity={2.6} />

      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.5)}
      />
      <AdaptiveDpr pixelated />

      <Instances limit={cubes.length} range={cubes.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial flatShading roughness={0.55} metalness={0.05} />
        {cubes.map((c, i) => (
          <Instance key={i} position={c.position} scale={c.scale} color={c.color} />
        ))}
      </Instances>

      <Water />
      <IndieIsland />
      <Emblems active={activeIndex} />
      <CameraRig activeIndex={activeIndex} accent={accent} entered={entered} />
    </Canvas>
  );
}
