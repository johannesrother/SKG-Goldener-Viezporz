# SKG – Auf der Suche nach dem Goldenen Viezporz

Eine browserbasierte, isometrische Cozy-Story-RPG-Vertical-Slice in einer stilisierten Trierer Altstadt.

## Lokal spielen

```bash
npm install
npm run dev
```

## Steuerung

- Klick oder Touch auf den Boden: Figur bewegen
- WASD / Pfeiltasten: Figur bewegen
- E oder Interagieren: nächstes Quest-Ereignis auslösen
- I: Inventar, M: Erinnerungen, Esc: Fenster schließen

Der Fortschritt wird nur im localStorage des jeweiligen Browsers gespeichert.

## Veröffentlichung

Der Workflow in `.github/workflows/deploy.yml` baut das Spiel bei Pushes auf `main` und veröffentlicht es über GitHub Pages. In den Repository-Einstellungen muss als Pages-Quelle **GitHub Actions** ausgewählt werden.
