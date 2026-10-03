// Web Audio API Sound Synthesizer for School Bell and UI Effects

export const FULL_BELL_DURATION_MS = 6000;

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private activeNodes: { stop: () => void }[] = [];
  private bellFinishTimer: NodeJS.Timeout | null = null;
  public isBellPlaying: boolean = false;

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
    return this.ctx;
  }

  /**
   * Kích hoạt và mở khóa AudioContext khi có tương tác người dùng
   */
  public async unlockAudio(): Promise<boolean> {
    const ctx = this.getContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        return (ctx.state as string) === 'running';
      } catch {
        return false;
      }
    }
    return ctx.state === 'running';
  }

  public isAudioRunning(): boolean {
    const ctx = this.getContext();
    return ctx ? ctx.state === 'running' : false;
  }

  public stopAllSounds(): void {
    this.isBellPlaying = false;
    if (this.bellFinishTimer) {
      clearTimeout(this.bellFinishTimer);
      this.bellFinishTimer = null;
    }
    this.activeNodes.forEach(node => {
      try {
        node.stop();
      } catch {}
    });
    this.activeNodes = [];
  }

  /**
   * Classic Westminster Japanese School Bell - Chuông trường 8 nốt ngân vang chuẩn 6.0 giây
   * Âm lượng to, vang, trầm ấm, đúng giai điệu chuông trường học.
   */
  public async playSchoolBell(onFinish?: () => void): Promise<boolean> {
    if (!this.enabled) {
      if (onFinish) onFinish();
      return false;
    }

    const ctx = this.getContext();
    if (!ctx) {
      if (onFinish) onFinish();
      return false;
    }

    // Thử kích hoạt AudioContext
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn("AudioContext suspended, waiting for user gesture:", e);
      }
    }

    // Dừng các âm thanh cũ trước khi phát mới
    this.stopAllSounds();

    // Nếu AudioContext vẫn bị khóa bởi browser autoplay policy
    if (ctx.state !== 'running') {
      console.warn("AudioContext is still suspended. Sound will trigger on user interaction.");
      return false;
    }

    this.isBellPlaying = true;

    // Timer chuẩn 6.0 giây
    this.bellFinishTimer = setTimeout(() => {
      this.isBellPlaying = false;
      this.bellFinishTimer = null;
      if (onFinish) onFinish();
    }, FULL_BELL_DURATION_MS);

    try {
      this.executeBellSequence(ctx);
      return true;
    } catch (err) {
      console.warn("Lỗi phát chuông:", err);
      this.isBellPlaying = false;
      if (onFinish) onFinish();
      return false;
    }
  }

  private executeBellSequence(ctx: AudioContext): void {
    const now = ctx.currentTime + 0.05;

    // Giai điệu Westminster 8 nốt ngân chuẩn xác trọn vẹn trong 6.0 giây
    const notes = [
      // Câu 1 (1.95s)
      { freq: 329.63, time: 0.00, duration: 1.15 },   // E4 (Mi)
      { freq: 261.63, time: 0.65, duration: 1.15 },   // C4 (Đô)
      { freq: 293.66, time: 1.30, duration: 1.15 },   // D4 (Rê)
      { freq: 196.00, time: 1.95, duration: 1.50 },   // G3 (Sol trầm)
      // Nghỉ ngắn (1.05s) & Câu 2
      { freq: 261.63, time: 3.00, duration: 1.15 },   // C4 (Đô)
      { freq: 293.66, time: 3.65, duration: 1.15 },   // D4 (Rê)
      { freq: 329.63, time: 4.30, duration: 1.15 },   // E4 (Mi)
      { freq: 261.63, time: 4.95, duration: 1.05 },   // C4 (Đô kết thúc ngân vang đúng 6s)
    ];

    notes.forEach(note => {
      this.playChimeNote(ctx, note.freq, now + note.time, note.duration);
    });
  }

  /**
   * Tạo âm thanh chuông đồng trường học (Tubular Bell Chime) bằng Web Audio API
   * Tối ưu âm sắc ấm, ngân vang, âm lượng rõ ràng
   */
  private playChimeNote(ctx: AudioContext, freq: number, startTime: number, duration: number) {
    try {
      const osc = ctx.createOscillator();
      const oscHarmonic1 = ctx.createOscillator();
      const oscHarmonic2 = ctx.createOscillator();
      const oscHarmonic3 = ctx.createOscillator();

      const mainGain = ctx.createGain();
      const h1Gain = ctx.createGain();
      const h2Gain = ctx.createGain();
      const h3Gain = ctx.createGain();
      const masterGain = ctx.createGain();

      // Nốt cơ bản (Fundamental): Sóng sine trầm ấm
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Quãng 8 trên (2x freq) tạo độ trong trẻo
      oscHarmonic1.type = 'sine';
      oscHarmonic1.frequency.setValueAtTime(freq * 2, startTime);

      // Âm bội kim loại (3x freq) tạo tiếng chuông đồng
      oscHarmonic2.type = 'triangle';
      oscHarmonic2.frequency.setValueAtTime(freq * 3.01, startTime);

      // Âm bội leng keng ngân (4.2x freq)
      oscHarmonic3.type = 'sine';
      oscHarmonic3.frequency.setValueAtTime(freq * 4.2, startTime);

      // Tỉ lệ âm lượng các âm bội
      h1Gain.gain.setValueAtTime(0.35, startTime);
      h2Gain.gain.setValueAtTime(0.15, startTime);
      h3Gain.gain.setValueAtTime(0.08, startTime);

      // Master Envelope: Đánh mạnh (Attack 15ms) rồi ngân vang tự nhiên (Decay)
      masterGain.gain.setValueAtTime(0.0001, startTime);
      masterGain.gain.linearRampToValueAtTime(0.75, startTime + 0.015);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      // Kết nối các node
      osc.connect(mainGain);
      oscHarmonic1.connect(h1Gain);
      h1Gain.connect(mainGain);
      oscHarmonic2.connect(h2Gain);
      h2Gain.connect(mainGain);
      oscHarmonic3.connect(h3Gain);
      h3Gain.connect(mainGain);

      mainGain.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Phát âm thanh
      osc.start(startTime);
      oscHarmonic1.start(startTime);
      oscHarmonic2.start(startTime);
      oscHarmonic3.start(startTime);

      osc.stop(startTime + duration);
      oscHarmonic1.stop(startTime + duration);
      oscHarmonic2.stop(startTime + duration);
      oscHarmonic3.stop(startTime + duration);

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
            oscHarmonic1.stop();
            oscHarmonic2.stop();
            oscHarmonic3.stop();
            masterGain.disconnect();
          } catch {}
        }
      });
    } catch (err) {
      console.warn("Chime note synthesis warning:", err);
    }
  }

  /**
   * Âm thanh hiệu ứng lấp lánh khi lưu bài hát hoặc đổi quà
   */
  public playSparkle(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime + 0.02;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    freqs.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      } catch {}
    });
  }

  /**
   * Âm thanh click nút vui nhộn
   */
  public playPop(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }
}

export const soundManager = new SoundManager();
