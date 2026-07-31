import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INDIE_PROJECTS, PUBLISHED_PROJECTS } from "../projects/projects";
import { islandPosition, INDIE_INDEX, WATER_Y } from "./geometry";
import { usePrefersReducedMotion } from "../ui/hooks/useReducedMotion";
import { T } from "../theme";
import { DISTANT_PEAKS } from "./distant-mountains";
import { daylight } from "./daylight";

const WATER_DUSK = new THREE.Color(T.water);
const WATER_DAY = new THREE.Color(T.dayWater);
const MOUNTAIN_GEO = new THREE.ConeGeometry(1, 1, 4);
const MOUNTAIN_MAT = new THREE.MeshStandardMaterial({ color: "#3a3550", flatShading: true });
const MOUNTAIN_MATRICES = DISTANT_PEAKS.map((peak) => new THREE.Matrix4().compose(
  new THREE.Vector3(peak.x, WATER_Y + peak.h / 2 - 2, peak.z),
  new THREE.Quaternion(),
  new THREE.Vector3(peak.w, peak.h, peak.w)
));

// The sea the islands float on, and the separate "what I'm building" island you
// surf to — indie products as gently bobbing, NON-clickable coming-soon bubbles.

// The sea, now with real swell: a segmented plane displaced in the vertex shader
// (sum of sines, GPU-cheap, no textures) so the surface heaves and catches the
// sun instead of sitting dead flat. Normals are recomputed from the height
// gradient so the warm sun still glints off the moving faces. Frozen (static
// ripple, no motion) under reduced-motion.
export function Water() {
  const uTime = useRef({ value: 0 });
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const reduced = usePrefersReducedMotion();
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
        }`
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        float eps = 1.0;
        float hx = waveH(position.xy + vec2(eps,0.0)) - waveH(position.xy - vec2(eps,0.0));
        float hy = waveH(position.xy + vec2(0.0,eps)) - waveH(position.xy - vec2(0.0,eps));
        objectNormal = normalize(vec3(-hx, -hy, 2.0*eps));`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        transformed.z += waveH(position.xy);`
      );
  };

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[60, WATER_Y, 0]} raycast={() => null}>
      <planeGeometry args={[600, 320, 120, 80]} />
      {/* Periwinkle-dusk sea (logo palette), reflective enough to catch the sun. */}
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
              <meshBasicMaterial color="#03050c" transparent opacity={0.42} depthWrite={false} />
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
        <meshBasicMaterial color="#F0A06A" fog={false} />
      </mesh>
      <mesh position={[0, 0, -1]} raycast={() => null}>
        <circleGeometry args={[42, 48]} />
        <meshBasicMaterial color="#E7684A" transparent opacity={0.3} blending={THREE.AdditiveBlending} fog={false} />
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

function Bubble({ index, color, count }: { index: number; color: string; count: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const x = (index - (count - 1) / 2) * 2.6;
  useFrame((s) => {
    if (ref.current) ref.current.position.y = 3.2 + Math.sin(s.clock.elapsedTime * 1.2 + index) * 0.35;
  });
  return (
    // raycast disabled → bubbles are visual only, not clickable.
    <mesh ref={ref} position={[x, 3.2, 0]} raycast={() => null}>
      <sphereGeometry args={[1.15, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.45}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
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
  const accent = PUBLISHED_PROJECTS[active]?.accent ?? "#CB7BC7";

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
  const accent = PUBLISHED_PROJECTS[active]?.accent ?? "#CB7BC7";
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

export function IndieIsland() {
  const [ix, , iz] = islandPosition(INDIE_INDEX);
  return (
    <group position={[ix, 0, iz]}>
      <mesh position={[0, -0.5, 0]} raycast={() => null}>
        <boxGeometry args={[7, 1, 7]} />
        <meshStandardMaterial color="#13243a" flatShading />
      </mesh>
      <mesh position={[0, -1.5, 0]} raycast={() => null}>
        <boxGeometry args={[4.5, 1, 4.5]} />
        <meshStandardMaterial color="#0e1b2c" flatShading />
      </mesh>
      {INDIE_PROJECTS.map((p, i) => (
        <Bubble key={p.id} index={i} color={p.accent} count={INDIE_PROJECTS.length} />
      ))}
    </group>
  );
}
