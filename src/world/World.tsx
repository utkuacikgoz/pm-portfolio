import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Instances, Instance, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";
import { daylight } from "./daylight";
import { PUBLISHED_PROJECTS } from "../projects/projects";
import { buildWorld } from "./geometry";
import CameraRig from "./CameraRig";
import Emblems from "./Emblems";
import SurfController from "./SurfController";
import SurfSpots from "./SurfSpots";
import type { SurfSpot } from "./surf-spots";
import type { Checkpoint } from "./surf-journey";
import { Water, IndieIsland, Ripples, LightShaft, SunDisc, DistantMountains } from "./Ocean";
import { T } from "../theme";

// Horizon color the fog fades islands into — the logo-derived dusk haze, matching
// the CSS sky gradient behind the (transparent) canvas so the world melts into it.
const HORIZON = T.fog;

// Rail <-> open-ocean cross-fade colors. The rail is a pale, papery, high-key
// gallery; leaving it for free-surf turns the light up and the sky bluer, so the
// ocean feels like stepping outdoors. (This used to run dusk -> daytime, back
// when the career world was dark.)
const FOG_RAIL = new THREE.Color(T.fog);
const FOG_SURF = new THREE.Color("#CDE9F0");
const SKY_RAIL = new THREE.Color(T.skyBounce);
const SKY_SURF = new THREE.Color("#DFF0FF");
const SUN_RAIL = new THREE.Color(T.sunLight);
const SUN_SURF = new THREE.Color("#FFF6E8");
const mlerp = THREE.MathUtils.lerp;

// Eases the scene lighting + fog toward the open-ocean look while surfing (back
// to the rail otherwise), and publishes the level to `daylight.v` so the water
// can shift with it.
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
    if (fog) fog.color.lerpColors(FOG_RAIL, FOG_SURF, v);
    // A pastel world needs a much higher light floor than the old dark one, or
    // the stone goes muddy and the whole palette loses its high-key character.
    if (amb.current) amb.current.intensity = mlerp(2.3, 2.7, v);
    if (hemi.current) {
      hemi.current.intensity = mlerp(2.6, 3.0, v);
      hemi.current.color.lerpColors(SKY_RAIL, SKY_SURF, v);
    }
    if (dir.current) {
      dir.current.intensity = mlerp(1.5, 2.0, v);
      dir.current.color.lerpColors(SUN_RAIL, SUN_SURF, v);
    }
  });
  return (
    <>
      <ambientLight ref={amb} intensity={2.3} />
      <hemisphereLight ref={hemi} args={[T.skyBounce, T.ground, 2.6]} />
      {/* Soft key from high and to one side. A pastel world wants gentle, even
          light and shallow shadows, not the hard low sun the dusk world used. */}
      <directionalLight ref={dir} position={[52, 46, 30]} intensity={1.5} color={T.sunLight} />
    </>
  );
}

interface Props {
  activeIndex: number;
  entered: boolean;
  surfing: boolean;
  onOpen: (i: number) => void;
  onNearSpot?: (spot: SurfSpot | null) => void;
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
export default function World({ activeIndex, entered, surfing, onOpen, onNearSpot, onCoin, onCheckpoint, onComplete, frameloop = "always" }: Props) {
  const cubes = useMemo(() => buildWorld(PUBLISHED_PROJECTS), []);
  const accent = PUBLISHED_PROJECTS[activeIndex]?.accent ?? "#4F57B0";
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
      <DaylightRig surfing={surfing} />

      <SunDisc />
      <DistantMountains />

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
      <SurfController active={surfing} onNearSpot={onNearSpot} onCoin={onCoin} onCheckpoint={onCheckpoint} onComplete={onComplete} />
      <CameraRig activeIndex={activeIndex} accent={accent} entered={entered} surfing={surfing} />
    </Canvas>
  );
}
