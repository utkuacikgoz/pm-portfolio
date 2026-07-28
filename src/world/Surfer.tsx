// A low-poly voxel surfer (board + rider in a surf stance), shared by the
// free-surf board (SurfController) and the water-gap easter-egg board
// (CameraRig) so both get the same figure. Pure geometry — the parent handles
// position / bob / lean. All meshes opt out of raycast; hit-testing (the egg
// click) lives on the parent group.
const SKIN = "#f0c19c";
const HAIR = "#3a2a1a";
const WETSUIT = "#0e7c74";
const DECK = "#ffce54";
const FIN = "#e0552b";

export default function Surfer({ accent = "#FF0080" }: { accent?: string }) {
  return (
    <group>
      {/* ── Board ── */}
      <mesh raycast={() => null}>
        <boxGeometry args={[0.9, 0.18, 3.4]} />
        <meshStandardMaterial color={DECK} flatShading />
      </mesh>
      <mesh position={[0, 0.02, 1.85]} raycast={() => null}>
        <boxGeometry args={[0.5, 0.14, 0.4]} />
        <meshStandardMaterial color={DECK} flatShading />
      </mesh>
      <mesh position={[0, 0.1, 0]} raycast={() => null}>
        <boxGeometry args={[0.16, 0.04, 3.2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} flatShading />
      </mesh>
      <mesh position={[0, -0.2, -1.5]} raycast={() => null}>
        <boxGeometry args={[0.08, 0.34, 0.44]} />
        <meshStandardMaterial color={FIN} flatShading />
      </mesh>

      {/* ── Rider (sideways surf stance: feet along the board, torso facing out) ── */}
      {/* feet */}
      <mesh position={[0, 0.16, 0.52]} raycast={() => null}>
        <boxGeometry args={[0.3, 0.14, 0.5]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      <mesh position={[0, 0.16, -0.52]} raycast={() => null}>
        <boxGeometry args={[0.3, 0.14, 0.5]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      {/* bent legs */}
      <mesh position={[0, 0.44, 0.42]} rotation={[0.22, 0, 0]} raycast={() => null}>
        <boxGeometry args={[0.26, 0.52, 0.26]} />
        <meshStandardMaterial color={WETSUIT} flatShading />
      </mesh>
      <mesh position={[0, 0.44, -0.42]} rotation={[-0.22, 0, 0]} raycast={() => null}>
        <boxGeometry args={[0.26, 0.52, 0.26]} />
        <meshStandardMaterial color={WETSUIT} flatShading />
      </mesh>
      {/* torso */}
      <mesh position={[0, 0.94, 0.04]} raycast={() => null}>
        <boxGeometry args={[0.44, 0.62, 0.36]} />
        <meshStandardMaterial color={accent} flatShading />
      </mesh>
      {/* arms out for balance */}
      <mesh position={[0.44, 1.04, 0.24]} rotation={[0, 0, -0.5]} raycast={() => null}>
        <boxGeometry args={[0.5, 0.16, 0.16]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      <mesh position={[-0.44, 1.02, -0.22]} rotation={[0, 0, 0.6]} raycast={() => null}>
        <boxGeometry args={[0.5, 0.16, 0.16]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      {/* head + hair */}
      <mesh position={[0, 1.46, 0]} raycast={() => null}>
        <boxGeometry args={[0.36, 0.36, 0.36]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      <mesh position={[0, 1.67, -0.02]} raycast={() => null}>
        <boxGeometry args={[0.4, 0.16, 0.42]} />
        <meshStandardMaterial color={HAIR} flatShading />
      </mesh>
    </group>
  );
}
