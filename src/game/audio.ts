/** Tiny WebAudio blip generator so we ship zero audio assets. */
export class AudioManager {
  private ctx: AudioContext | null = null;
  enabled = true;

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain = 0.06) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  coin() {
    this.tone(880, 0.09, "triangle");
    setTimeout(() => this.tone(1320, 0.08, "triangle"), 45);
  }
  jump() {
    this.tone(420, 0.12, "sine");
  }
  hit() {
    this.tone(150, 0.28, "sawtooth", 0.09);
  }
  win() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.18, "triangle", 0.07), i * 110),
    );
  }
  resume() {
    this.ensure();
  }
}
