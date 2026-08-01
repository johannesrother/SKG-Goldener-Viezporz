import { GameEngine } from './core/engine.js';
import { Soundscape } from './audio/soundscape.js';
import { OPTIONAL_MEMORIES, getStage } from './data/story.js';
import { clearSave, createFreshSave, loadSave, persist } from './save/save-system.js';
import { GameUI } from './ui/ui.js';
import './styles.css';

class SKGGame {
  constructor(app) {
    this.app = app;
    this.save = null;
    this.engine = null;
    this.lastHudUpdate = 0;
    this.lastPersist = 0;
    this.audio = new Soundscape();
    this.ui = new GameUI(app, {
      onNewGame: (profile) => this.newGame(profile),
      onResume: () => this.resumeGame(),
      onRestart: () => this.restart(),
      onInteract: () => this.interact(),
      onJoystick: (x, y) => this.engine?.setJoystick(x, y),
      onPanel: (type) => this.togglePanel(type),
    });
    this.savedGame = loadSave();
    window.setTimeout(() => this.ui.showStart(this.savedGame), 620);
  }

  newGame(profile) {
    clearSave();
    this.save = createFreshSave(profile);
    this.start();
  }

  resumeGame() {
    this.save = loadSave();
    if (!this.save) return this.ui.showStart(null);
    this.start();
  }

  start() {
    this.audio.activate();
    this.engine?.destroy();
    try {
      this.engine = new GameEngine(this.ui.elements.canvas, this.save.profile, {
        onMove: (position) => this.onMove(position),
        onFrame: () => this.onFrame(),
        onInteract: () => this.interact(),
        onPanel: (type) => this.togglePanel(type),
      });
    } catch (error) {
      this.showWebGLError(error);
      return;
    }
    this.engine.setPosition(this.save.player);
    this.engine.world.setCompanions?.(this.save.companions);
    this.engine.world.updateAtmosphere(this.save.storyStep);
    this.engine.world.setActiveTarget(getStage(this.save.storyStep));
    this.ui.begin(this.save);
    this.updateHud();
    if (this.save.completed) window.setTimeout(() => this.ui.showEnding(), 200);
  }

  showWebGLError() {
    this.ui.elements.boot.classList.add('hidden');
    this.ui.elements.start.innerHTML = `<div class="ending-card"><p class="eyebrow">Leider nicht spielbar</p><h1>WebGL wird benötigt.</h1><p>Öffne SKG in einem aktuellen Browser mit aktivierter Hardwarebeschleunigung und versuche es erneut.</p></div>`;
    this.ui.elements.start.classList.remove('hidden');
  }

  onMove(position) {
    if (!this.save) return;
    this.save.player = position;
    const now = performance.now();
    if (now - this.lastPersist > 650) {
      persist(this.save);
      this.lastPersist = now;
    }
  }

  onFrame() {
    if (!this.save || !this.engine || this.ui.isDialogueOpen() || this.ui.panelOpen()) return;
    const now = performance.now();
    if (now - this.lastHudUpdate < 120) return;
    this.lastHudUpdate = now;
    this.updateHud();
    const stage = getStage(this.save.storyStep);
    const nearStage = stage && this.engine.near(stage.marker);
    const optional = this.engine.world.optionalPoints.find((point) => this.engine.near([point.x, point.z], 1.25) && !this.save.memories.some((memory) => memory.id === point.id));
    if (nearStage) this.ui.showInteraction(`${stage.target} ansprechen`, true);
    else if (optional) this.ui.showInteraction(optional.label, true);
    else this.ui.showInteraction('', false);
  }

  updateHud() {
    const stage = getStage(this.save.storyStep);
    const location = this.engine?.world.getLocation(this.engine.getPosition()).name || 'Hauptmarkt';
    this.ui.update(this.save, stage, location);
  }

  interact() {
    if (this.ui.isDialogueOpen()) {
      this.ui.advanceOrFinishDialogue();
      return;
    }
    if (!this.engine || !this.save || this.ui.panelOpen()) return;
    const stage = getStage(this.save.storyStep);
    if (stage && this.engine.near(stage.marker)) {
      this.engine.setInputEnabled(false);
      this.ui.showInteraction('', false);
      this.ui.startDialogue(stage.lines(this.save.profile.name), stage.choice, () => this.completeStage());
      return;
    }
    const optional = this.engine.world.optionalPoints.find((point) => this.engine.near([point.x, point.z], 1.25) && !this.save.memories.some((memory) => memory.id === point.id));
    if (optional) {
      const memory = OPTIONAL_MEMORIES.find((item) => item.id === optional.id);
      if (memory) {
        this.save.memories.push({ ...memory });
        persist(this.save);
        this.ui.showToast(`Erinnerung erhalten: ${memory.title}`);
        this.audio.progress();
        this.updateHud();
      }
      return;
    }
    this.ui.showToast(stage ? `Folge der Markierung: ${stage.objective}` : 'Die Legende wartet auf ihre Fortsetzung.');
  }

  completeStage() {
    const stage = getStage(this.save.storyStep);
    if (!stage) return;
    if (stage.companion && !this.save.companions.includes(stage.companion)) this.save.companions.push(stage.companion);
    if (stage.memory && !this.save.memories.some((memory) => memory.title === stage.memory.title)) this.save.memories.push({ ...stage.memory });
    if (stage.inventory && !this.save.inventory.some((item) => item.id === stage.inventory.id)) this.save.inventory.push({ ...stage.inventory });
    this.save.storyStep += 1;
    const next = getStage(this.save.storyStep);
    this.save.completed = !next;
    persist(this.save);
    this.engine.world.setCompanions?.(this.save.companions);
    this.engine.world.updateAtmosphere(this.save.storyStep);
    this.engine.world.setActiveTarget(next);
    this.engine.setInputEnabled(true);
    this.audio.progress(!next);
    if (!next) {
      window.setTimeout(() => this.ui.showEnding(), 520);
      return;
    }
    this.updateHud();
    this.ui.showToast(`Neue Erinnerung: ${stage.memory.title}`);
  }

  togglePanel(type) {
    if (!this.save || this.ui.isDialogueOpen()) return;
    const desired = this.ui.panelType === type ? null : type;
    this.ui.showPanel(desired, this.save, getStage(this.save.storyStep));
    this.engine?.setInputEnabled(!desired);
  }

  restart() {
    clearSave();
    window.location.reload();
  }
}

new SKGGame(document.querySelector('#app'));
