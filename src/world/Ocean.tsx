import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PUBLISHED_PROJECTS, INDIE_PROJECTS } from "../projects/projects";
import { islandPosition, INDIE_INDEX, WATER_Y } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";
import { T } from "../theme";
import { DISTANT_PEAKS } from "./distant-mountains";
import { daylight } from "./daylight";

const WATER_DUSK = new THREE.Color(T.water);
const WATER_DAY = new THREE.Color(T.dayWater);
const MOUNTAIN_GEO = new THREE.ConeGeometry(1, 1, 4);
const MOUNTAIN_MAT = new THREE.MeshStandardMaterial({ color: T.surface, flatShading: true });
const MOUNTAIN_MATRICES = DISTANT_PEAKS.map((peak) => new THREE.Matrix4().compose(
  new THREE.Vector3(peak.x, WATER_Y + peak.h / 2 - 2, peak.z),
  new THREE.Quaternion(),
  new THREE.Vector3(peak.w, peak.h, peak.w)
));

// The sea the islands float on, and the separate "what I'm building" island you
// surf to.

// The sea, now with real swell: a segmented plane displaced in the vertex shader
// (sum of sines, GPU-cheap, no textures) so the surface heaves and catches the
// sun instead of sitting dead flat. Normals are recomputed from the height
// gradient so the warm sun still glints off the moving faces. Frozen (static
// ripple, no motion) under reduced-motion.
// Segment density, not extent. The plane stays 1400 wide so the sea edge stays
// outside the surf fog and behind the horizon ring; only how finely it is
// tessellated changes. On the rail, fog far is 130 and the water is read at a
// distance, so 96x96 (9.4K vertices) carries the swell fine. Surf mode opens fog
// to 620 and puts the camera on the surface, where the extra detail shows, so it
// keeps 180x180 (32.7K). Every vertex runs the wave shader, so this is a direct
// cut in vertex work on the default path.
const SEA_SEGMENTS_RAIL = 96;
const SEA_SEGMENTS_SURF = 180;

export function Water({ surfing }: { surfing: boolean }) {
  const uTime = useRef({ value: 0 });
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const reduced = usePrefersReducedMotion();
  const segments = surfing ? SEA_SEGMENTS_SURF : SEA_SEGMENTS_RAIL;
  useFrame((s) => {
    if (!reduced) uTime.current.value = s.clock.elapsedTime;
    // Brighten toward turquoise as free-surf fades to daytime.
    if (matRef.current) matRef.current.color.lerpColors(WATER_DUSK, WATER_DAY, daylight.v);
  });

  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = uTime.current;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        float waveH(vec2 p){
          return sin(p.x*0.06 + uTime*0.8)*0.6
               + sin(p.y*0.09 - uTime*0.6)*0.4
               + sin((p.x+p.y)*0.05 + uTime*0.5)*0.3;
        }
        // Exact gradient of waveH. The normal used to come from four extra
        // waveH samples (central differences at eps = 1), so every vertex on a
        // 180x180 plane evaluated waveH five times: fifteen sines per vertex.
        // Differentiating by hand costs three cosines and is more accurate than
        // the finite difference it replaces, not less.
        vec2 waveGrad(vec2 p){
          float c3 = cos((p.x+p.y)*0.05 + uTime*0.5)*0.015; // 0.3 * 0.05
          return vec2(
            cos(p.x*0.06 + uTime*0.8)*0.036 + c3,           // 0.6 * 0.06
            cos(p.y*0.09 - uTime*0.6)*0.036 + c3            // 0.4 * 0.09
          );
        }`
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        vec2 g = waveGrad(position.xy);
        objectNormal = normalize(vec3(-g.x, -g.y, 1.0));`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        transformed.z += waveH(position.xy);`
      );
  };

  return (
    // Wide enough that the horizon ring (radius ~450 to 520) still has water
    // under it and the sea edge stays outside the surf fog. Segment count grows
    // with it so the swell keeps roughly its old wavelength rather than turning
    // into slow rolling hills.
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[60, WATER_Y, 0]} raycast={() => null}>
      {/* Keyed so switching density rebuilds the geometry rather than mutating
          args on the existing one, which r3f would not pick up. */}
      <planeGeometry
        key={surfing ? "surf" : "rail"}
        args={[1400, 1400, segments, segments]}
      />
      {/* Ocean-blue dusk sea, reflective enough to catch the sun. */}
      <meshStandardMaterial
        ref={matRef}
        color={T.water}
        roughness={0.12}
        metalness={0.5}
        transparent
        opacity={0.96}
        depthWrite={false}
        onBeforeCompile={onBeforeCompile}
      />
    </mesh>
  );
}

// Dark, faceted contact pools anchor the floating islands to the water without
// paying for a second shadow-map render pass.
export function IslandShadows() {
  return (
    <>
      {PUBLISHED_PROJECTS.map((project, index) => {
        const [x, , z] = islandPosition(index);
        return (
          <group key={project.id}>
            <mesh
              position={[x, WATER_Y + 0.04, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[1.35, 0.62, 1]}
              renderOrder={1}
              raycast={() => null}
            >
              <circleGeometry args={[5.2, 8]} />
              <meshBasicMaterial color="#1D1816" transparent opacity={0.42} depthWrite={false} />
            </mesh>
            <mesh
              position={[x, WATER_Y + 0.06, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[1.35, 0.62, 1]}
              renderOrder={2}
              raycast={() => null}
            >
              <ringGeometry args={[4.35, 5.25, 8]} />
              <meshBasicMaterial
                color={project.accent}
                transparent
                opacity={0.24}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

// A low, warm sun on the horizon at the TIMELINE'S END — placed past the last
// (newest) island in +X, so travelling forward through the work heads into the
// sun (the closer you get to now, the closer to the sun — an Icarus read). Pure
// emissive disc + soft glow; fog is disabled on it so it stays vivid at the edge.
export function SunDisc() {
  const endX = islandPosition(INDIE_INDEX)[0] + 90; // beyond the indie island
  return (
    <group position={[endX, 12, -55]}>
      <mesh raycast={() => null}>
        <circleGeometry args={[22, 48]} />
        <meshBasicMaterial color={T.amber} fog={false} />
      </mesh>
      <mesh position={[0, 0, -1]} raycast={() => null}>
        <circleGeometry args={[42, 48]} />
        <meshBasicMaterial color={T.coral} transparent opacity={0.3} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
    </group>
  );
}

// A ring of faint low-poly peaks near the fog's edge, so the horizon reads as
// distant misty mountains rather than a bare cutoff line. Colored just under the
// fog haze so they dissolve into it. Static (cheap; reduced-motion friendly).
export function DistantMountains() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    MOUNTAIN_MATRICES.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  return (
    <instancedMesh
      ref={ref}
      args={[MOUNTAIN_GEO, MOUNTAIN_MAT, DISTANT_PEAKS.length]}
      raycast={() => null}
    />
  );
}

// When you travel to an island, a ring of light ripples out across the water
// beneath it. A tiny reused pool (3 meshes) — no per-frame allocation.
const RIPPLE_DUR = 1.4;

export function Ripples({ active }: { active: number }) {
  const reduced = usePrefersReducedMotion();
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const slots = useRef(Array.from({ length: 3 }, () => ({ born: -99, x: 0, z: 0 })));
  const cursor = useRef(0);
  // Past the last employment island the rail reaches the indie island, which is
  // not in PUBLISHED_PROJECTS: without this the shaft fell back to a default and
  // the one island with no monuments also lost its colour.
  const accent = PUBLISHED_PROJECTS[active]?.accent ?? INDIE_PROJECTS[0]?.accent ?? T.mauve;

  useEffect(() => {
    if (reduced) return;
    const [x, , z] = islandPosition(active);
    const s = slots.current[cursor.current % slots.current.length];
    s.born = performance.now() / 1000;
    s.x = x;
    s.z = z;
    cursor.current++;
  }, [active, reduced]);

  useFrame(() => {
    const now = performance.now() / 1000;
    for (let i = 0; i < slots.current.length; i++) {
      const m = meshes.current[i];
      const s = slots.current[i];
      if (!m) continue;
      const age = now - s.born;
      if (age < 0 || age > RIPPLE_DUR) {
        m.visible = false;
        continue;
      }
      const p = age / RIPPLE_DUR;
      m.visible = true;
      m.position.set(s.x, WATER_Y + 0.06, s.z);
      const scale = 1 + p * 7;
      m.scale.set(scale, scale, scale);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.5;
    }
  });

  return (
    <>
      {slots.current.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          raycast={() => null}
        >
          <ringGeometry args={[1.4, 1.7, 56]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

// A soft accent-colored light shaft that follows the active island — a subtle
// "god-ray" without any postprocessing (one low-poly additive cone).
export function LightShaft({ active }: { active: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = usePrefersReducedMotion();
  const accent = PUBLISHED_PROJECTS[active]?.accent ?? T.mauve;
  const target = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    if (!ref.current) return;
    const [x, , z] = islandPosition(active);
    target.current.set(x, 16, z);
    ref.current.position.lerp(target.current, 1 - Math.exp(-2 * dt));
    if (!reduced) ref.current.rotation.y += dt * 0.15;
  });

  return (
    <mesh ref={ref} position={[0, 16, 0]} raycast={() => null}>
      <coneGeometry args={[6, 22, 6, 1, true]} />
      <meshBasicMaterial
        color={accent}
        transparent
        opacity={0.055}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

