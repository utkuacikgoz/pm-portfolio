import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { T, TYPE } from "../theme";

type Point = [number, number, number];
interface Props { kind: "mestores" | "upshift"; active: boolean; onOpen: () => void }
// Illustrative routes only: packet counts and timing do not encode measured data.
const SHOP: Point[] = [[-6, .6, 0], [-3, .6, 0], [0, .6, 1], [3, .6, 1], [6, .6, 1]];
const RETURN: Point[] = [[6, .6, 1], [6, .6, 4], [-6, .6, 4], [-6, .6, 0]];
const MATCH: Point[][] = [
  [[-6, .65, -2], [-3, .65, -2], [0, .65, 0], [3, .65, -2], [6, .65, -2]],
  [[-6, .65, 2], [-3, .65, 2], [0, .65, 0], [3, .65, 2], [6, .65, 2]],
];

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

function Shop({ active }: { active: boolean }) {
  return <>
    {/* A familiar storefront, two checkout steps, and a dispatch van. */}
    <Block p={[-6, .3, -1]} s={[4, .6, 3]} />
    <Block p={[-6, 1.8, -2]} s={[3.5, 2.6, .4]} color={T.brick} />
    <Block p={[-7.6, 1.5, -.5]} s={[.18, 2.4, .18]} color={T.gold} />
    <Block p={[-4.4, 1.5, -.5]} s={[.18, 2.4, .18]} color={T.gold} />
    {Array.from({ length: 6 }, (_, i) => <Block key={i} p={[-7.5 + i * .6, 2.85, -1.1]} s={[.6, .2, 2.2]} color={i % 2 ? T.textSoft : T.gold} />)}
    <Block p={[-6, 1, -.5]} s={[3.1, .6, .65]} color={T.gold} />
    {[-7, -6, -5].map((x, i) => <Block key={x} p={[x, 1.5, -.6]} s={[.5, .4 + i * .15, .45]} color={[T.coral, T.mauve, T.seafoam][i]} />)}
    <Person p={[-6, .6, -1.3]} color={T.seafoam} />
    {active && <Label p={[-6, 3.65, -1]}>DISCOVER</Label>}
    {[-1.2, 1.2].map((x, i) => <group key={x} position={[x, 0, 1]}>
      <Block p={[0, .15, 0]} s={[1.5, .3, 2]} color={T.border} />
      <Block p={[0, 1.15, -.8]} s={[.22, 2, .22]} color={T.gold} />
      <Block p={[0, 1.15, .8]} s={[.22, 2, .22]} color={T.gold} />
      <Block p={[0, 2.2, 0]} s={[.3, .22, 2]} color={i ? T.seafoam : T.gold} />
    </group>)}
    {active && <Label p={[0, 3, 1]}>TWO STEP CHECKOUT</Label>}
    <group position={[6, .35, 0]}>
      <Block p={[0, .6, 0]} s={[3.3, .3, 1.6]} color={T.ink} />
      <Block p={[-.5, 1.35, 0]} s={[2, 1.4, 1.65]} color={T.gold} />
      <Block p={[1, 1.15, 0]} s={[1, 1.1, 1.6]} color={T.textSoft} />
      <Block p={[1.1, 1.45, .82]} s={[.6, .45, .04]} color={T.skyBlue} />
      {[-1, 1].flatMap(x => [-.85, .85].map(z => <mesh key={`${x}:${z}`} position={[x, .5, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.4, .4, .22, 12]} /><meshStandardMaterial color={T.ink} /></mesh>))}
    </group>
    {active && <Label p={[6, 3.25, 0]}>FULFILLMENT</Label>}
    <Line points={SHOP} color={T.gold} lineWidth={2} />
    <Line points={RETURN} color={T.seafoam} lineWidth={1.5} dashed dashSize={.3} gapSize={.2} />
    {active && <Parcels paths={[SHOP]} active={active} color={T.gold} />}
  </>;
}

function ShiftNetwork({ active }: { active: boolean }) {
  return <>
    <Block p={[-6, .15, 0]} s={[4, .3, 6]} />
    {[-2, 0, 2].map((z, i) => <Person key={z} p={[-6, .3, z]} color={[T.seafoam, T.mauve, T.blue][i]} />)}
    {active && <Label p={[-7, 2.8, 3]}>WORKERS</Label>}
    <Block p={[0, .2, 0]} s={[3.1, .4, 3.4]} color={T.border} />
    <Block p={[0, 2, -.55]} s={[2.7, 3.3, .45]} color={T.seafoam} />
    <Block p={[0, 2, -.3]} s={[2.35, 2.55, .08]} color={T.inkRaised} />
    {[-.7, 0, .7].flatMap((x, col) => [1.2, 1.95, 2.7].map((y, row) => <Block key={`${x}:${y}`} p={[x, y, -.22]} s={[.44, .44, .12]} color={(col + row) % 3 === 0 ? T.gold : T.seafoam} />))}
    {active && <Label p={[0, 4.35, -.5]}>SHIFT RECOMMENDATIONS</Label>}
    {[-2, 2].map((z, i) => <group key={z} position={[6, 0, z]}>
      <Block p={[0, .2, 0]} s={[3.5, .4, 2.5]} />
      <Block p={[0, 1.65, -.3]} s={[2.5, 2.6, 1.7]} color={i ? T.blue : T.seafoam} />
      <Block p={[0, 3, -.3]} s={[2.9, .2, 2]} color={T.textSoft} />
      <Block p={[0, 1, .6]} s={[.7, 1.25, .06]} color={T.ink} />
      {[-.8, .8].map(x => <Block key={x} p={[x, 2.1, .6]} s={[.4, .5, .07]} color={T.gold} />)}
    </group>)}
    {active && <Label p={[6, 4, 0]}>BUSINESSES</Label>}
    {MATCH.map((path, i) => <Line key={i} points={path} color={i ? T.gold : T.seafoam} lineWidth={2} />)}
    {active && <Parcels paths={MATCH} active={active} color={T.seafoam} />}
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
