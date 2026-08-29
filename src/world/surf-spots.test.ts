import { describe, expect, it } from "vitest";
import { SURF_SPOTS, SURF_LAUNCH, nearestTakeoff, spotForProject } from "./surf-spots";
import { SURF_BOUNDS } from "./surf-controls";
import { PUBLISHED_PROJECTS, projectById } from "../projects/projects";

describe("breaks carry projects", () => {
  // The whole point of the mapping: the most memorable part of the site used to
  // say nothing about the work. Every wave you can catch is now a case study.
  it("gives every break a published project and that project's accent", () => {
    for (const spot of SURF_SPOTS) {
      const project = projectById(spot.projectId);
      expect(project, `break "${spot.id}" carries no published project`).not.toBeNull();
      expect(spot.accent).toBe(project?.accent);
    }
  });

  it("never hands two breaks the same project", () => {
    const ids = SURF_SPOTS.map((s) => s.projectId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Biggest wave, strongest signal. `ride.lift` is the wave's size, and the
  // registry is ordered strongest-first, so the two orderings have to agree or
  // the visitor drops into the smallest wave for the best story.
  it("puts the strongest signal on the heaviest wave", () => {
    const byLift = [...SURF_SPOTS].sort((a, b) => b.ride.lift - a.ride.lift);
    const expected = PUBLISHED_PROJECTS.slice(0, byLift.length).map((p) => p.id);
    expect(byLift.map((s) => s.projectId)).toEqual(expected);
  });

  // A stated gap rather than a silent one: publishing a sixth project is meant
  // to work (registry row, flip the flag) even though there are only five
  // breaks, so this documents what happens to the surplus.
  it("covers as many projects as there are breaks, and says so when there are more", () => {
    const covered = PUBLISHED_PROJECTS.filter((p) => spotForProject(p.id) !== null);
    expect(covered).toHaveLength(Math.min(SURF_SPOTS.length, PUBLISHED_PROJECTS.length));
  });

  it("finds a break back from its project", () => {
    for (const spot of SURF_SPOTS) {
      expect(spotForProject(spot.projectId)?.id).toBe(spot.id);
    }
    expect(spotForProject("not-a-project")).toBeNull();
  });
});

describe("break placement", () => {
  it("keeps every takeoff inside the water the board can actually reach", () => {
    for (const spot of SURF_SPOTS) {
      const [x, z] = spot.take;
      expect(x).toBeGreaterThan(SURF_BOUNDS.minX);
      expect(x).toBeLessThan(SURF_BOUNDS.maxX);
      expect(z).toBeGreaterThan(SURF_BOUNDS.minZ);
      expect(z).toBeLessThan(SURF_BOUNDS.maxZ);
    }
  });

  // Surf mode must not begin already inside a catch zone: the visitor reaches
  // the first wave under their own steering.
  it("launches in open water, clear of every takeoff", () => {
    const [x, z] = SURF_LAUNCH.position;
    expect(nearestTakeoff(x, z, 26)).toBeNull();
  });

  it("finds the nearest takeoff and nothing beyond the radius", () => {
    const spot = SURF_SPOTS[0];
    const [x, z] = spot.take;
    expect(nearestTakeoff(x, z, 5)?.id).toBe(spot.id);
    expect(nearestTakeoff(x + 500, z, 5)).toBeNull();
  });
});
