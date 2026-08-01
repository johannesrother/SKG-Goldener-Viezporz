export class Soundscape {
  constructor(volume = 0.45) {
    this.volume = volume;
    this.context = null;
    this.master = null;
  }

  activate() {
    if (this.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = this.volume * 0.12;
    this.master.connect(this.context.destination);
  }

  chime(tones = [523.25, 659.25]) {
    if (!this.context || !this.master) return;
    const start = this.context.currentTime;
    tones.forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start + index * 0.045);
      gain.gain.setValueAtTime(0.0001, start + index * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.5, start + index * 0.045 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.045 + 1.1);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(start + index * 0.045);
      oscillator.stop(start + index * 0.045 + 1.15);
    });
  }

  progress(finale = false) {
    this.chime(finale ? [392, 523.25, 783.99] : [523.25, 659.25]);
  }
}
