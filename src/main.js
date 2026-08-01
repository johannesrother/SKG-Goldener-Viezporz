import { GameEngine } from './core/engine.js';
import { Soundscape } from './audio/soundscape.js';
import { GameUI } from './ui/ui.js';
import marketBackgroundUrl from './assets/hauptmarkt-isometric-background.png';
import './styles.css';

const PROFILE_KEY = 'skg-hauptmarkt-profile-v1';

class HauptmarktSlice {
  constructor(app) {
    this.app = app;
    this.engine = null;
    this.starting = false;
    this.audio = new Soundscape(.4);
    this.backgroundReady = this.preloadBackground();
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

  preloadBackground() {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = marketBackgroundUrl;
    });
  }

  async start(profile) {
    if (this.starting) return;
    this.starting = true;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    this.engine?.destroy();
    this.audio.activate();
    this.audio.startMarket();
    try {
      await this.backgroundReady;
      this.engine = new GameEngine(this.ui.elements.canvas, profile, {
        onFrame: (frame) => this.onFrame(frame),
      });
      this.ui.begin(profile, this.engine.world.visitorCount);
    } catch (error) {
      this.ui.showWebGLError(error);
    } finally {
      this.starting = false;
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
