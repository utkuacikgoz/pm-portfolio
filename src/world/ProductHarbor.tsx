import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { T } from "../theme";

type Stage = "harbor" | "before" | "after";
interface Props { stage: Stage; avatar: string; paused: boolean }
const CLEAR: [number, number, number][] = [[-7, 0.5, 1], [-3, 0.5, 1], [0, 0.5, 1], [3, 0.5, -2], [7, 0.5, -2]];
const REVIEW: [number, number, number][] = [[-7, 0.5, 1], [-3, 0.5, 1], [0, 0.5, 1], [2, 0.5, 4], [6, 0.5, 4]];

function Stone({ position, scale, color = T.surface }: { position: [number, number, number]; scale: [number, number, number]; color?: string }) {
  return <mesh position={position} scale={scale} castShadow receiveShadow><boxGeometry /><meshStandardMaterial color={color} roughness={0.65} metalness={0.12} /></mesh>;
}

function Tower({ x, z, human = false }: { x: number; z: number; human?: boolean }) {
  return <group position={[x, 0, z]}>
    <Html position={[0, human ? 3.8 : 5.25, 0]} center style={{ pointerEvents: "none", whiteSpace: "nowrap" }}><div className="harbor-label">{human ? "HUMAN REVIEW" : "CLEAR CASES"}</div></Html>
    <Stone position={[0, -0.1, 0]} scale={[3.8, 0.3, 3.2]} color={T.inkRaised} />
    {[0, 1, 2].map(i => <Stone key={i} position={[0, 0.2 + i * 0.25, 0]} scale={[2.8 - i * 0.3, 0.25, 2.2 - i * 0.2]} color={T.border} />)}
    {human ? <>
      <Stone position={[-0.85, 1.8, 0]} scale={[0.2, 2.7, 0.2]} color={T.gold} />
      <Stone position={[0.85, 1.8, 0]} scale={[0.2, 2.7, 0.2]} color={T.gold} />
      <Stone position={[0, 3.2, 0]} scale={[2.5, 0.25, 1.5]} color={T.gold} />
      <Stone position={[0, 1.1, 0.2]} scale={[1.7, 0.2, 0.8]} color={T.amber} />
      <Figure color={T.coral} position={[0, 0.7, -0.5]} />
    </> : <>
      <Stone position={[0, 2.2, 0]} scale={[1.8, 3.1, 1.5]} color={T.blue} />
      {[0, 1, 2, 3, 4].map(i => <Stone key={i} position={[0, 1.15 + i * 0.53, 0.78]} scale={[1.35, 0.08, 0.08]} color={T.seafoam} />)}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.25}><mesh position={[0, 4.3, 0]}><octahedronGeometry args={[0.62]} /><meshStandardMaterial color={T.seafoam} emissive={T.seafoam} emissiveIntensity={0.6} /></mesh></Float>
    </>}
  </group>;
}

function Figure({ color, position }: { color: string; position: [number, number, number] }) {
  return <group position={position}>
    <Stone position={[-0.15, 0.3, 0]} scale={[0.2, 0.6, 0.25]} color={T.ink} />
    <Stone position={[0.15, 0.3, 0]} scale={[0.2, 0.6, 0.25]} color={T.ink} />
    <Stone position={[0, 0.83, 0]} scale={[0.62, 0.6, 0.35]} color={color} />
    <mesh position={[0, 1.35, 0]} castShadow><icosahedronGeometry args={[0.28, 1]} /><meshStandardMaterial color={T.textSoft} flatShading /></mesh>
  </group>;
}

function Camera({ stage }: { stage: Stage }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const target = useMemo(() => new THREE.Vector3(), []);
  const eye = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const mobile = size.width < 760;
    const harbor = stage === "harbor";
    // Leftward aim reserves a calm column for the DOM story on desktop.
    target.set(mobile ? 0 : -5.8, mobile ? 0.4 : 0.3, 0.4);
    eye.set(harbor ? 19 : 15, harbor ? 15 : 13, mobile ? 31 : harbor ? 24 : 21);
    camera.position.lerp(eye, 1 - Math.exp(-1.8 * Math.min(delta, 0.05)));
    look.current.lerp(target, 1 - Math.exp(-2 * Math.min(delta, 0.05)));
    camera.lookAt(look.current);
  });
  return null;
}

function Traffic({ separated }: { separated: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const object = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const blend = useRef(0);
  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    blend.current = THREE.MathUtils.damp(blend.current, separated ? 1 : 0, 2.4, Math.min(delta, 0.05));
    for (let i = 0; i < 28; i++) {
      const human = i % 4 === 0;
      const phase = (clock.elapsedTime * 0.09 + i / 28) % 1;
      const path = human ? REVIEW : CLEAR;
      const n = phase * (path.length - 1);
      const step = Math.min(path.length - 2, Math.floor(n));
      const local = n - step;
      const flowingX = THREE.MathUtils.lerp(path[step][0], path[step + 1][0], local);
      const flowingZ = THREE.MathUtils.lerp(path[step][2], path[step + 1][2], local);
      const queuedX = -6 + (i % 7) * 0.48;
      const queuedZ = -0.15 + Math.floor(i / 7) * 0.55;
      object.position.set(THREE.MathUtils.lerp(queuedX, flowingX, blend.current), 0.75 + Math.sin(clock.elapsedTime * 1.5 + i) * 0.06, THREE.MathUtils.lerp(queuedZ, flowingZ, blend.current));
      object.rotation.set(0, clock.elapsedTime * 0.25, 0);
      object.scale.setScalar(0.23);
      object.updateMatrix();
      ref.current.setMatrixAt(i, object.matrix);
      color.set(human ? T.amber : separated ? T.seafoam : T.coral);
      ref.current.setColorAt(i, color);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, 28]}><boxGeometry /><meshStandardMaterial roughness={0.3} metalness={0.4} /></instancedMesh>;
}

function Sea() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, deep: { value: new THREE.Color(T.forest) }, light: { value: new THREE.Color(T.ocean) } },
    vertexShader: `varying vec3 world; uniform float time; void main(){ vec3 p=position; p.z+=sin(p.x*.35+time*.5)*.13+cos(p.y*.28+time*.4)*.12; world=p; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
    fragmentShader: `varying vec3 world; uniform float time; uniform vec3 deep; uniform vec3 light; void main(){ float a=sin(world.x*1.7+world.y*.8+time*.5); float b=sin(world.y*2.3-world.x*.7+time*.3); float sparkle=pow(max(0.,a*b),18.)*.06; vec3 c=mix(deep,light,.42+sin(world.x*.09+world.y*.08)*.1)+sparkle; gl_FragColor=vec4(c,1.); }`,
  }), []);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_, delta) => { material.uniforms.time.value += Math.min(delta, 0.05); });
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.65, 0]}><planeGeometry args={[220, 220, 100, 100]} /><primitive object={material} attach="material" /></mesh>;
}

export default function ProductHarbor({ stage, avatar, paused }: Props) {
  return <Canvas shadows dpr={[1, 1.5]} frameloop={paused ? "never" : "always"} camera={{ position: [30, 23, 34], fov: 42 }} gl={{ antialias: true, alpha: true }}>
    <fog attach="fog" args={[T.fog, 55, 135]} />
    <ambientLight intensity={1.4} />
    <hemisphereLight args={[T.skyBlue, T.ink, 2]} />
    <directionalLight castShadow position={[8, 20, 6]} intensity={3.5} color={T.sunLight} shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-normalBias={0.04} />
    <directionalLight position={[-10, 10, -8]} intensity={2} color={T.seafoam} />
    <Sea />
    {/* Faceted coast, stepped decks and two distinct destinations make the route readable. */}
    <mesh position={[0, -1.65, 0]} scale={[12, 2.4, 7]} receiveShadow><cylinderGeometry args={[1, 0.76, 1, 9]} /><meshStandardMaterial color={T.border} flatShading /></mesh>
    <mesh position={[0, -0.3, 0]} scale={[11.5, 0.5, 6.6]} receiveShadow><cylinderGeometry args={[1, 1, 1, 9]} /><meshStandardMaterial color={T.inkRaised} flatShading /></mesh>
    <Stone position={[0, -0.13, 1]} scale={[16, 0.22, 1.3]} color={T.surface} />
    <Stone position={[3.5, -0.1, 0.1]} scale={[1.5, 0.25, 7.5]} color={T.surface} />
    <Tower x={6} z={-2} />
    <Tower x={6} z={4} human />
    <Stone position={[-1, 1.45, 1]} scale={[0.28, 3, 0.28]} color={T.blue} />
    <Stone position={[1, 1.45, 1]} scale={[0.28, 3, 0.28]} color={T.blue} />
    <Stone position={[0, 3, 1]} scale={[2.7, 0.3, 0.4]} color={T.seafoam} />
    <Line points={CLEAR} color={stage === "after" ? T.seafoam : T.border} lineWidth={2} />
    <Line points={REVIEW} color={T.amber} lineWidth={2} />
    <Traffic separated={stage === "after"} />
    <Stone position={[-7, -0.1, 5]} scale={[4, 0.25, 3]} color={T.surface} />
    <Figure position={[-7, 0.1, 5]} color={avatar === "hr" ? T.seafoam : avatar === "manager" ? T.gold : T.blue} />
    {[-8, -4, 0, 4, 8].map(x => <group key={x} position={[x, 0, -4]}><Stone position={[0, 0.4, 0]} scale={[0.15, 1.3, 0.15]} color={T.gold} /><mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.15, 8, 6]} /><meshStandardMaterial color={T.gold} emissive={T.gold} emissiveIntensity={2} /></mesh></group>)}
    {[-1, 1].map((side) => <mesh key={side} position={[side * 26, -0.6, -28]} scale={[10, 5, 8]}><coneGeometry args={[1, 1, 5]} /><meshStandardMaterial color={T.forest} flatShading /></mesh>)}
    <Camera stage={stage} />
  </Canvas>;
}
