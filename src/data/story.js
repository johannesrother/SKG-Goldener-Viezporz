export const LOCATIONS = [
  { id: 'hauptmarkt', name: 'Hauptmarkt', range: [-20, -5] },
  { id: 'domfreihof', name: 'Domfreihof', range: [-5, 4.5] },
  { id: 'liebfrauen', name: 'Liebfrauenstraße', range: [4.5, 11] },
  { id: 'kornmarkt', name: 'Kornmarkt', range: [11, 18] },
  { id: 'seitengasse', name: 'Seitengasse', range: [18, 25] },
];

export const CHARACTERS = {
  johannes: { name: 'Johannes', color: '#536f3d', hair: '#2b1d17', role: 'Organisator' },
  marc: { name: 'Marc', color: '#33475d', hair: '#251914', role: 'Realist' },
  charly: { name: 'Charly', color: '#b17635', hair: '#4d2e1d', role: 'Stadtkenner' },
  weber: { name: 'Weber', color: '#60463c', hair: '#82705a', role: 'Geschichtenerzähler' },
};

export const STORY_STAGES = [
  {
    id: 'johannes',
    location: 'Hauptmarkt',
    target: 'Johannes',
    marker: [-12, 0.8],
    quest: 'Der erste SKG',
    objective: 'Triff Johannes am Weinstand.',
    companion: 'johannes',
    memory: { title: 'Erster Viez am Weinstand', text: 'Der Abend beginnt zwischen Kopfsteinpflaster und warmen Lichtern.' },
    inventory: { id: 'viezporz', icon: '☕', label: 'Viezporz', text: 'Dein treuer Porz für den Stadtkontrollgang.' },
    lines: (name) => [
      { speaker: 'Johannes', text: `Da bist du ja, ${name}! Bereit für einen kleinen SKG durch Trier?` },
      { speaker: 'Johannes', text: 'Marc wartet schon am Domfreihof. Und keine Sorge: Heute wird nur kontrolliert, nicht gekämpft.' },
    ],
    choice: 'Los geht’s zum Domfreihof',
  },
  {
    id: 'marc',
    location: 'Domfreihof',
    target: 'Marc',
    marker: [-0.8, 0.9],
    quest: 'Der erste SKG',
    objective: 'Triff Marc am Domfreihof.',
    companion: 'marc',
    memory: { title: 'Glocken über dem Domfreihof', text: 'Marc findet, der Dom sehe im Abendlicht verdächtig fotogen aus.' },
    lines: () => [
      { speaker: 'Marc', text: 'Ah, die Kontrolle ist endlich vollständig. Hat Johannes schon eine Route erfunden, die garantiert an einem Weinstand vorbeiführt?' },
      { speaker: 'Johannes', text: 'Das ist keine Route. Das ist Kultur.' },
      { speaker: 'Marc', text: 'Dann fehlt uns nur noch Charly. Der kennt vermutlich sogar die Tauben persönlich.' },
    ],
    choice: 'Charly suchen',
  },
  {
    id: 'charly',
    location: 'Liebfrauenstraße',
    target: 'Charly',
    marker: [7.8, -0.6],
    quest: 'Der erste SKG',
    objective: 'Finde Charly in der Liebfrauenstraße.',
    companion: 'charly',
    memory: { title: 'Ein Lied in der Liebfrauenstraße', text: 'Zwischen Café-Tischen und Straßenmusik findet die Gruppe zusammen.' },
    inventory: { id: 'bierdeckel', icon: '◉', label: 'Bierdeckel', text: 'Charlys viel zu ernst gemeinte Wegnotiz.' },
    lines: () => [
      { speaker: 'Charly', text: 'Ihr seid spät! Ich habe schon mit dem Musiker diskutiert, ob Trier ein Lied in Moll oder Dur wäre.' },
      { speaker: 'Marc', text: 'Und?'},
      { speaker: 'Charly', text: 'Er sagte: Hauptsache, jemand bringt einen Viezporz mit.' },
      { speaker: 'Johannes', text: 'Dann auf zum Kornmarkt. Weber wollte dort von einer Sache erzählen.' },
    ],
    choice: 'Weiter zum Kornmarkt',
  },
  {
    id: 'weber',
    location: 'Kornmarkt',
    target: 'Weber',
    marker: [14.6, 0.8],
    quest: 'Der erste SKG',
    objective: 'Sprich mit Weber am Brunnen.',
    companion: 'weber',
    memory: { title: 'Die Legende beginnt', text: 'Weber schwört, in einer Gasse ein goldenes Leuchten gesehen zu haben.' },
    inventory: { id: 'notizzettel', icon: '✦', label: 'Notizzettel', text: '„Folgt dem Licht, nicht dem Lärm.“' },
    lines: () => [
      { speaker: 'Weber', text: 'Ich hab ihn gesehen. Einen Viezporz, der nicht nur weiß war — sondern golden geleuchtet hat.' },
      { speaker: 'Marc', text: 'Ein goldener Viezporz. Natürlich. Und er hat wahrscheinlich auch die Rechnung bezahlt?' },
      { speaker: 'Weber', text: 'Lacht ruhig. Das Licht kam aus der Seitengasse. Es wirkte, als würde es auf jemanden warten.' },
    ],
    choice: 'Dem goldenen Licht folgen',
  },
  {
    id: 'light',
    location: 'Seitengasse',
    target: 'das goldene Leuchten',
    marker: [21.6, 0],
    quest: 'Der Goldene Viezporz',
    objective: 'Folge dem geheimnisvollen Leuchten.',
    companion: null,
    memory: { title: 'Das goldene Leuchten', text: 'Etwas Unerklärliches wartet in den alten Gassen von Trier.' },
    lines: () => [
      { speaker: 'Erzähler', text: 'Für einen Atemzug wird die Gasse hell wie Gold. Auf dem Pflaster zeichnet sich der Schatten eines Porz ab.' },
      { speaker: 'Charly', text: 'Also … ich finde, das ist mindestens einen zweiten Stadtkontrollgang wert.' },
      { speaker: 'Weber', text: 'Die Legende hat gerade erst angefangen.' },
    ],
    choice: 'Band 1 fortsetzen',
  },
];

export const OPTIONAL_MEMORIES = [
  { id: 'street-music', title: 'Ein Lied für Trier', text: 'Du bleibst einen Moment bei der Straßenmusik stehen.' },
  { id: 'sign', title: 'Ein Blick auf den Stadtplan', text: 'Die verwinkelte Altstadt wirkt plötzlich wie ein Abenteuerplan.' },
];

export function getStage(index) {
  return STORY_STAGES[index] ?? null;
}

export function getLocationAt(x) {
  return LOCATIONS.find((location) => x >= location.range[0] && x < location.range[1]) ?? LOCATIONS.at(-1);
}
