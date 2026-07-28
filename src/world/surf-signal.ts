// A frame-level, non-React channel between SurfController (the board) and
// SurfSpots (the wave visuals). When the surfer drops in on a break, the
// controller stamps the break id + the clock time so the matching wave can kick
// up spray, without routing a per-frame value through React state.
export const surfSignal = {
  rideSpotId: null as string | null,
  rideStart: -99, // state.clock.elapsedTime of the last drop-in
};
