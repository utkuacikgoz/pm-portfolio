import { T } from "../theme";

/**
 * The entrance rocket. Flat-shaded low-poly in the same geometric language as
 * the logo: every surface is a lit face and a shaded face from the palette, no
 * gradients and no imported art. Pure SVG on purpose, so the hero still mounts
 * no Canvas and three.js stays behind the Enter click (CLAUDE.md, entrance
 * flow).
 *
 * The nose points right and the nozzle sits at x=78 in a 220x120 viewBox, which
 * is where HeroIntro's exhaust cone starts (it derives that offset from the
 * rendered width, `--rocket-w * .63`). Move the engine in the art and that
 * factor moves with it.
 */
export default function Rocket({ animated }: { animated: boolean }) {
  // Two flame layers at different rates: one rhythm reads as a pulsing lamp,
  // two reads as combustion.
  const outerFlame = animated ? { animation: "flameFlicker .15s ease-in-out infinite alternate" } : undefined;
  const coreFlame = animated ? { animation: "flameFlicker .08s ease-in-out infinite alternate-reverse" } : undefined;
  const diamonds = animated ? { animation: "shockDiamond .32s ease-in-out infinite" } : undefined;

  return (
    <svg className="hero-rocket" width={220} height={120} viewBox="0 0 220 120" fill="none" aria-hidden focusable="false">
      {/* Nose held a few degrees up: a level rocket reads as a pipe. */}
      <g transform="rotate(-5 110 60)">
        {/* Exhaust. Drawn first so the engine housing overlaps its root. */}
        <g style={outerFlame} className="hero-flame">
          <path d="M80 40 C 48 45, 26 52, 4 60 C 26 68, 48 75, 80 80 Z" fill={T.coral} opacity={0.75} />
          <path d="M80 46 C 54 50, 38 55, 22 60 C 38 65, 54 70, 80 74 Z" fill={T.amber} opacity={0.92} />
        </g>
        <g style={coreFlame} className="hero-flame">
          <path d="M80 51 C 62 54, 52 57, 42 60 C 52 63, 62 66, 80 69 Z" fill={T.gold} />
          <path d="M80 55 L58 60 L80 65 Z" fill={T.text} opacity={0.85} />
        </g>
        {/* Shock diamonds: the tell that an engine is actually running. */}
        <g style={diamonds} className="hero-flame">
          <path d="M70 60 l5 -4 l5 4 l-5 4 Z" fill={T.text} opacity={0.55} />
          <path d="M56 60 l4 -3 l4 3 l-4 3 Z" fill={T.text} opacity={0.35} />
        </g>

        {/* Engine bell + housing. */}
        <path d="M98 30 L80 40 L80 80 L98 90 Z" fill={T.surface} />
        <path d="M98 30 L80 40 L80 60 L98 60 Z" fill={T.border} />
        <ellipse cx={80} cy={60} rx={4} ry={20} fill={T.ink} />

        {/* Fins: top catches the light, bottom stays in shadow. */}
        <path d="M132 32 L112 4 L96 32 Z" fill={T.mauve} />
        <path d="M112 4 L112 32 L96 32 Z" fill={T.violet} />
        <path d="M132 88 L112 116 L96 88 Z" fill={T.violet} />
        <path d="M132 88 L112 116 L112 88 Z" fill={T.mauve} opacity={0.55} />

        {/* Fuselage, three flat steps of taupe metal. */}
        <path d="M98 32 H166 V46 H98 Z" fill={T.textSoft} />
        <path d="M98 46 H166 V60 H98 Z" fill={T.textMuted} />
        <path d="M98 60 H166 V88 H98 Z" fill={T.border} />

        {/* Livery band, same coral-on-metal as the logo. */}
        <path d="M110 32 H122 V88 H110 Z" fill={T.coral} />
        <path d="M110 60 H122 V88 H110 Z" fill={T.brick} />
        <path d="M127 32 H131 V88 H127 Z" fill={T.gold} opacity={0.9} />

        {/* Nose cone. */}
        <path d="M206 60 L166 32 L166 60 Z" fill={T.coral} />
        <path d="M206 60 L166 60 L166 88 Z" fill={T.brick} />

        {/* Porthole. */}
        <circle cx={148} cy={50} r={9} fill={T.blue} stroke={T.skyBlue} strokeWidth={3} />
        <circle cx={145} cy={47} r={2.6} fill={T.text} opacity={0.6} />
      </g>
    </svg>
  );
}
