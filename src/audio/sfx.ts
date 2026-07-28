import { useSyncExternalStore } from "react";

// Tiny Web-Audio sound layer: all SFX + the ambient waterfall are synthesized
// (oscillators / filtered noise) so there is ZERO asset payload. Sound is OFF by
// default; it turns on only via the in-world toggle (SoundToggle). State persists
// in localStorage. The AudioContext is suspended while the tab is hidden so a
// backgrounded tab makes no sound and does no audio work.

const KEY = "pmworld.sound.v1";
const EVENT = "pmworld:sound";

export type SfxName = "enter" | "travel" | "open" | "close" | "read" | "egg" | "toggle" | "coin";

interface Ambient {
  stop: () => void;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: Ambient | null = null;

function readMuted(): boolean {
  if (typeof localStorage === "undefined") return true;
  const v = localStorage.getItem(KEY);
  return v === null ? true : v !== "on"; // default OFF (muted) until the visitor opts in
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
  bindVisibility(); // ensure the tab-hidden suspend guard is active once audio exists
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

// A mellow, dreamy surf loop for free-surf mode. Original melody (NOT the
// copyrighted "California Dreamin'" recording — everything here is synthesized,
// zero asset payload); a soft Am / F / C / G pad with a gentle sine lead over the
// top, evoking that hazy west-coast mood. Scheduled a bar ahead so it never
// stutters, and it sits low under the SFX + waterfall bed.
let music: { stop: () => void } | null = null;

export function startSurfMusic() {
  const c = ensureCtx();
  if (!c || !master || music || muted) return;

  const out = c.createGain();
  out.gain.value = 0.0001;
  out.connect(master);
  const t0 = c.currentTime;
  out.gain.linearRampToValueAtTime(0.1, t0 + 2); // ease in

  // Chord roots + thirds/fifths for the pad, per bar.
  const bars: number[][] = [
    [220.0, 261.63, 329.63], // Am
    [174.61, 220.0, 261.63], // F
    [261.63, 329.63, 392.0], // C
    [196.0, 246.94, 293.66], // G
  ];
  const BAR = 2.6; // seconds per chord — unhurried
  let bar = 0;
  let nextTime = t0 + 0.15;
  let stopped = false;
  let timer = 0;

  const scheduleBar = (freqs: number[], at: number) => {
    // Warm pad an octave down.
    freqs.forEach((f) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.value = f / 2;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.05, at + 0.5);
      g.gain.linearRampToValueAtTime(0.0001, at + BAR);
      o.connect(g).connect(out);
      o.start(at);
      o.stop(at + BAR + 0.05);
    });
    // Gentle sine lead: four plucks tracing the chord.
    const lead = [freqs[2], freqs[1] * 2, freqs[2], freqs[0] * 2];
    lead.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const mt = at + i * (BAR / lead.length);
      g.gain.setValueAtTime(0.0001, mt);
      g.gain.linearRampToValueAtTime(0.045, mt + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, mt + 0.6);
      o.connect(g).connect(out);
      o.start(mt);
      o.stop(mt + 0.65);
    });
  };

  const loop = () => {
    if (stopped || !ctx) return;
    const now = ctx.currentTime;
    while (nextTime < now + 1.6) {
      scheduleBar(bars[bar % bars.length], nextTime);
      nextTime += BAR;
      bar++;
    }
    timer = window.setTimeout(loop, 700);
  };
  loop();

  music = {
    stop: () => {
      stopped = true;
      window.clearTimeout(timer);
      const now = c.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0.0001, now + 1); // fade out, let notes ring
      window.setTimeout(() => out.disconnect(), 1500);
      music = null;
    },
  };
}

export function stopSurfMusic() {
  music?.stop();
}

// Suspend the AudioContext while the tab is hidden (no background sound / work),
// resume when it comes back — unless muted. Bound once, on first enableSound.
let visibilityBound = false;
function bindVisibility() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (!muted) void ctx.resume();
  });
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
      case "coin":
        note(880, 0.06, "triangle", 0.08, { slideTo: 1320 });
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
  if (next) {
    ambient?.stop();
    stopSurfMusic(); // muting kills the surf loop too
  } else {
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
