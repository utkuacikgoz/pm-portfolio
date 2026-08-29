// The shape of a breaking wave, as pure arithmetic.
//
// The old face was a plane pushed out at mid-height and brought back to zero at
// the crest: a WALL, leaning slightly. It is a fine thing to surf past and it
// can never be surfed inside, because nothing about it overhangs. A barrel is
// exactly the part that was missing, so the profile is now an arc that keeps
// rotating past vertical: the crest travels forward and back DOWN over the
// water it came from, and the space underneath it is the tube.
//
// Kept out of the component so the one property that decides whether a wave is
// rideable-looking or not (does the lip actually pass the base?) is a number
// this module can be asked for, rather than something you can only find out by
// rendering it and squinting.

/** How far past vertical the crest sweeps, in radians, per wave temperament. */
export const CURL = {
  /** A rolling beach break. Leans, never closes. */
  gentle: 0.12,
  /** A long peeling wall with a hint of cover. */
  peeling: 0.5,
  /** A heavy slab: throws hard and covers the rider completely. */
  slab: 1.0,
} as const;

export interface WaveFace {
  positions: number[];
  indices: number[];
}

/**
 * Height and throw of the face at a given progress up it, 0 at the trough and 1
 * at the lip.
 *
 * The arc sweeps `PI/2 + curl`, so at curl 0 it is a quarter circle standing
 * straight up (a wall) and every radian beyond that pitches the crest over the
 * trough. `y` therefore RISES and then falls back as the lip throws, while `z`
 * grows the whole way: that reversal in y is the overhang.
 */
export function faceProfile(progress: number, radius: number, curl: number): { y: number; z: number } {
  const angle = progress * (Math.PI / 2 + curl);
  return { y: radius * Math.sin(angle), z: radius * (1 - Math.cos(angle)) };
}

/**
 * How far the lip reaches out beyond the highest point of the face, in world
 * units: the depth of the tube. Positive means there is cover under it, zero
 * means the wave is a wall and no camera placed behind the rider will ever be
 * covered by it however the ride is staged.
 *
 * Measured from the crown rather than from the foot on purpose. Even a wave
 * that stands dead upright throws a full radius forward simply by being round,
 * and calling that an overhang would report cover on a wave that has none. What
 * makes a tube is the arc continuing PAST vertical, so the honest number is how
 * much further forward the lip gets after the face has stopped climbing.
 */
export function lipOverhang(radius: number, curl: number): number {
  const crown = (Math.PI / 2) / (Math.PI / 2 + curl); // progress at maximum height
  return faceProfile(1, radius, curl).z - faceProfile(crown, radius, curl).z;
}

/** Height of the lip above the water, which is not the wave's radius once it curls. */
export function lipHeight(radius: number, curl: number): number {
  return faceProfile(1, radius, curl).y;
}

/**
 * Triangulated face. `across` and `rise` are the tessellation; the crest is
 * lifted slightly in the middle so the wave reads as a peak that breaks from
 * the centre out rather than as an extruded bathtub edge.
 */
export function waveFace(width: number, radius: number, curl: number, across = 36, rise = 16): WaveFace {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let xi = 0; xi <= across; xi++) {
    const xProgress = xi / across;
    const x = -width / 2 + width * xProgress;
    const crestLift = Math.sin(xProgress * Math.PI) * radius * 0.07;
    for (let yi = 0; yi <= rise; yi++) {
      const yProgress = yi / rise;
      const { y, z } = faceProfile(yProgress, radius, curl);
      positions.push(x, y + crestLift * yProgress, z);
    }
  }
  for (let xi = 0; xi < across; xi++) {
    for (let yi = 0; yi < rise; yi++) {
      const a = xi * (rise + 1) + yi;
      const b = a + rise + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, indices };
}
