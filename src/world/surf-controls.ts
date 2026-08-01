// Pure surf-control rules, kept outside the render loop so the timing and water
// clearance contracts can be tested without a WebGL canvas.

export const DOUBLE_SPACE_WINDOW = 0.32;
export const BOARD_CLEARANCE = 0.34;

// How far you can roam before the invisible wall deflects you. Exported (rather
// than inlined in SurfController) so the horizon ring can be proved to sit
// outside it: the mountains used to be generated at radius 155 while the wall
// stood at z 130, which put their collision volumes INSIDE the playable water.
// That is why they read as looming rather than distant.
export const SURF_BOUNDS = { minX: -120, maxX: 300, minZ: -200, maxZ: 200 };

export function isDoubleSpacePress(now: number, previous: number): boolean {
  const elapsed = now - previous;
  return elapsed > 0 && elapsed <= DOUBLE_SPACE_WINDOW + 1e-6;
}

export function boardFloatY(surfaceY: number, smoothedY: number): number {
  // Smoothing calms the camera, but it must never pull the board below the
  // actual shader-driven water surface.
  return Math.max(surfaceY + BOARD_CLEARANCE, smoothedY);
}
