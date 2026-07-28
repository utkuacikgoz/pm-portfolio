import { useSyncExternalStore } from "react";

// Tiny Web-Audio sound layer: all SFX are synthesized (oscillator + gain
// envelope) so there is ZERO asset payload. Muted by default (recruiters may
// open this in an office); state persists in localStorage. The AudioContext is
// created/resumed lazily on the first user gesture (unmute / Begin), so we never
// fight the browser autoplay policy.

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
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem(KEY);
  return v === null ? true : v !== "on"; // default muted
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

function startAmbient() {
  const c = ensureCtx();
  if (!c || !master || ambient) return;
  const a = c.createGain();
  a.gain.value = 0.0001;
  a.connect(master);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 620;
  lp.connect(a);
  const o1 = c.createOscillator();
  o1.type = "sine";
  o1.frequency.value = 110;
  const o2 = c.createOscillator();
  o2.type = "sine";
  o2.frequency.value = 110 * 1.008; // gentle detune → slow beating
  o1.connect(lp);
  o2.connect(lp);
  // Very slow swell so the pad breathes rather than drones.
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.018;
  lfo.connect(lfoGain).connect(a.gain);
  const t = c.currentTime;
  a.gain.setValueAtTime(0.0001, t);
  a.gain.linearRampToValueAtTime(0.03, t + 2);
  o1.start();
  o2.start();
  lfo.start();
  ambient = {
    stop: () => {
      const now = c.currentTime;
      a.gain.cancelScheduledValues(now);
      a.gain.setValueAtTime(a.gain.value, now);
      a.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      o1.stop(now + 0.5);
      o2.stop(now + 0.5);
      lfo.stop(now + 0.5);
      ambient = null;
    },
  };
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
