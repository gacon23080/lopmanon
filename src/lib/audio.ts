// Web Audio API Sound Synthesizer for School Bell and UI Effects

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Classic Japanese / Anime School Bell (Westminster chime style)
   * Plays: Ding - Dong - Ding - Dong (E5, C5, D5, G4 or similar sweet chime)
   */
  public playSchoolBell(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Chime frequencies (E5, C5, D5, G4)
    const notes = [
      { freq: 659.25, time: 0, duration: 1.2 },      // E5
      { freq: 523.25, time: 0.6, duration: 1.2 },    // C5
      { freq: 587.33, time: 1.2, duration: 1.2 },    // D5
      { freq: 392.00, time: 1.8, duration: 2.2 },    // G4
      // Second phrase
      { freq: 523.25, time: 2.8, duration: 1.2 },    // C5
      { freq: 587.33, time: 3.4, duration: 1.2 },    // D5
      { freq: 659.25, time: 4.0, duration: 1.2 },    // E5
      { freq: 523.25, time: 4.6, duration: 2.5 },    // C5
    ];

    notes.forEach(note => {
      this.playChimeNote(ctx, note.freq, now + note.time, note.duration);
    });
  }

  private playChimeNote(ctx: AudioContext, freq: number, startTime: number, duration: number) {
    const osc = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Add mild overtone for bell metallic richness
    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(freq * 2.76, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    oscHarmonic.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    oscHarmonic.start(startTime);
    osc.stop(startTime + duration);
    oscHarmonic.stop(startTime + duration);
  }

  /**
   * Sparkle / Gacha Celebration sound
   */
  public playSparkle(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  }

  /**
   * Cute button pop
   */
  public playPop(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }
}

export const soundManager = new SoundManager();
