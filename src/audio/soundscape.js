export class Soundscape {
  constructor(volume = 0.45) {
    this.volume = volume;
    this.context = null;
    this.master = null;
    this.marketStarted = false;
    this.marketTimer = null;
    this.zone = 'hauptmarkt';
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

  startMarket() {
    if (!this.context || !this.master || this.marketStarted) return;
    this.marketStarted = true;
    const hum = this.context.createOscillator();
    const humGain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    hum.type = 'sine';
    hum.frequency.value = 98;
    humGain.gain.value = 0.018;
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    hum.connect(filter);
    filter.connect(humGain);
    humGain.connect(this.master);
    hum.start();
    const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noise.length; index += 1) noise[index] = (Math.random() * 2 - 1) * .22;
    const ambience = this.context.createBufferSource();
    const ambienceFilter = this.context.createBiquadFilter();
    const ambienceGain = this.context.createGain();
    ambience.buffer = noiseBuffer;
    ambience.loop = true;
    ambienceFilter.type = 'bandpass';
    ambienceFilter.frequency.value = 720;
    ambienceFilter.Q.value = .45;
    ambienceGain.gain.value = .035;
    ambience.connect(ambienceFilter);
    ambienceFilter.connect(ambienceGain);
    ambienceGain.connect(this.master);
    ambience.start();
    const pluck = () => {
      if (!this.context || !this.master) return;
      const start = this.context.currentTime;
      const notes = [293.66, 369.99, 440, 587.33];
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.15, start + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .82);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + .85);
    };
    const loop = () => {
      pluck();
      this.marketTimer = window.setTimeout(loop, 2300 + Math.random() * 2600);
    };
    window.setTimeout(loop, 420);
  }

  // Browser-safe procedural placeholders: zones are silent until the first
  // start click, then fade rather than requiring external audio downloads.
  setZone(zone) {
    if (!this.context || !this.master || !zone || zone === this.zone) return;
    this.zone = zone;
    const now = this.context.currentTime;
    const target = this.volume * (zone === 'domfreihof' ? .085 : zone === 'sternstrasse' ? .105 : .12);
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + .65);
    if (zone === 'domfreihof') this.chime([392, 523.25, 659.25]);
    if (zone === 'sternstrasse') this.chime([329.63, 392]);
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
