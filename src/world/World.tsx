import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Instances, Instance, AdaptiveDpr, PerformanceMonitor, Stars } from "@react-three/drei";
import { PUBLISHED_PROJECTS } from "../projects/projects";
import { buildWorld } from "./geometry";
import CameraRig from "./CameraRig";
import Emblems from "./Emblems";
import SurfController from "./SurfController";
import SurfSpots from "./SurfSpots";
import type { SurfSpot } from "./surf-spots";
import { Water, IndieIsland, Ripples, LightShaft, SunDisc } from "./Ocean";
import { T } from "../theme";

// Horizon color the fog fades islands into — the logo-derived dusk haze, matching
// the CSS sky gradient behind the (transparent) canvas so the world melts into it.
const HORIZON = T.fog;

interface Props {
  activeIndex: number;
  entered: boolean;
  surfing: boolean;
  onOpen: (i: number) => void;
  onNearSpot?: (spot: SurfSpot | null) => void;
  // "never" parks the render loop (hidden tab) so a backgrounded world does no
  // GPU/CPU work; "always" runs it while the world is active + visible.
  frameloop?: "always" | "never";
}

/**
 * The entire interactive world in ONE <Canvas> / one WebGLRenderer. Every cube
 * across every island lives in a single <Instances> (one draw call, per-instance
 * color) — no per-cube draw calls. Lazy-loaded so three.js only ships here.
 */
export default function World({ activeIndex, entered, surfing, onOpen, onNearSpot, frameloop = "always" }: Props) {
  const cubes = useMemo(() => buildWorld(PUBLISHED_PROJECTS), []);
  const accent = PUBLISHED_PROJECTS[activeIndex]?.accent ?? "#6E86D6";
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      frameloop={frameloop}
      // Let r3f drop internal resolution while the camera moves, then snap back
      // to crisp when it settles — keeps orbit/travel smooth on weaker GPUs.
      performance={{ min: 0.5 }}
      camera={{ position: [0, 7, 16], fov: 45 }}
      // Transparent canvas so the CSS dusk gradient (page wrapper) shows through
      // as the sky — a gradient for free, no GL cost.
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      style={{ position: "fixed", inset: 0 }}
      aria-hidden="true"
    >
      {/* Fog fades islands into the horizon color; far plane covers the wider world. */}
      <fog attach="fog" args={[HORIZON, 34, 130]} />

      {/* Tropical-dusk lighting: teal sky bounce + a warm low sun. PBR intensities
          (r3f v9 / three r155+) — ambient + hemisphere carry base visibility. */}
      <ambientLight intensity={1.15} />
      <hemisphereLight args={[T.skyBounce, T.ground, 1.5]} />
      <directionalLight position={[-14, 8, 8]} intensity={2.4} color={T.sunLight} />

      {/* A few faint stars in the upper dusk sky. */}
      <Stars radius={120} depth={40} count={700} factor={3} saturation={0} fade speed={0.6} />
      <SunDisc />

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
      <Ripples active={activeIndex} />
      <LightShaft active={activeIndex} />
      <IndieIsland />
      <Emblems active={activeIndex} onOpen={onOpen} />
      {/* Legendary breaks only exist while surfing → the rail diorama stays clean. */}
      {surfing && <SurfSpots />}
      <SurfController active={surfing} onNearSpot={onNearSpot} />
      <CameraRig activeIndex={activeIndex} accent={accent} entered={entered} surfing={surfing} />
    </Canvas>
  );
}
