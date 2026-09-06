# Bloomy 🌱

A little memory-match game for little friends aged 2-5, built as a vibe-coding side project.

Bloomy is not a commercial product — it's something made for a little one to enjoy
while picking up a few words along the way (fruits, animals, colors...) in Vietnamese,
with English shown as an optional toggle.

## What it does

- **Memory match**: flip cards, find the matching pairs, get a little celebration
  when you win.
- **Categories**: fruit and animal decks today, easy to add more.
- **Mix mode**: combine multiple categories into one round.
- **Difficulty**: pick how many pairs to play with.
- Runs entirely in the browser — no backend, no accounts, no tracking. Installable
  as a PWA so it can live on a home screen like a native app.

## Tech stack

Vite, React 19, TypeScript, Tailwind CSS, Motion (animations), Vitest (tests).
Card artwork comes from free stock photos (Pexels) and open emoji sets, fetched
by small scripts in `scripts/`.

## Getting started

```bash
npm install
npm run dev
```

Other useful scripts:

```bash
npm test              # run the test suite
npm run lint           # lint the code
npm run build           # production build
npm run generate:photos -- <category> [ids...]   # fetch/refresh artwork (needs a Pexels API key, see .env.example)
```

## Project docs

Design notes and the implementation plan live under `docs/superpowers/`, written
while building this with an AI pair-programming workflow.

## License

No specific license — this is a personal, non-commercial project shared for fun.
