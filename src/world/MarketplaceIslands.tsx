import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { T, TYPE } from "../theme";

type Point = [number, number, number];
interface Props { kind: "mestores" | "upshift"; active: boolean; onOpen: () => void }
// Illustrative routes only: packet counts and timing do not encode measured data.
const SHOP: Point[] = [[-7, .6, -1], [-3, .6, -1], [-1, .6, 1], [3, .6, 1], [7, .6, 1]];
const RETURN: Point[] = [[-3, .6, -1], [-3, .6, 3.5], [0, .6, 3.5], [3, .6, 1]];
const MATCH: Point[][] = [-2.6, 0, 2.6].map(z => [[-6, .65, z], [-3, .65, z], [0, .65, 0], [3, .65, 0], [6, .65, 0]]);
const RETAIN: Point[] = [[6, .65, 0], [7, .65, 3.6], [2, .65, 3.6], [0, .65, 0]];

function Block({ p, s, color = T.surface }: { p: Point; s: Point; color?: string }) {
  return <mesh position={p} scale={s}><boxGeometry /><meshStandardMaterial color={color} roughness={.65} metalness={.12} /></mesh>;
}

function Label({ p, children }: { p: Point; children: string }) {
  return <Html position={p} center zIndexRange={[30, 0]} style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
    <span style={{ display: "block", padding: "6px 9px", background: T.scrim, border: `1px solid ${T.border}`, borderRadius: 3, color: T.textSoft, fontSize: TYPE.micro, letterSpacing: 1 }}>{children}</span>
  </Html>;
}

function Person({ p, color }: { p: Point; color: string }) {
  return <group position={p}>
    <Block p={[-.14, .25, 0]} s={[.2, .5, .25]} color={T.ink} />
    <Block p={[.14, .25, 0]} s={[.2, .5, .25]} color={T.ink} />
    <Block p={[0, .7, 0]} s={[.58, .5, .34]} color={color} />
    <mesh position={[0, 1.12, 0]}><icosahedronGeometry args={[.26, 1]} /><meshStandardMaterial color={T.textSoft} flatShading /></mesh>
  </group>;
}

function Parcels({ paths, active, color }: { paths: Point[][]; active: boolean; color: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    if (active) elapsed.current += Math.min(delta, .05);
    for (let i = 0; i < 12; i++) {
      const path = paths[i % paths.length];
      const phase = ((elapsed.current * .1 + i / 12) % 1) * (path.length - 1);
      const step = Math.min(path.length - 2, Math.floor(phase));
      const f = phase - step;
      dummy.position.set(
        THREE.MathUtils.lerp(path[step][0], path[step + 1][0], f),
        path[step][1],
        THREE.MathUtils.lerp(path[step][2], path[step + 1][2], f),
      );
      dummy.scale.setScalar(.24);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, 12]}><boxGeometry /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.2} /></instancedMesh>;
}

function Screen({ p, color, children }: { p: Point; color: string; children: React.ReactNode }) {
  return <group position={p}>
    <Block p={[0, .45, 0]} s={[1.7, .2, .9]} />
    <Block p={[0, 1, 0]} s={[.25, 1, .25]} color={color} />
    <Block p={[0, 2.2, 0]} s={[3, 2.4, .3]} color={color} />
    <Block p={[0, 2.2, .18]} s={[2.7, 2.1, .08]} color={T.inkRaised} />
    {children}
  </group>;
}

function Cart({ p, color }: { p: Point; color: string }) {
  return <group position={p}>
    <Block p={[0, .65, 0]} s={[1.1, .2, .8]} color={color} />
    <Block p={[0, 1, -.4]} s={[1.1, .7, .1]} color={color} />
    <Block p={[0, 1, .4]} s={[1.1, .7, .1]} color={color} />
    <Block p={[-.55, 1, 0]} s={[.1, .7, .8]} color={color} />
    <Block p={[.6, 1.2, 0]} s={[.12, 1, .12]} color={T.textSoft} />
    <Block p={[0, .9, 0]} s={[.55, .4, .5]} color={T.gold} />
    {[-.35, .35].map(x => <mesh key={x} position={[x, .35, .35]}><sphereGeometry args={[.19, 8, 6]} /><meshStandardMaterial color={T.ink} /></mesh>)}
  </group>;
}

function Shop({ active }: { active: boolean }) {
  return <>
    {/* Funnel visibility first; recovered carts rejoin the shortened checkout. */}
    <Screen p={[-6, 0, -1.5]} color={T.gold}>
      {[1.9, 1.4, .8].map((width, i) => <Block key={width} p={[0, 2.85 - i * .62, .27]} s={[width, .35, .12]} color={i === 2 ? T.coral : T.gold} />)}
    </Screen>
    {active && <Label p={[-6, 4, -1.5]}>FUNNEL TRACKING</Label>}
    <Cart p={[-2.7, 0, 1]} color={T.coral} />
    <Cart p={[-1.8, 0, 2.8]} color={T.coral} />
    <group position={[.1, 1.3, 3.5]}>
      <Block p={[0, 0, 0]} s={[1.6, 1.05, .15]} color={T.seafoam} />
      <Line points={[[-.75, .46, .1], [0, -.05, .1], [.75, .46, .1]]} color={T.ink} lineWidth={2} />
    </group>
    {active && <Label p={[-.5, 2.8, 4]}>CART RECOVERY</Label>}
    {[3.5, 6].map((x, i) => <group key={x} position={[x, 0, 1]}>
      <Block p={[0, .15, 0]} s={[1.5, .3, 2]} color={T.border} />
      <Block p={[0, 1.15, -.8]} s={[.22, 2, .22]} color={T.gold} />
      <Block p={[0, 1.15, .8]} s={[.22, 2, .22]} color={T.gold} />
      <Block p={[0, 2.2, 0]} s={[.3, .22, 2]} color={i ? T.seafoam : T.gold} />
    </group>)}
    {active && <Label p={[5, 3.2, .5]}>CHECKOUT: 5 STEPS TO 2</Label>}
    <Line points={SHOP} color={T.gold} lineWidth={2} />
    <Line points={RETURN} color={T.seafoam} lineWidth={2} />
    {active && <><Parcels paths={[SHOP]} active={active} color={T.gold} /><Parcels paths={[RETURN]} active={active} color={T.seafoam} /></>}
  </>;
}

function ShiftNetwork({ active }: { active: boolean }) {
  return <>
    {/* Three competing inputs feed one product process, then retention work. */}
    {[-2.6, 0, 2.6].map((z, i) => <group key={z} position={[-6, 0, z]}>
      <Block p={[0, .1, 0]} s={[2.6, .2, 2]} />
      <Block p={[.4, .95, 0]} s={[1.3, .15, 1.2]} color={[T.blue, T.gold, T.mauve][i]} />
      <Person p={[-.5, .2, -.1]} color={[T.blue, T.gold, T.mauve][i]} />
    </group>)}
    {active && <Label p={[-7, 2.7, 3.8]}>SALES · OPS · ENGINEERING</Label>}
    <mesh position={[0, 1, 0]}><cylinderGeometry args={[1.5, 1.5, .25, 12]} /><meshStandardMaterial color={T.seafoam} /></mesh>
    <Block p={[0, .45, 0]} s={[.6, .9, .6]} color={T.border} />
    {[0, 1, 2, 3, 4].map(i => <group key={i} position={[Math.cos(i * Math.PI * 2 / 5) * 2, .15, Math.sin(i * Math.PI * 2 / 5) * 2]} rotation={[0, -i * Math.PI * 2 / 5, 0]}><Person p={[0, 0, 0]} color={i % 2 ? T.seafoam : T.blue} /></group>)}
    <Block p={[0, 1.3, 0]} s={[.7, .3, .6]} color={T.gold} />
    {active && <Label p={[0, 3.2, -.5]}>PRODUCT & DESIGN TEAM</Label>}
    <Screen p={[6, 0, -1]} color={T.seafoam}>
      {[0, 1, 2].map(i => <group key={i}>
        <Block p={[-.85, 2.85 - i * .6, .27]} s={[.25, .25, .12]} color={T.gold} />
        <Block p={[.25, 2.85 - i * .6, .27]} s={[1.5, .16, .12]} color={T.seafoam} />
      </group>)}
    </Screen>
    {active && <Label p={[6, 4, -1]}>RETENTION PRIORITIES</Label>}
    {MATCH.map((path, i) => <Line key={i} points={path} color={[T.blue, T.gold, T.mauve][i]} lineWidth={2} />)}
    <Line points={RETAIN} color={T.seafoam} lineWidth={2} />
    {active && <><Parcels paths={MATCH} active={active} color={T.gold} /><Parcels paths={[RETAIN]} active={active} color={T.seafoam} /></>}
  </>;
}

export default function MarketplaceIslands({ kind, active, onOpen }: Props) {
  return <group scale={.72} onClick={event => { event.stopPropagation(); onOpen(); }}>
    <mesh position={[0, -1.65, 0]} scale={[12, 2.4, 7]}><cylinderGeometry args={[1, .76, 1, 9]} /><meshStandardMaterial color={T.border} flatShading /></mesh>
    <mesh position={[0, -.3, 0]} scale={[11.5, .5, 6.6]}><cylinderGeometry args={[1, 1, 1, 9]} /><meshStandardMaterial color={T.inkRaised} flatShading /></mesh>
    <Block p={[0, .08, 0]} s={[15, .16, 1.25]} />
    {kind === "mestores" ? <Shop active={active} /> : <ShiftNetwork active={active} />}
  </group>;
}
