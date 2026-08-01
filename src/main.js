import { GameEngine } from './core/engine.js';
import { Soundscape } from './audio/soundscape.js';
import { GameUI } from './ui/ui.js';
import './styles.css';

const PROFILE_KEY = 'skg-hauptmarkt-profile-v1';

class HauptmarktSlice {
  constructor(app) {
    this.app = app;
    this.engine = null;
    this.audio = new Soundscape(.4);
    this.lastUiUpdate = 0;
    this.ui = new GameUI(app, {
      onStart: (profile) => this.start(profile),
      onJoystick: (x, y) => this.engine?.setJoystick(x, y),
    });
    this.ui.showStart(this.readProfile());
  }

  readProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; } catch { return null; }
  }

  start(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    this.engine?.destroy();
    this.audio.activate();
    this.audio.startMarket();
    try {
      this.engine = new GameEngine(this.ui.elements.canvas, profile, {
        onFrame: (frame) => this.onFrame(frame),
      });
      this.ui.begin(profile, this.engine.world.visitorCount);
    } catch (error) {
      this.ui.showWebGLError(error);
    }
  }

  onFrame(frame) {
    const now = performance.now();
    if (now - this.lastUiUpdate < 350) return;
    this.lastUiUpdate = now;
    this.ui.updateMarket(frame.visitorCount);
  }
}

new HauptmarktSlice(document.querySelector('#app'));
