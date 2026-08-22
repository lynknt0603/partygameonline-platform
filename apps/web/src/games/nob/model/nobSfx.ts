import { useNobPrefs } from "./nobPrefs";

export type NobSfxKind = "tokenFlip" | "inspect";

let audioContext: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  if (!audioContext) {
    audioContext = new Ctor();
  }
  return audioContext;
}

function chime(audio: AudioContext, freqs: number[], step: number, duration: number): void {
  const now = audio.currentTime;
  freqs.forEach((freq, index) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const start = now + index * step;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  });
}

export function unlockNobSfx(): void {
  const audio = context();
  if (audio?.state === "suspended") {
    void audio.resume();
  }
}

export function playNobSfx(kind: NobSfxKind): void {
  if (!useNobPrefs.getState().sound) {
    return;
  }
  const audio = context();
  if (!audio) {
    return;
  }
  if (audio.state === "suspended") {
    void audio.resume();
  }
  if (kind === "tokenFlip") {
    chime(audio, [392, 523.25], 0.07, 0.32);
    return;
  }
  chime(audio, [523.25, 659.25, 784], 0.05, 0.24);
}
