export class GameUI {
  constructor(app, callbacks = {}) {
    this.app = app;
    this.callbacks = callbacks;
    this.profile = { name: 'Johannes', outfit: 'wald', hair: 'dunkel' };
    this.render();
    this.bindEvents();
  }

  render() {
    this.app.innerHTML = `
      <main class="game-shell market-shell">
        <canvas id="game-canvas" aria-label="Spielbarer Hauptmarkt von Trier"></canvas>
        <div class="screen-vignette"></div>
        <section class="boot-screen" id="boot-screen">
          <div class="boot-mark">SKG</div><p>Hauptmarkt wird belebt …</p><div class="loading-line"><i></i></div>
        </section>
        <section class="start-overlay" id="start-overlay" aria-label="Hauptmarkt starten">
          <div class="title-lockup">
            <p class="eyebrow">Freitag · 19:47 · Golden Hour</p>
            <h1>SKG <small>Hauptmarkt · Trier</small></h1>
            <div class="title-meta"><span>⌖ Erkunde frei</span><span>✦ 43 Marktbesucher</span></div>
          </div>
          <div class="creator-card market-start-card">
            <div class="creator-form">
              <p class="eyebrow">Sprint 2.1 · Hauptmarkt Rework</p>
              <h2>Der Trierer Hauptmarkt.</h2>
              <p class="market-intro">Steipe, St. Gangolf, Petrusbrunnen, Weinstand und die farbige Giebelreihe: ein warmer Freitagabend im Herzen von Trier.</p>
              <label for="character-name">Dein Name</label>
              <input id="character-name" maxlength="20" value="Johannes" autocomplete="name" />
              <div class="choice-group"><span>Jacke</span><div class="swatches" data-field="outfit"><button class="swatch active wald" data-value="wald" aria-label="Waldgrüne Jacke"></button><button class="swatch blau" data-value="blau" aria-label="Blaue Jacke"></button><button class="swatch kupfer" data-value="kupfer" aria-label="Kupferfarbene Jacke"></button></div></div>
              <button class="primary-button" id="start-game">Hauptmarkt betreten <span>→</span></button>
              <p class="control-copy">Klick zum Laufen · WASD / Pfeiltasten · Mausrad zum Zoomen</p>
            </div>
          </div>
        </section>
        <section class="market-hud hidden" id="market-hud" aria-label="Hauptmarkt Informationen">
          <aside class="market-card"><p class="eyebrow">Hauptmarkt · Trier</p><h2>Freitag, 19:47</h2><div class="market-rule"></div><p><span class="status-dot"></span>Golden Hour · lebendiger Abend</p></aside>
          <div class="market-location">HAUPTMARKT · TRIER</div>
          <div class="market-visitor" id="visitor-count"><b>43</b><span>Menschen auf dem Platz</span></div>
          <div class="market-player"><i id="avatar-letter">J</i><div><b id="player-name">Johannes</b><span>Stadtrundgang</span></div></div>
          <div class="market-controls"><span>WASD</span><span>bewegen</span><i></i><span>Scroll</span><span>zoomen</span></div>
          <div class="mobile-controls"><div class="joystick" id="joystick" aria-label="Bewegen"><i></i></div></div>
        </section>
      </main>`;
    this.elements = {
      canvas: this.app.querySelector('#game-canvas'),
      boot: this.app.querySelector('#boot-screen'),
      start: this.app.querySelector('#start-overlay'),
      hud: this.app.querySelector('#market-hud'),
      name: this.app.querySelector('#character-name'),
      startButton: this.app.querySelector('#start-game'),
      avatar: this.app.querySelector('#avatar-letter'),
      playerName: this.app.querySelector('#player-name'),
      visitors: this.app.querySelector('#visitor-count'),
      joystick: this.app.querySelector('#joystick'),
    };
  }

  bindEvents() {
    this.app.querySelectorAll('.swatches button').forEach((button) => button.addEventListener('click', () => {
      this.profile[button.parentElement.dataset.field] = button.dataset.value;
      button.parentElement.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
    }));
    this.elements.startButton.addEventListener('click', () => this.callbacks.onStart?.({ ...this.profile, name: this.elements.name.value.trim() || 'Gast' }));
    this.bindJoystick();
  }

  bindJoystick() {
    const joystick = this.elements.joystick;
    let active = false;
    const move = (event) => {
      if (!active) return;
      const point = event.touches ? event.touches[0] : event;
      const rect = joystick.getBoundingClientRect();
      const max = rect.width * .3;
      const dx = point.clientX - (rect.left + rect.width / 2);
      const dy = point.clientY - (rect.top + rect.height / 2);
      const length = Math.hypot(dx, dy) || 1;
      const x = length > max ? (dx / length) * max : dx;
      const y = length > max ? (dy / length) * max : dy;
      joystick.querySelector('i').style.transform = `translate(${x}px, ${y}px)`;
      this.callbacks.onJoystick?.(x / max, y / max);
    };
    const end = () => { active = false; joystick.querySelector('i').style.transform = ''; this.callbacks.onJoystick?.(0, 0); };
    joystick.addEventListener('pointerdown', (event) => { active = true; joystick.setPointerCapture(event.pointerId); move(event); });
    joystick.addEventListener('pointermove', move);
    joystick.addEventListener('pointerup', end);
    joystick.addEventListener('pointercancel', end);
  }

  showStart(saved) {
    this.elements.boot.classList.add('hidden');
    if (saved) {
      this.profile = { ...this.profile, ...saved };
      this.elements.name.value = this.profile.name;
      this.app.querySelectorAll('.swatches button').forEach((button) => button.classList.toggle('active', button.dataset.value === this.profile[button.parentElement.dataset.field]));
    }
  }

  begin(profile, visitors) {
    this.app.querySelector('.market-shell').classList.add('market-play');
    this.elements.start.classList.add('hidden');
    this.elements.hud.classList.remove('hidden');
    this.elements.playerName.textContent = profile.name;
    this.elements.avatar.textContent = profile.name.slice(0, 1).toUpperCase();
    this.updateMarket(visitors);
  }

  updateMarket(visitors) {
    this.elements.visitors.innerHTML = `<b>${visitors}</b><span>Menschen auf dem Platz</span>`;
  }

  showWebGLError() {
    this.elements.boot.classList.add('hidden');
    this.elements.start.innerHTML = '<div class="ending-card"><p class="eyebrow">Leider nicht spielbar</p><h1>WebGL wird benötigt.</h1><p>Öffne SKG in einem aktuellen Browser mit aktivierter Hardwarebeschleunigung.</p></div>';
  }
}
