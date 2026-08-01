const itemDescriptions = {
  viezporz: 'Dein weißer Viezporz. Heute fühlt er sich ein wenig wichtiger an als sonst.',
  bierdeckel: 'Ein Bierdeckel mit einer bemerkenswert ungenauen Wegbeschreibung.',
  notizzettel: '„Folgt dem Licht, nicht dem Lärm.“',
};

const companionIcons = { johannes: 'J', marc: 'M', charly: 'C', weber: 'W' };

export class GameUI {
  constructor(app, callbacks = {}) {
    this.app = app;
    this.callbacks = callbacks;
    this.profile = { name: 'Johannes', outfit: 'wald', hair: 'dunkel' };
    this.dialogue = null;
    this.panelType = null;
    this.toastTimer = null;
    this.render();
    this.bindEvents();
  }

  render() {
    this.app.innerHTML = `
      <main class="game-shell">
        <canvas id="game-canvas" aria-label="Isometrische Spielwelt von Trier"></canvas>
        <div class="screen-vignette"></div>
        <section class="boot-screen" id="boot-screen">
          <div class="boot-mark">SKG</div>
          <p>Die Trierer Altstadt wird vorbereitet …</p>
          <div class="loading-line"><i></i></div>
        </section>

        <section class="start-overlay" id="start-overlay" aria-label="Charakter erstellen">
          <div class="title-lockup">
            <p class="eyebrow">Ein Abend. Eine Legende.</p>
            <h1>SKG <small>Auf der Suche nach dem Goldenen Viezporz</small></h1>
            <div class="title-meta"><span>⌖ Trier · Hauptmarkt</span><span>✦ Golden Hour</span></div>
          </div>
          <div class="creator-card">
            <div class="creator-form">
              <p class="eyebrow">Charakter erstellen</p>
              <h2>Bereit für den SKG?</h2>
              <label for="character-name">Wie heißt du?</label>
              <input id="character-name" maxlength="20" value="Johannes" autocomplete="name" />
              <div class="choice-group">
                <span>Hoodie</span>
                <div class="swatches" data-field="outfit">
                  <button class="swatch active wald" data-value="wald" aria-label="Waldgrüner Hoodie"></button>
                  <button class="swatch blau" data-value="blau" aria-label="Blauer Hoodie"></button>
                  <button class="swatch kupfer" data-value="kupfer" aria-label="Kupferfarbener Hoodie"></button>
                </div>
              </div>
              <div class="choice-group">
                <span>Haare</span>
                <div class="swatches" data-field="hair">
                  <button class="swatch dunkel active" data-value="dunkel" aria-label="Dunkle Haare"></button>
                  <button class="swatch braun" data-value="braun" aria-label="Braune Haare"></button>
                  <button class="swatch hell" data-value="hell" aria-label="Helle Haare"></button>
                </div>
              </div>
              <button class="primary-button" id="start-game">Abenteuer starten <span>→</span></button>
              <button class="text-button hidden" id="resume-game">Fortsetzen</button>
            </div>
          </div>
          <p class="start-hint">Kein Kampf, kein Zeitdruck. Nur Freunde, Trier und ein ziemlich verdächtiger Viezporz.</p>
        </section>

        <section class="hud hidden" id="hud">
          <aside class="quest-card">
            <div class="quest-heading"><span>✦</span><b>Aufgabe</b></div>
            <p id="quest-title">Der erste SKG</p>
            <div class="quest-rule"></div>
            <p class="quest-objective" id="quest-objective"></p>
          </aside>
          <div class="location-pill" id="location-pill">Hauptmarkt · Trier</div>
          <div class="minimap" aria-label="Übersichtskarte">
            <span class="map-river">MOSEL</span>
            <i class="map-route"></i>
            <b class="map-player">●</b>
            <em id="map-target">✦</em>
          </div>
          <button class="interaction-prompt hidden" id="interact-button"><kbd>E</kbd><span>Johannes ansprechen</span></button>

          <div class="player-card">
            <div class="small-portrait"><i id="avatar-letter">J</i></div>
            <div><b id="player-name">Johannes</b><span>Stimmung: <em>Großartig</em></span></div>
            <div class="mood-bar"><i></i></div>
          </div>
          <div class="quick-inventory" id="quick-inventory"></div>
          <nav class="bottom-menu" aria-label="Spielmenü">
            <button data-panel="map"><span>⌖</span>Karte</button>
            <button data-panel="inventory"><span>☕</span>Inventar</button>
            <button data-panel="memories"><span>✦</span>Erinnerungen</button>
            <button data-panel="group"><span>♟</span>Freunde</button>
          </nav>
          <div class="mobile-controls">
            <div class="joystick" id="joystick" aria-label="Bewegen"><i></i></div>
            <button class="mobile-action" id="mobile-interact">✦</button>
          </div>
        </section>

        <section class="dialogue-layer hidden" id="dialogue-layer" aria-live="polite">
          <div class="dialogue-card">
            <div class="dialogue-portrait"><i id="dialogue-initial">J</i></div>
            <div class="dialogue-copy">
              <b id="dialogue-speaker">Johannes</b>
              <p id="dialogue-text"></p>
              <button class="dialogue-next" id="dialogue-next">Weiter <span>→</span></button>
              <button class="dialogue-choice hidden" id="dialogue-choice"></button>
            </div>
          </div>
        </section>

        <section class="panel-layer hidden" id="panel-layer" aria-label="Spielinformationen">
          <div class="book-panel">
            <button class="close-panel" id="close-panel" aria-label="Schließen">×</button>
            <p class="eyebrow" id="panel-kicker">Inventar</p>
            <h2 id="panel-title">Kleine Dinge, große Geschichten</h2>
            <div id="panel-content" class="panel-content"></div>
          </div>
        </section>
        <div class="toast hidden" id="toast"></div>
      </main>`;

    this.elements = {
      canvas: this.app.querySelector('#game-canvas'),
      boot: this.app.querySelector('#boot-screen'),
      start: this.app.querySelector('#start-overlay'),
      hud: this.app.querySelector('#hud'),
      name: this.app.querySelector('#character-name'),
      startButton: this.app.querySelector('#start-game'),
      resumeButton: this.app.querySelector('#resume-game'),
      preview: this.app.querySelector('#creator-preview'),
      questTitle: this.app.querySelector('#quest-title'),
      questObjective: this.app.querySelector('#quest-objective'),
      location: this.app.querySelector('#location-pill'),
      playerName: this.app.querySelector('#player-name'),
      avatar: this.app.querySelector('#avatar-letter'),
      quickInventory: this.app.querySelector('#quick-inventory'),
      interaction: this.app.querySelector('#interact-button'),
      mapTarget: this.app.querySelector('#map-target'),
      dialogueLayer: this.app.querySelector('#dialogue-layer'),
      dialogueInitial: this.app.querySelector('#dialogue-initial'),
      dialogueSpeaker: this.app.querySelector('#dialogue-speaker'),
      dialogueText: this.app.querySelector('#dialogue-text'),
      dialogueNext: this.app.querySelector('#dialogue-next'),
      dialogueChoice: this.app.querySelector('#dialogue-choice'),
      panelLayer: this.app.querySelector('#panel-layer'),
      panelKicker: this.app.querySelector('#panel-kicker'),
      panelTitle: this.app.querySelector('#panel-title'),
      panelContent: this.app.querySelector('#panel-content'),
      toast: this.app.querySelector('#toast'),
      joystick: this.app.querySelector('#joystick'),
    };
  }

  bindEvents() {
    this.app.querySelectorAll('.swatches button').forEach((button) => {
      button.addEventListener('click', () => {
        const field = button.parentElement.dataset.field;
        this.profile[field] = button.dataset.value;
        button.parentElement.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
        this.refreshPreview();
      });
    });
    this.elements.startButton.addEventListener('click', () => this.callbacks.onNewGame?.(this.readProfile()));
    this.elements.resumeButton.addEventListener('click', () => this.callbacks.onResume?.());
    this.elements.interaction.addEventListener('click', () => this.callbacks.onInteract?.());
    this.app.querySelector('#mobile-interact').addEventListener('click', () => this.callbacks.onInteract?.());
    this.app.querySelectorAll('.bottom-menu button').forEach((button) => button.addEventListener('click', () => this.callbacks.onPanel?.(button.dataset.panel)));
    this.app.querySelector('#close-panel').addEventListener('click', () => this.callbacks.onPanel?.(null));
    this.elements.dialogueNext.addEventListener('click', () => this.advanceDialogue());
    this.elements.dialogueChoice.addEventListener('click', () => this.finishDialogue());
    this.bindJoystick();
  }

  bindJoystick() {
    const joystick = this.elements.joystick;
    let active = false;
    const update = (event) => {
      if (!active) return;
      const point = event.touches ? event.touches[0] : event;
      const rect = joystick.getBoundingClientRect();
      const dx = point.clientX - (rect.left + rect.width / 2);
      const dy = point.clientY - (rect.top + rect.height / 2);
      const max = rect.width * 0.3;
      const length = Math.hypot(dx, dy) || 1;
      const x = length > max ? (dx / length) * max : dx;
      const y = length > max ? (dy / length) * max : dy;
      joystick.querySelector('i').style.transform = `translate(${x}px, ${y}px)`;
      this.callbacks.onJoystick?.(x / max, y / max);
    };
    const end = () => {
      active = false;
      joystick.querySelector('i').style.transform = '';
      this.callbacks.onJoystick?.(0, 0);
    };
    joystick.addEventListener('pointerdown', (event) => { active = true; joystick.setPointerCapture(event.pointerId); update(event); });
    joystick.addEventListener('pointermove', update);
    joystick.addEventListener('pointerup', end);
    joystick.addEventListener('pointercancel', end);
  }

  refreshPreview() {
    if (!this.elements.preview) return;
    this.elements.preview.dataset.outfit = this.profile.outfit;
    this.elements.preview.dataset.hair = this.profile.hair;
  }

  readProfile() {
    return { ...this.profile, name: this.elements.name.value.trim() || 'Gast' };
  }

  showStart(saved) {
    this.elements.boot.classList.add('hidden');
    this.elements.start.classList.remove('hidden');
    this.elements.resumeButton.classList.toggle('hidden', !saved);
    if (saved) {
      this.elements.name.value = saved.profile.name;
      this.profile = { ...saved.profile };
      this.refreshPreview();
    }
  }

  begin(save) {
    this.elements.start.classList.add('hidden');
    this.elements.hud.classList.remove('hidden');
    this.update(save, null, 'Hauptmarkt');
  }

  update(save, stage, location) {
    this.elements.playerName.textContent = save.profile.name;
    this.elements.avatar.textContent = save.profile.name.slice(0, 1).toUpperCase();
    this.elements.location.textContent = `${location} · Trier`;
    if (stage) {
      this.elements.questTitle.textContent = stage.quest;
      this.elements.questObjective.textContent = stage.objective;
      this.elements.mapTarget.style.left = `${Math.max(10, Math.min(88, ((stage.marker[0] + 20) / 45) * 100))}%`;
    } else {
      this.elements.questTitle.textContent = 'Die Legende geht weiter';
      this.elements.questObjective.textContent = 'Band 1 endet hier — dein Spielstand bleibt erhalten.';
    }
    this.elements.quickInventory.innerHTML = save.inventory.length
      ? save.inventory.map((item) => `<button title="${item.label}" data-item="${item.id}"><b>${item.icon}</b><span>${item.label}</span></button>`).join('')
      : '<span class="empty-quick">Noch keine Erinnerungsstücke</span>';
    this.elements.quickInventory.querySelectorAll('[data-item]').forEach((button) => button.addEventListener('click', () => this.callbacks.onPanel?.('inventory')));
  }

  showInteraction(label, visible) {
    this.elements.interaction.classList.toggle('hidden', !visible);
    this.elements.interaction.querySelector('span').textContent = label;
  }

  startDialogue(lines, choice, onFinish) {
    this.dialogue = { lines, choice, index: 0, onFinish };
    this.elements.dialogueLayer.classList.remove('hidden');
    this.renderDialogueLine();
  }

  renderDialogueLine() {
    const entry = this.dialogue.lines[this.dialogue.index];
    const narrator = entry.speaker === 'Erzähler';
    this.elements.dialogueInitial.textContent = narrator ? '✦' : entry.speaker.slice(0, 1);
    this.elements.dialogueSpeaker.textContent = entry.speaker;
    this.elements.dialogueText.textContent = entry.text;
    this.elements.dialogueNext.classList.toggle('hidden', this.dialogue.index === this.dialogue.lines.length - 1);
    this.elements.dialogueChoice.classList.toggle('hidden', this.dialogue.index !== this.dialogue.lines.length - 1);
    this.elements.dialogueChoice.textContent = this.dialogue.choice;
  }

  advanceDialogue() {
    if (!this.dialogue || this.dialogue.index >= this.dialogue.lines.length - 1) return;
    this.dialogue.index += 1;
    this.renderDialogueLine();
  }

  advanceOrFinishDialogue() {
    if (!this.dialogue) return;
    if (this.dialogue.index === this.dialogue.lines.length - 1) this.finishDialogue();
    else this.advanceDialogue();
  }

  finishDialogue() {
    const complete = this.dialogue?.onFinish;
    this.dialogue = null;
    this.elements.dialogueLayer.classList.add('hidden');
    complete?.();
  }

  isDialogueOpen() {
    return Boolean(this.dialogue);
  }

  showPanel(type, save, stage) {
    this.panelType = type;
    if (!type) {
      this.elements.panelLayer.classList.add('hidden');
      return;
    }
    const panels = {
      inventory: {
        kicker: 'Inventar', title: 'Kleine Dinge, große Geschichten', content: this.inventoryMarkup(save),
      },
      memories: {
        kicker: 'Erinnerungen', title: 'Ein Abend in Trier', content: this.memoriesMarkup(save),
      },
      group: {
        kicker: 'Freundesgruppe', title: 'Gemeinsam unterwegs', content: this.groupMarkup(save),
      },
      map: {
        kicker: 'Stadtkarte', title: 'Der erste SKG', content: this.mapMarkup(stage),
      },
    };
    const panel = panels[type];
    this.elements.panelKicker.textContent = panel.kicker;
    this.elements.panelTitle.textContent = panel.title;
    this.elements.panelContent.innerHTML = panel.content;
    this.elements.panelLayer.classList.remove('hidden');
  }

  inventoryMarkup(save) {
    if (!save.inventory.length) return '<p class="empty-panel">Auf deinem SKG wird sich bald etwas Wichtiges finden.</p>';
    return `<div class="collection-grid">${save.inventory.map((item) => `<article class="collection-item"><b>${item.icon}</b><h3>${item.label}</h3><p>${item.text || itemDescriptions[item.id] || ''}</p></article>`).join('')}</div>`;
  }

  memoriesMarkup(save) {
    if (!save.memories.length) return '<p class="empty-panel">Die besten Erinnerungen beginnen gerade erst.</p>';
    return `<ol class="memory-list">${save.memories.map((memory, index) => `<li><i>${String(index + 1).padStart(2, '0')}</i><div><h3>${memory.title}</h3><p>${memory.text}</p></div></li>`).join('')}</ol>`;
  }

  groupMarkup(save) {
    const all = ['johannes', 'marc', 'charly', 'weber'];
    return `<div class="friend-grid">${all.map((id) => {
      const joined = save.companions.includes(id);
      const names = { johannes: 'Johannes', marc: 'Marc', charly: 'Charly', weber: 'Weber' };
      const roles = { johannes: 'Organisator', marc: 'Realist', charly: 'Stadtkenner', weber: 'Geschichtenerzähler' };
      return `<article class="friend ${joined ? 'joined' : ''}"><b>${companionIcons[id]}</b><div><h3>${names[id]}</h3><p>${joined ? roles[id] : 'Noch nicht getroffen'}</p></div><i>${joined ? '✓' : '·'}</i></article>`;
    }).join('')}</div>`;
  }

  mapMarkup(stage) {
    const places = ['Hauptmarkt', 'Domfreihof', 'Liebfrauenstraße', 'Kornmarkt', 'Seitengasse'];
    return `<div class="map-panel"><div class="map-art"><span>MOSEL</span><i></i><b>●</b><em>✦</em></div><div class="route-list">${places.map((place) => `<p class="${stage?.location === place ? 'active' : ''}"><span>${stage?.location === place ? '✦' : '○'}</span>${place}</p>`).join('')}</div></div>`;
  }

  panelOpen() { return Boolean(this.panelType); }

  showToast(message) {
    clearTimeout(this.toastTimer);
    this.elements.toast.textContent = message;
    this.elements.toast.classList.remove('hidden');
    this.toastTimer = setTimeout(() => this.elements.toast.classList.add('hidden'), 3000);
  }

  showEnding() {
    this.elements.hud.classList.add('hidden');
    this.elements.start.innerHTML = `<div class="ending-card"><p class="eyebrow">Band 1 · Ende der Demo</p><h1>Das goldene Licht<br />kennt deinen Namen.</h1><p>Der erste SKG ist vorbei. Aber die Legende des Goldenen Viezporz hat gerade erst begonnen.</p><button class="primary-button" id="play-again">Noch einmal durch Trier <span>↻</span></button></div>`;
    this.elements.start.classList.remove('hidden');
    this.app.querySelector('#play-again').addEventListener('click', () => this.callbacks.onRestart?.());
  }
}
