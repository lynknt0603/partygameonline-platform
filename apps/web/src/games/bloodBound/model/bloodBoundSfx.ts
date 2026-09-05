import { useBloodBoundPrefs } from "./bloodBoundPrefs";

export type BloodBoundSfxKind =
  | "attack"
  | "wound"
  | "shield"
  | "intervene"
  | "reveal"
  | "heal"
  | "victory"
  | "defeat"
  | "turn";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) {
    audioContext = new Ctor();
  }
  return audioContext;
}

export function unlockBloodBoundSfx(): void {
  const audio = getAudioContext();
  if (audio && audio.state === "suspended") {
    void audio.resume();
  }
}

// 1. Âm thanh vung dao / chém kiếm sắc bén (Metallic blade clash & whoosh)
function playSlash(audio: AudioContext): void {
  const now = audio.currentTime;

  // Lớp 1: Tiếng rít kim loại sắc nhọn (High-frequency sweep)
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(1600, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.18);

  // Lớp 2: Tiếng kim loại vang (Metallic ring)
  const ringOsc = audio.createOscillator();
  const ringGain = audio.createGain();
  ringOsc.type = "sine";
  ringOsc.frequency.setValueAtTime(987.77, now + 0.03); // B5
  ringGain.gain.setValueAtTime(0.0001, now + 0.03);
  ringGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
  ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  ringOsc.connect(ringGain);
  ringGain.connect(audio.destination);
  ringOsc.start(now + 0.03);
  ringOsc.stop(now + 0.32);
}

// 2. Âm thanh nhận đòn sát thương / trúng vết thương (Heavy blood impact thump)
function playWound(audio: AudioContext): void {
  const now = audio.currentTime;

  // Tiếng đập trầm rung chuyển (Sub bass impact)
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(38, now + 0.22);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

// 3. Âm thanh khiên kim loại chặn đòn (Resonant shield block)
function playShield(audio: AudioContext): void {
  const now = audio.currentTime;
  const freqs = [659.25, 987.77, 1318.51]; // E5, B5, E6
  freqs.forEach((f, idx) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now);

    const start = now + idx * 0.02;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.14, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.48);
  });
}

// 4. Âm thanh can thiệp đỡ đòn khẩn cấp (Urgent heroic intervention fanfare)
function playIntervene(audio: AudioContext): void {
  const now = audio.currentTime;
  const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
  notes.forEach((freq, idx) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    const start = now + idx * 0.055;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.35);
  });
}

// 5. Âm thanh mở/lật manh mối thần bí (Mystical clue reveal chime)
function playReveal(audio: AudioContext): void {
  const now = audio.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  freqs.forEach((freq, idx) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    const start = now + idx * 0.045;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

// 6. Âm thanh hồi máu / giả kim thuật (Ethereal healing chime)
function playHeal(audio: AudioContext): void {
  const now = audio.currentTime;
  const freqs = [349.23, 440, 523.25, 698.46, 880]; // F major ascending
  freqs.forEach((freq, idx) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    const start = now + idx * 0.06;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.52);
  });
}

// 7. Âm thanh chiến thắng hoàng gia (Triumphant victory fanfare)
function playVictory(audio: AudioContext): void {
  const now = audio.currentTime;
  const chords = [
    { notes: [261.63, 329.63, 392], delay: 0, dur: 0.35 },
    { notes: [329.63, 392, 523.25], delay: 0.28, dur: 0.35 },
    { notes: [392, 523.25, 659.25, 783.99], delay: 0.58, dur: 0.9 },
  ];

  chords.forEach((chord) => {
    chord.notes.forEach((freq) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + chord.delay);

      const start = now + chord.delay;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + chord.dur);

      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(start);
      osc.stop(start + chord.dur + 0.05);
    });
  });
}

// 8. Âm thanh thất bại u tối (Dark gothic defeat drone)
function playDefeat(audio: AudioContext): void {
  const now = audio.currentTime;
  const notes = [196, 174.61, 155.56, 130.81]; // Descending sorrow
  notes.forEach((freq, idx) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);

    const start = now + idx * 0.2;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.65);
  });
}

// 9. Âm thanh thông báo tới lượt đi / đoản kiếm trao tay (Turn alert)
function playTurn(audio: AudioContext): void {
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.22);
}

export function playBloodBoundSfx(kind: BloodBoundSfxKind): void {
  if (!useBloodBoundPrefs.getState().sound) {
    return;
  }
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") {
    void audio.resume();
  }

  switch (kind) {
    case "attack":
      playSlash(audio);
      break;
    case "wound":
      playWound(audio);
      break;
    case "shield":
      playShield(audio);
      break;
    case "intervene":
      playIntervene(audio);
      break;
    case "reveal":
      playReveal(audio);
      break;
    case "heal":
      playHeal(audio);
      break;
    case "victory":
      playVictory(audio);
      break;
    case "defeat":
      playDefeat(audio);
      break;
    case "turn":
      playTurn(audio);
      break;
  }
}
