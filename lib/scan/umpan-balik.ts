/**
 * Sound and vibration. The usher is not always looking at the screen — a queue of a
 * thousand people is read with the ears as much as the eyes, so green and not-green
 * must sound different.
 *
 * Different in timbre, not only in pitch: two sine beeps at different pitches are
 * "a beep" to someone who has heard four hundred of them in a noisy hall. Green is a
 * short, bright, rising chime; red is a long, low, rough buzz; yellow is two flat
 * mid-pitched knocks. Each is also a different vibration pattern.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Must be called from a user gesture once, or iOS keeps the context suspended. */
export function siapkanAudio(): void {
  const a = audio();
  if (a && a.state === "suspended") void a.resume();
}

type Nada = [freq: number, dur: number];

function nada(freqs: Nada[], opsi: { volume?: number; bentuk?: OscillatorType; jeda?: number } = {}) {
  const a = audio();
  if (!a) return;
  const { volume = 0.22, bentuk = "sine", jeda = 0 } = opsi;
  let t = a.currentTime;
  for (const [freq, dur] of freqs) {
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = bentuk;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur + jeda;
  }
}

function getar(pola: number | number[]) {
  try {
    navigator.vibrate?.(pola);
  } catch {
    // Not supported; the sound and the full-screen colour still carry the decision.
  }
}

/** A quick rising chime: bright, high, over in a quarter of a second. */
export function bunyiHijau() {
  nada(
    [
      [1047, 0.08],
      [1568, 0.16],
    ],
    { bentuk: "sine", volume: 0.24 },
  );
  getar(50);
}

/** Two flat knocks in the middle of the range: "look at the screen". */
export function bunyiKuning() {
  nada(
    [
      [660, 0.11],
      [660, 0.11],
    ],
    { bentuk: "triangle", volume: 0.26, jeda: 0.07 },
  );
  getar([80, 60, 80]);
}

/** A long, low, rough buzz that falls: unmistakable next to the chime. */
export function bunyiMerah() {
  nada(
    [
      [220, 0.22],
      [150, 0.4],
    ],
    { bentuk: "sawtooth", volume: 0.16 },
  );
  getar([200, 80, 200]);
}
