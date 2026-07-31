// Pure surf-control rules, kept outside the render loop so the timing and water
// clearance contracts can be tested without a WebGL canvas.

export const DOUBLE_SPACE_WINDOW = 0.32;
export const BOARD_CLEARANCE = 0.34;

export function isDoubleSpacePress(now: number, previous: number): boolean {
  const elapsed = now - previous;
  return elapsed > 0 && elapsed <= DOUBLE_SPACE_WINDOW + 1e-6;
}

export function boardFloatY(surfaceY: number, smoothedY: number): number {
  // Smoothing calms the camera, but it must never pull the board below the
  // actual shader-driven water surface.
  return Math.max(surfaceY + BOARD_CLEARANCE, smoothedY);
}
