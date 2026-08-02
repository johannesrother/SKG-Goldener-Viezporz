const STAGES = [
  {
    id: 'johannes',
    name: 'Johannes',
    objective: 'Geh zum Weinstand auf dem Hauptmarkt.',
  },
  {
    id: 'marc',
    name: 'Marc',
    objective: 'Triff Marc am Domfreihof.',
    lines: () => [
      { speaker: 'Marc', text: 'Ich wusste doch, ihr seid wieder später dran als geplant.' },
      { speaker: 'Johannes', text: 'Wir sind pünktlich.' },
      { speaker: 'Marc', text: 'Natürlich.' },
      { speaker: 'Marc', text: 'Hier ist es wenigstens ruhig. Und der Dom sieht bei Sonnenuntergang immer so aus, als hätte er das alles geplant.' },
      { speaker: 'Johannes', text: 'Komm mit. Jürgen hängt bestimmt noch in der Simeonstraße herum.' },
    ],
  },
  {
    id: 'juergen',
    name: 'Jürgen',
    objective: 'Triff Jürgen in der Simeonstraße.',
    lines: () => [
      { speaker: 'Jürgen', text: 'Na? Habt ihr euch verlaufen?' },
      { speaker: 'Marc', text: 'Wir haben nur auf dich gewartet.' },
      { speaker: 'Jürgen', text: 'Das rede ich mir später auch ein.' },
      { speaker: 'Jürgen', text: 'Hier erkennt man die ersten Trier-Besucher sofort. Alle laufen erst mal zur Porta und dann sehr entschlossen in die falsche Richtung.' },
      { speaker: 'Johannes', text: 'Charly ist am Kornmarkt. Falls er nicht gerade wieder jemanden kennt.' },
    ],
  },
  {
    id: 'charly',
    name: 'Charly',
    objective: 'Triff Charly am Kornmarkt.',
    lines: () => [
      { speaker: 'Charly', text: 'Na endlich. Ich dachte, ihr seid direkt im Chrome gelandet.' },
      { speaker: 'Charly', text: 'Ah, hi! Ja, später! Grüß deine Schwester!' },
      { speaker: 'Marc', text: 'Du kennst wirklich jeden, oder?' },
      { speaker: 'Charly', text: 'Nicht jeden. Aber die interessanten Leute erkennt man ja.' },
      { speaker: 'Charly', text: 'Weber sitzt in der Fleischstraße. Der beobachtet bestimmt gerade wieder das Leben und nennt es Recherche.' },
    ],
  },
  {
    id: 'weber',
    name: 'Weber',
    objective: 'Triff Weber in der Fleischstraße.',
    lines: () => [
      { speaker: 'Weber', text: 'Jetzt seid ihr endlich komplett.' },
      { speaker: 'Johannes', text: 'Eigentlich fehlst nur noch du.' },
      { speaker: 'Weber', text: 'Vielleicht.' },
      { speaker: 'Charly', text: 'Das war wieder eine komplette Weber-Antwort.' },
      { speaker: 'Weber', text: 'Dann gehen wir zurück. Ein Abend fängt erst am Weinstand richtig an.' },
    ],
  },
];

const AMBIENT_LINES = {
  hauptmarkt: [
    { requires: 1, speaker: 'Johannes', text: 'Hier ist heute richtig was los. Genau so muss ein Freitag aussehen.' },
    { requires: 3, speaker: 'Jürgen', text: 'Wenn wir hier kurz stehen bleiben, findet uns Trier schon wieder.' },
  ],
  domfreihof: [
    { requires: 2, speaker: 'Marc', text: 'Der Dom sieht heute irgendwie besonders gut aus. Frech eigentlich.' },
    { requires: 2, speaker: 'Johannes', text: 'Wir haben keinen Plan. Aber wir haben einen Dom. Das zählt fast.' },
  ],
  simeonstrasse: [
    { requires: 3, speaker: 'Jürgen', text: 'Da vorne gibt es das beste Eis. Das ist keine Meinung, das ist Orientierung.' },
    { requires: 2, speaker: 'Marc', text: 'Eine Einkaufsstraße, zwei Richtungen und trotzdem stehen alle mitten im Weg. Klassisch.' },
  ],
  kornmarkt: [
    { requires: 4, speaker: 'Charly', text: 'Hier treffen wir später bestimmt noch jemanden. Oder alle auf einmal.' },
    { requires: 3, speaker: 'Jürgen', text: 'Ein Brunnen macht jeden Platz automatisch so, als wäre alles geregelt.' },
  ],
  fleischstrasse: [
    { requires: 5, speaker: 'Weber', text: 'Von hier ist es nicht mehr weit. In Trier ist das eine ziemlich genaue Angabe.' },
    { requires: 4, speaker: 'Johannes', text: 'Wir bleiben zusammen. Das ist die wichtigste Regel vom SKG.' },
  ],
  brotstrasse: [
    { requires: 2, speaker: 'Marc', text: 'Brotstraße. Der Name verspricht viel und löst damit sofort Hunger aus.' },
  ],
};

const RETURN_TO_WINE = {
  objective: 'Geht gemeinsam zurück zum Weinstand am Hauptmarkt.',
  name: 'Weinstand',
};

export class CityStrollQuest {
  constructor({ world, playerName, callbacks = {} }) {
    this.world = world;
    this.playerName = playerName;
    this.callbacks = callbacks;
    this.stageIndex = 0;
    this.mode = 'explore';
    this.talking = false;
    this.finished = false;
    this.promptVisible = false;
    this.nextAmbientAt = Infinity;
    this.quietUntil = 0;
    this.currentTime = 0;
  }

  begin(time = 0) {
    this.setStage(0);
    this.nextAmbientAt = time + 55 + Math.random() * 28;
  }

  get stage() {
    return STAGES[this.stageIndex] || null;
  }

  setStage(index) {
    this.stageIndex = index;
    this.mode = 'explore';
    const stage = this.stage;
    this.world.setQuestTarget(stage.id);
    this.callbacks.onQuestChange?.({ title: 'Der erste SKG', objective: stage.objective, count: `${index + 1}/5`, targetId: stage.id });
    this.callbacks.onPrompt?.(null);
  }

  isNear(target, position, radius = 2.25) {
    const point = target?.position || target;
    if (!point || !position) return false;
    const dx = position.x - point.x;
    const dz = position.z - point.z;
    return dx * dx + dz * dz < radius * radius;
  }

  update(frame) {
    if (this.finished || this.talking) return;
    const position = frame.position;
    this.playerPosition = position;
    this.currentTime = frame.time;
    if (this.mode === 'quiet') {
      if (frame.time >= this.quietUntil) this.startLegend();
      return;
    }
    if (this.mode === 'explore') {
      const stage = this.stage;
      const friend = this.world.questFriends[stage.id];
      this.setPrompt(this.isNear(friend, position) ? `Mit ${stage.name} sprechen` : null);
    } else if (this.mode === 'return') {
      this.setPrompt(this.isNear(this.world.wineStandPoint, position, 3) ? 'Mit der Gruppe am Weinstand zusammensitzen' : null);
    }
    const canChatOnWalk = (this.mode === 'explore' || this.mode === 'return') && this.world.recruitedCount > 0;
    if (canChatOnWalk && frame.time >= this.nextAmbientAt) this.playAmbient(frame);
  }

  setPrompt(label) {
    if (this.promptVisible === label) return;
    this.promptVisible = label;
    this.callbacks.onPrompt?.(label);
  }

  interact(position) {
    if (this.finished || this.talking) return;
    if (this.mode === 'explore') {
      const stage = this.stage;
      const friend = this.world.questFriends[stage.id];
      if (!this.isNear(friend, position)) return;
      this.talking = true;
      this.setPrompt(null);
      if (stage.id === 'johannes') this.startJohannesConversation(stage);
      else this.callbacks.onDialogue?.(stage.lines(this.playerName), () => this.finishStage(stage));
      return;
    }
    if (this.mode === 'return' && this.isNear(this.world.wineStandPoint, position, 3)) this.beginFinale();
  }

  startJohannesConversation(stage) {
    const opening = [
      { speaker: 'Johannes', text: `Da bist du ja, ${this.playerName}.` },
      { speaker: 'Johannes', text: 'Perfektes Timing.' },
      { speaker: 'Johannes', text: 'Eigentlich wollten wir schon los … aber wie immer fehlen noch fast alle.' },
    ];
    this.callbacks.onDialogue?.(opening, () => {
      this.callbacks.onChoice?.({
        speaker: 'Johannes',
        text: 'Was sagst du?',
        choices: [
          { id: 'missing', label: 'Wer fehlt denn?' },
          { id: 'collect', label: 'Dann sammeln wir sie eben ein.' },
          { id: 'viez', label: 'Erst mal einen Viez?' },
        ],
      }, (choice) => {
        const replies = {
          missing: 'Marc, Jürgen, Charly und Weber. Also praktisch alle, die behauptet haben, sie wären gleich da.',
          collect: 'Das ist die richtige Einstellung. Trier ist klein genug, wir finden sie schon.',
          viez: 'Verlockend. Aber wenn wir jetzt anfangen, kommen wir morgen noch nicht am Dom an.',
        };
        this.callbacks.onDialogue?.([
          { speaker: 'Johannes', text: replies[choice] || replies.collect },
          { speaker: 'Johannes', text: 'Komm. Marc wartet bestimmt wieder am Dom.' },
        ], () => this.finishStage(stage, 'Erster gemeinsamer SKG'));
      });
    });
  }

  finishStage(stage, memory = null) {
    this.world.recruitFriend(stage.id, this.playerPosition);
    if (memory) this.callbacks.onMemory?.(memory);
    if (stage.id === 'weber') this.callbacks.onMemory?.('Alle sind da');
    this.callbacks.onProgress?.(false);
    this.talking = false;
    this.nextAmbientAt = (this.currentTime || 0) + 48 + Math.random() * 34;
    if (this.stageIndex < STAGES.length - 1) {
      this.setStage(this.stageIndex + 1);
      return;
    }
    this.mode = 'return';
    this.world.setQuestTarget(null);
    this.callbacks.onQuestChange?.({ title: 'Der erste SKG', objective: RETURN_TO_WINE.objective, count: '5/5', targetId: 'return' });
  }

  playAmbient(frame) {
    const candidates = (AMBIENT_LINES[frame.location?.zone] || []).filter((line) => line.requires <= this.world.recruitedCount);
    this.nextAmbientAt = frame.time + 50 + Math.random() * 40;
    if (!candidates.length || this.talking || this.mode === 'finale') return;
    const line = candidates[Math.floor(Math.random() * candidates.length)];
    this.talking = true;
    this.setPrompt(null);
    this.callbacks.onDialogue?.([{ speaker: line.speaker, text: line.text }], () => { this.talking = false; });
  }

  beginFinale() {
    this.mode = 'finale';
    this.talking = true;
    this.setPrompt(null);
    this.world.seatFriendsAtWine();
    this.callbacks.onWineMoment?.();
    this.callbacks.onDialogue?.([
      { speaker: 'Johannes', text: 'So. Jetzt sind wir wirklich alle da.' },
      { speaker: 'Charly', text: 'Die wichtige Frage: Was trinken wir?' },
    ], () => {
      this.callbacks.onChoice?.({
        speaker: 'Weinstand',
        text: 'Du bestellst:',
        choices: [
          { id: 'viez', label: 'Viez' },
          { id: 'bier', label: 'Bier' },
          { id: 'schorle', label: 'Schorle' },
        ],
      }, (choice) => this.startQuietMoment(choice));
    });
  }

  startQuietMoment(choice) {
    const drinks = { viez: 'Viez. Ehrensache.', bier: 'Ein Bier. Johannes nickt anerkennend.', schorle: 'Eine Schorle. Marc behauptet, das sei vernünftig.' };
    this.callbacks.onDialogue?.([{ speaker: this.playerName, text: drinks[choice] || drinks.viez }], () => {
      this.talking = false;
      this.mode = 'quiet';
      this.quietUntil = (this.currentTime || 0) + 5.5;
      this.callbacks.onQuestChange?.({ title: 'Der erste SKG', objective: 'Genießt für einen Moment den Abend.', count: '5/5', targetId: null });
    });
  }

  startLegend() {
    this.mode = 'legend';
    this.talking = true;
    const legend = [
      { speaker: 'Charly', text: 'Bitte erzähl jetzt nicht schon wieder diese Geschichte.' },
      { speaker: 'Weber', text: 'Warum eigentlich?' },
      { speaker: 'Johannes', text: 'Weil jedes Mal etwas anderes passiert.' },
      { speaker: 'Weber', text: 'Genau deshalb.' },
      { speaker: 'Weber', text: 'Vor vielen Jahren traf sich hier am Weinstand jedes Wochenende dieselbe Gruppe von Freunden.' },
      { speaker: 'Weber', text: 'Sie lachten. Sie tranken. Sie zogen gemeinsam durch Trier.' },
      { speaker: 'Weber', text: 'Eines Abends verschwand einer von ihnen.' },
      { speaker: 'Weber', text: 'Wochen später behaupteten Menschen, sie hätten ihn mit einem goldenen Viezporz durch Trier laufen sehen.' },
      { speaker: 'Weber', text: 'Seitdem erzählt man sich, dass der Goldene Viezporz nur denjenigen erscheint, die als Freunde gemeinsam unterwegs sind.' },
      { speaker: 'Weber', text: 'Und bereit sind, Trier mit anderen Augen zu sehen.' },
      { speaker: 'Weber', text: 'Niemand weiß, ob die Geschichte stimmt. Aber jeder Trierer kennt sie.' },
    ];
    this.callbacks.onDialogue?.(legend, () => this.startCliffhanger());
  }

  startCliffhanger() {
    this.world.revealGoldenLight();
    this.callbacks.onMemory?.('Ein Abend in Trier');
    this.callbacks.onMemory?.('Die Legende vom Goldenen Viezporz');
    this.callbacks.onProgress?.(true);
    this.callbacks.onDialogue?.([
      { speaker: 'Marc', text: 'Klingt logisch.' },
      { speaker: 'Johannes', text: '… habt ihr das gesehen?' },
      { speaker: 'Marc', text: 'Bitte sag, das war nicht nur der Viez.' },
      { speaker: 'Jürgen', text: 'Das war keine Straßenlaterne.' },
      { speaker: 'Weber', text: '… ich habe gehofft, dass wir ihn nie sehen.' },
    ], () => {
      this.finished = true;
      this.callbacks.onCinematic?.(this.world.goldenLightPosition, 5.6);
    });
  }
}
