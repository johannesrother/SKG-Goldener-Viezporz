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
        <canvas id="game-canvas" aria-label="Spielbare Altstadt von Trier"></canvas>
        <div class="screen-vignette"></div>
        <section class="boot-screen" id="boot-screen">
          <div class="boot-mark">SKG</div><p>Hauptmarkt wird belebt …</p><div class="loading-line"><i></i></div>
        </section>
        <section class="start-overlay" id="start-overlay" aria-label="Hauptmarkt starten">
          <div class="title-lockup">
            <p class="eyebrow">Freitag · 19:47 · Golden Hour</p>
            <h1>SKG <small>Porta Nigra · Domfreihof</small></h1>
            <div class="title-meta"><span>⌖ Erkunde frei</span><span>✦ Trierer Altstadt</span></div>
          </div>
          <div class="creator-card market-start-card">
            <div class="creator-form">
              <p class="eyebrow">Sprint 3 · Altstadt-Erweiterung</p>
              <h2>Das Herz von Trier.</h2>
              <p class="market-intro">Von der Porta Nigra über die Simeonstraße zum Hauptmarkt und weiter bis zum Domfreihof.</p>
              <label for="character-name">Dein Name</label>
              <input id="character-name" maxlength="20" value="Johannes" autocomplete="name" />
              <div class="choice-group"><span>Jacke</span><div class="swatches" data-field="outfit"><button class="swatch active wald" data-value="wald" aria-label="Waldgrüne Jacke"></button><button class="swatch blau" data-value="blau" aria-label="Blaue Jacke"></button><button class="swatch kupfer" data-value="kupfer" aria-label="Kupferfarbene Jacke"></button></div></div>
              <button class="primary-button" id="start-game">Trier erkunden <span>→</span></button>
              <p class="control-copy">Klick zum Laufen · WASD / Pfeiltasten · Mausrad zum Zoomen</p>
            </div>
          </div>
        </section>
        <section class="market-hud hidden" id="market-hud" aria-label="Trierer Altstadt Informationen">
          <aside class="market-card"><p class="eyebrow" id="location-kicker">Hauptmarkt · Trier</p><h2>Freitag, 19:47</h2><div class="market-rule"></div><p><span class="status-dot"></span><span id="zone-mood">Golden Hour · lebendiger Abend</span></p></aside>
          <div class="market-location" id="location-name">HAUPTMARKT · TRIER</div>
          <div class="market-visitor" id="visitor-count"><b>43</b><span>Menschen auf dem Platz</span></div>
          <button class="route-mini" id="open-map" aria-label="Stadtkarte öffnen"><b>PORTA</b><i></i><b>SIMEON</b><i></i><b>MARKT</b><i></i><b>DOM</b><em id="map-player">●</em></button>
          <div class="market-player"><i id="avatar-letter">J</i><div><b id="player-name">Johannes</b><span>Stadtrundgang</span></div></div>
          <div class="market-controls"><span>WASD</span><span>bewegen</span><i></i><span>Scroll</span><span>zoomen</span></div>
          <div class="mobile-controls"><div class="joystick" id="joystick" aria-label="Bewegen"><i></i></div></div>
        </section>
        <section class="city-map hidden" id="city-map" aria-label="Stadtkarte Trier">
          <div class="city-map-card">
            <button class="close-city-map" id="close-map" aria-label="Karte schließen">×</button>
            <p class="eyebrow">Trierer Altstadt · Orientierung</p>
            <h2>Dein Rundgang</h2>
            <p class="map-caption">Norden ist oben. Die Karte ist für den Spielweg verdichtet, nicht maßstabsgetreu.</p>
            <svg viewBox="0 0 620 520" role="img" aria-label="Spielkarte von Porta Nigra, Simeonstraße, Hauptmarkt, Sternstraße und Domfreihof">
              <defs><linearGradient id="mapPaper" x1="0" x2="1"><stop stop-color="#21332f"/><stop offset="1" stop-color="#172622"/></linearGradient></defs>
              <rect x="8" y="8" width="604" height="504" rx="18" fill="url(#mapPaper)" stroke="#d6ab58" stroke-opacity=".55"/>
              <path class="map-blocks" d="M115 92h168v82H115zM340 196h155v90H340zM86 340h100v110H86zM279 338h140v118H279zM444 330h112v125H444z"/>
              <path class="map-road main" d="M210 72V348"/><path class="map-road main" d="M210 390H507"/><path class="map-road side" d="M210 390V472M210 390H76"/><path class="map-road side" d="M432 390V294"/>
              <path class="map-road thin" d="M164 148H255M157 250H265M354 241H486M346 443H474"/>
              <circle class="map-place porta" cx="210" cy="66" r="23"/><path class="map-arch" d="M193 74v-16c0-11 15-11 15 0v16m4 0v-16c0-11 15-11 15 0v16"/>
              <circle class="map-place market" cx="210" cy="390" r="52"/><circle class="map-fountain" cx="210" cy="390" r="14"/><path class="map-place dom" d="M487 334v-36h38v36m-30-36v-19m22 19v-19"/>
              <path class="map-route-line" d="M210 88V338M262 390H429M429 390l58-49"/>
              <circle class="map-player-marker" id="map-player-large" cx="210" cy="96" r="9"/>
              <text x="210" y="30" text-anchor="middle" class="map-north">N ↑</text>
              <text x="244" y="71" class="map-label">PORTA NIGRA</text><text x="224" y="220" class="map-label">SIMEONSTRASSE</text>
              <text x="210" y="474" text-anchor="middle" class="map-label">HAUPTMARKT</text><text x="353" y="376" class="map-label">STERNSTRASSE</text>
              <text x="474" y="272" class="map-label">DOMFREIHOF</text><text x="88" y="416" class="map-small-label">JAKOBSTR.</text>
              <text x="144" y="500" class="map-small-label">BROTSTR.</text><text x="244" y="500" class="map-small-label">FLEISCHSTR.</text>
            </svg>
            <div class="map-legend"><span><i class="legend-player"></i>Du bist hier</span><span><i class="legend-route"></i>Spielweg</span></div>
          </div>
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
      map: this.app.querySelector('#city-map'),
      openMap: this.app.querySelector('#open-map'),
      closeMap: this.app.querySelector('#close-map'),
      locationName: this.app.querySelector('#location-name'),
      locationKicker: this.app.querySelector('#location-kicker'),
      zoneMood: this.app.querySelector('#zone-mood'),
      mapPlayer: this.app.querySelector('#map-player'),
      joystick: this.app.querySelector('#joystick'),
    };
  }

  bindEvents() {
    this.app.querySelectorAll('.swatches button').forEach((button) => button.addEventListener('click', () => {
      this.profile[button.parentElement.dataset.field] = button.dataset.value;
      button.parentElement.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
    }));
    this.elements.startButton.addEventListener('click', () => this.callbacks.onStart?.({ ...this.profile, name: this.elements.name.value.trim() || 'Gast' }));
    this.elements.openMap.addEventListener('click', () => this.toggleMap());
    this.elements.closeMap.addEventListener('click', () => this.toggleMap(false));
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyM') this.toggleMap();
      if (event.code === 'Escape') this.toggleMap(false);
    });
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
    this.elements.start.classList.add('hidden');
    this.elements.hud.classList.remove('hidden');
    this.elements.playerName.textContent = profile.name;
    this.elements.avatar.textContent = profile.name.slice(0, 1).toUpperCase();
    this.updateMarket(visitors);
  }

  updateMarket(visitors, location = { name: 'Hauptmarkt', zone: 'hauptmarkt' }) {
    this.elements.visitors.innerHTML = `<b>${visitors}</b><span>Menschen auf dem Platz</span>`;
    const names = { porta: 'PORTA NIGRA · TRIER', simeonstrasse: 'SIMEONSTRASSE · TRIER', hauptmarkt: 'HAUPTMARKT · TRIER', sternstrasse: 'STERNSTRASSE · TRIER', domfreihof: 'DOMFREIHOF · TRIER' };
    const moods = { porta: 'Warme Sonne · Ankommen in Trier', simeonstrasse: 'Einkaufsstraße · Stadt im Abendlicht', hauptmarkt: 'Golden Hour · lebendiger Abend', sternstrasse: 'Warme Gasse · Blick zum Dom', domfreihof: 'Offener Himmel · Domglocken' };
    const progress = { porta: '6%', simeonstrasse: '25%', hauptmarkt: '51%', sternstrasse: '74%', domfreihof: '93%' };
    this.elements.locationName.textContent = names[location.zone] || names.hauptmarkt;
    this.elements.locationKicker.textContent = `${location.name || 'Hauptmarkt'} · Trier`;
    this.elements.zoneMood.textContent = moods[location.zone] || moods.hauptmarkt;
    this.elements.mapPlayer.style.left = progress[location.zone] || progress.hauptmarkt;
    const mapPositions = { porta: ['210', '96'], simeonstrasse: ['210', '232'], hauptmarkt: ['210', '390'], sternstrasse: ['355', '390'], domfreihof: ['487', '334'] };
    const [x, y] = mapPositions[location.zone] || mapPositions.hauptmarkt;
    this.app.querySelector('#map-player-large').setAttribute('cx', x);
    this.app.querySelector('#map-player-large').setAttribute('cy', y);
  }

  toggleMap(force) {
    const open = typeof force === 'boolean' ? force : this.elements.map.classList.contains('hidden');
    this.elements.map.classList.toggle('hidden', !open);
  }

  showWebGLError() {
    this.elements.boot.classList.add('hidden');
    this.elements.start.innerHTML = '<div class="ending-card"><p class="eyebrow">Leider nicht spielbar</p><h1>WebGL wird benötigt.</h1><p>Öffne SKG in einem aktuellen Browser mit aktivierter Hardwarebeschleunigung.</p></div>';
  }
}
