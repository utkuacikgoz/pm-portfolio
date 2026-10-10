import { ShaderChunk } from "three";

/**
 * Keeps the r185 diffuse response on three r186+.
 *
 * r186 made MeshStandardMaterial energy conserving between its layers: diffuse
 * light now loses whatever the specular lobe reflects, both for direct lights
 * (`* (1 - F)`) and for ambient/hemisphere irradiance
 * (`* (1 - singleScattering - multiScattering)`). That is more correct, but it
 * assumes the specular share comes back as reflection, and this scene has no
 * environment map. So the light simply vanished: the sea lost up to half its
 * brightness toward the horizon in surf mode, 10 to 16% of the far water on the
 * rail, and 3 to 4% off every island cube.
 *
 * Utku chose to keep the look, so these two lines go back to the r185 form.
 * Everything else in r186 (its specular, multiscatter compensation, the DFG
 * lookup) stays. Patching ShaderChunk once, before any material compiles, keeps
 * every standard material consistent rather than special casing the water.
 *
 * `legacy-diffuse.test.ts` asserts each search string still exists in the
 * installed three, so a future three release that rewrites these lines fails CI
 * instead of silently changing the scene.
 */
export const LEGACY_DIFFUSE_PATCHES: readonly (readonly [string, string])[] = [
  [
    "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );",
    "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );",
  ],
  [
    "vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );",
    "vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );",
  ],
];

type Chunks = { lights_physical_pars_fragment: string };

/** Idempotent. Returns how many of the patches are in effect afterwards. */
export function applyLegacyDiffuse(chunks: Chunks = ShaderChunk): number {
  let src = chunks.lights_physical_pars_fragment;
  let applied = 0;
  for (const [from, to] of LEGACY_DIFFUSE_PATCHES) {
    if (src.includes(from)) {
      src = src.replace(from, to);
      applied++;
    } else if (src.includes(to)) {
      applied++;
    }
  }
  chunks.lights_physical_pars_fragment = src;
  return applied;
}
