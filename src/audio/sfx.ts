import { useSyncExternalStore } from "react";

// Tiny Web-Audio sound layer: all SFX + the ambient waterfall are synthesized
// (oscillators / filtered noise) so there is ZERO asset payload. Sound is ON by
// default; state persists in localStorage and there's an always-visible toggle.
// The AudioContext can't start without a user gesture, so `armAudio()` starts
// the waterfall on the first pointer/key event — no autoplay-policy fights.

const KEY = "pmworld.sound.v1";
const EVENT = "pmworld:sound";

export type SfxName = "enter" | "travel" | "open" | "close" | "read" | "egg" | "toggle";

interface Ambient {
  stop: () => void;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: Ambient | null = null;

function readMuted(): boolean {
  if (typeof localStorage === "undefined") return false;
  const v = localStorage.getItem(KEY);
  return v === null ? false : v !== "on"; // default ON (unmuted)
}

let muted = readMuted();

function notify() {
  window.dispatchEvent(new Event(EVENT));
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// One enveloped note. `at` is an absolute AudioContext time for sequencing.
function note(
  freq: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  opts: { slideTo?: number; at?: number } = {}
) {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = opts.at ?? c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function chord(freqs: number[], dur: number, type: OscillatorType, peak: number) {
  freqs.forEach((f) => note(f, dur, type, peak));
}

function arp(freqs: number[], step: number, dur: number, type: OscillatorType, peak: number) {
  const c = ensureCtx();
  if (!c) return;
  const base = c.currentTime;
  freqs.forEach((f, i) => note(f, dur, type, peak, { at: base + i * step }));
}

function makeNoiseBuffer(c: AudioContext): AudioBuffer {
  const len = Math.floor(c.sampleRate * 2); // 2s seamless loop
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// A calming waterfall: looping noise split into a low rumble body + an airy
// high "rush" whose level slowly swells so it moves rather than hisses flatly.
function startAmbient() {
  const c = ensureCtx();
  if (!c || !master || ambient) return;
  const out = c.createGain();
  out.gain.value = 0.0001;
  out.connect(master);

  const src = c.createBufferSource();
  src.buffer = makeNoiseBuffer(c);
  src.loop = true;

  // Body: low rumble of falling water.
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 640;
  const lpGain = c.createGain();
  lpGain.gain.value = 0.85;
  src.connect(lp).connect(lpGain).connect(out);

  // Rush: airy band that swells via a slow LFO.
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3200;
  bp.Q.value = 0.7;
  const bpGain = c.createGain();
  bpGain.gain.value = 0.16;
  src.connect(bp).connect(bpGain).connect(out);

  const lfo = c.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.06;
  lfo.connect(lfoGain).connect(bpGain.gain);

  const t = c.currentTime;
  out.gain.setValueAtTime(0.0001, t);
  out.gain.linearRampToValueAtTime(0.16, t + 2.5); // gentle fade-in

  src.start();
  lfo.start();
  ambient = {
    stop: () => {
      const now = c.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      src.stop(now + 0.6);
      lfo.stop(now + 0.6);
      ambient = null;
    },
  };
}

// Sound is on by default, but a browser won't let the AudioContext start until
// the user interacts. Start the waterfall on the first gesture (if not muted).
let armed = false;
export function armAudio() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const kick = () => {
    window.removeEventListener("pointerdown", kick);
    window.removeEventListener("keydown", kick);
    window.removeEventListener("touchstart", kick);
    if (!muted) {
      ensureCtx();
      startAmbient();
    }
  };
  window.addEventListener("pointerdown", kick);
  window.addEventListener("keydown", kick);
  window.addEventListener("touchstart", kick);
}

export const sfx = {
  play(name: SfxName) {
    if (muted) return;
    switch (name) {
      case "enter":
        chord([220, 330, 440], 0.7, "triangle", 0.1);
        break;
      case "travel":
        note(540, 0.2, "sine", 0.12, { slideTo: 240 });
        note(270, 0.22, "sine", 0.06, { slideTo: 160 });
        break;
      case "open":
        note(440, 0.12, "triangle", 0.12, { slideTo: 680 });
        break;
      case "close":
        note(460, 0.12, "triangle", 0.1, { slideTo: 300 });
        break;
      case "read":
        arp([660, 990], 0.09, 0.16, "triangle", 0.11);
        break;
      case "egg":
        arp([523, 659, 784, 1047], 0.08, 0.22, "triangle", 0.12);
        break;
      case "toggle":
        note(300, 0.05, "square", 0.07);
        break;
    }
  },
};

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(KEY, next ? "off" : "on");
  } catch {
    // private mode / quota — sound is non-essential, fail silently.
  }
  if (next) ambient?.stop();
  else {
    ensureCtx();
    startAmbient();
  }
  notify();
}

export function toggleMuted() {
  setMuted(!muted);
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function useSound() {
  const m = useSyncExternalStore(subscribe, () => muted, () => true);
  return { muted: m, toggle: toggleMuted };
}
