// Session memory (NOT localStorage): the pick survives a same-tab refresh but a
// fresh launch re-asks, so character-select shows every relaunch.
//
// Split out of `avatars.ts` on purpose. `WorldExperience` only needs to READ
// the stored pick, but importing that from `avatars.ts` dragged the AVATARS
// table and all three portrait SVGs into the entry chunk for every visitor,
// including the flat/mobile path that never opens the gate.
const AVATAR_KEY = "pmworld.avatar";

export function readAvatar(): string | null {
  try {
    return sessionStorage.getItem(AVATAR_KEY);
  } catch {
    return null;
  }
}

export function writeAvatar(id: string) {
  try {
    sessionStorage.setItem(AVATAR_KEY, id);
  } catch {
    // private mode — the gate just won't be remembered; harmless.
  }
}
