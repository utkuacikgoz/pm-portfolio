import { describe, expect, it } from "vitest";
import { ShaderChunk } from "three";
import { LEGACY_DIFFUSE_PATCHES, applyLegacyDiffuse } from "./legacy-diffuse";

describe("legacy diffuse patch", () => {
  it("finds every line it patches in the installed three", () => {
    // If this fails after a three bump, the lighting code moved: re-derive the
    // patch from the new chunk and compare surf mode before and after.
    const src = ShaderChunk.lights_physical_pars_fragment;
    for (const [from, to] of LEGACY_DIFFUSE_PATCHES) {
      expect(src.includes(from) || src.includes(to), from).toBe(true);
      expect(src.split(from).length - 1, from).toBeLessThanOrEqual(1);
    }
  });

  it("removes the diffuse energy loss and is idempotent", () => {
    const chunks = { lights_physical_pars_fragment: ShaderChunk.lights_physical_pars_fragment };
    expect(applyLegacyDiffuse(chunks)).toBe(LEGACY_DIFFUSE_PATCHES.length);
    const once = chunks.lights_physical_pars_fragment;
    expect(once).not.toContain("* ( 1.0 - F );");
    expect(once).not.toContain("* ( 1.0 - singleScattering - multiScattering );");
    expect(applyLegacyDiffuse(chunks)).toBe(LEGACY_DIFFUSE_PATCHES.length);
    expect(chunks.lights_physical_pars_fragment).toBe(once);
  });
});
