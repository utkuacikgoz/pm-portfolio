import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Instances, Instance, PerformanceMonitor, Stars } from "@react-three/drei";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";
import { daylight } from "./daylight";
import { PUBLISHED_PROJECTS } from "../projects/projects";
import { buildWorld } from "./geometry";
import CameraRig from "./CameraRig";
import Emblems from "./Emblems";
import SurfController from "./SurfController";
import SurfSpots from "./SurfSpots";
import type { Checkpoint } from "./surf-journey";
import { Water, IslandShadows, IndieIsland, Ripples, LightShaft, SunDisc, DistantMountains } from "./Ocean";
import { T } from "../theme";

// Horizon color the fog fades islands into — the logo-derived dusk haze, matching
// the CSS sky gradient behind the (transparent) canvas so the world melts into it.
const HORIZON = T.fog;

// Dusk <-> daytime cross-fade colors.
const FOG_DUSK = new THREE.Color(T.fog);
const FOG_DAY = new THREE.Color(T.seafoam);
const SKY_DUSK = new THREE.Color(T.skyBounce);
const SKY_DAY = new THREE.Color(T.sage);
const SUN_DUSK = new THREE.Color(T.sunLight);
const SUN_DAY = new THREE.Color(T.gold);
const mlerp = THREE.MathUtils.lerp;

// Eases the scene lighting + fog toward bright daytime while surfing (back to dusk
// otherwise), and publishes the level to `daylight.v` so the water can brighten too.
function DaylightRig({ surfing }: { surfing: boolean }) {
  const reduced = usePrefersReducedMotion();
  const scene = useThree((s) => s.scene);
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const dir = useRef<THREE.DirectionalLight>(null);
  const day = useRef(0);
  useFrame((_, dt) => {
    const target = surfing ? 1 : 0;
    day.current += (target - day.current) * (reduced ? 1 : 1 - Math.exp(-2.5 * dt));
    const v = day.current;
    daylight.v = v;
    const fog = scene.fog as THREE.Fog | null;
    if (fog) fog.color.lerpColors(FOG_DUSK, FOG_DAY, v);
    if (amb.current) amb.current.intensity = mlerp(1.15, 1.75, v);
    if (hemi.current) {
      hemi.current.intensity = mlerp(1.5, 2.3, v);
      hemi.current.color.lerpColors(SKY_DUSK, SKY_DAY, v);
    }
    if (dir.current) {
      dir.current.intensity = mlerp(2.4, 3.3, v);
      dir.current.color.lerpColors(SUN_DUSK, SUN_DAY, v);
    }
  });
  return (
    <>
      <ambientLight ref={amb} intensity={1.15} />
      <hemisphereLight ref={hemi} args={[T.skyBounce, T.ground, 1.5]} />
      {/* Warm key light angled in from the sun's end of the rail (+X, low). */}
      <directionalLight ref={dir} position={[70, 14, -24]} intensity={2.4} color={T.sunLight} />
    </>
  );
}

// Stars belong to the dusk rail, not to the bright free-surf daytime. drei's
// starfield computes its alpha inside the shader (no opacity uniform to lerp), so
// rather than patch their material we just drop the field once the sky is
// meaningfully bright. The stars are additively blended against a brightening
// backdrop by then, so they have already washed out and the cut does not read.
function StarField() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = daylight.v < 0.5;
  });
  return (
    <group ref={g}>
      <Stars radius={120} depth={40} count={700} factor={3} saturation={0} fade speed={0.6} />
    </group>
  );
}

interface Props {
  activeIndex: number;
  entered: boolean;
  surfing: boolean;
  onOpen: (i: number) => void;
  onCoin?: (count: number) => void;
  onCheckpoint?: (cp: Checkpoint | null) => void;
  onComplete?: () => void;
  // "never" parks the render loop (hidden tab) so a backgrounded world does no
  // GPU/CPU work; "always" runs it while the world is active + visible.
  frameloop?: "always" | "never";
}

/**
 * The entire interactive world in ONE <Canvas> / one WebGLRenderer. Every cube
 * across every island lives in a single <Instances> (one draw call, per-instance
 * color) — no per-cube draw calls. Lazy-loaded so three.js only ships here.
 */
export default function World({ activeIndex, entered, surfing, onOpen, onCoin, onCheckpoint, onComplete, frameloop = "always" }: Props) {
  const cubes = useMemo(() => buildWorld(PUBLISHED_PROJECTS), []);
  const accent = PUBLISHED_PROJECTS[activeIndex]?.accent ?? T.blue;
  const [dpr, setDpr] = useState(1.5);
  // Surf is already the heaviest scene. Keep it crisp while it moves instead of
  // accepting the rail's adaptive low-resolution mode on every input frame.
  const canvasDpr = surfing ? 1.5 : dpr;

  return (
    <Canvas
      dpr={canvasDpr}
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
      <DaylightRig surfing={surfing} />

      {/* A few faint stars in the upper dusk sky. */}
      <StarField />
      {!surfing && <SunDisc />}
      <DistantMountains />

      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.5)}
      />
      <Instances limit={cubes.length} range={cubes.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial flatShading roughness={0.55} metalness={0.05} />
        {cubes.map((c, i) => (
          <Instance key={i} position={c.position} scale={c.scale} color={c.color} />
        ))}
      </Instances>

      <Water />
        <IslandShadows />
        {!surfing && <Ripples active={activeIndex} />}
        {!surfing && <LightShaft active={activeIndex} />}
      <IndieIsland />
      <Emblems active={activeIndex} onOpen={onOpen} />
      {/* The breaks only exist while surfing → the rail diorama stays clean. */}
      {surfing && <SurfSpots />}
      <SurfController active={surfing} onCoin={onCoin} onCheckpoint={onCheckpoint} onComplete={onComplete} />
      <CameraRig activeIndex={activeIndex} accent={accent} entered={entered} surfing={surfing} />
    </Canvas>
  );
}
