# Bloomy — Educational Game for Kids Aged 2-5 (MVP Design)

**Date:** 2026-09-04
**Status:** Approved, ready for implementation plan

## 1. Goals & Scope

Bloomy is a simple educational web game for children aged 2-5 that combines entertainment
with vocabulary learning (Vietnamese as primary, English optional via toggle). It runs well
on iPad/phone as a PWA (add to home screen).

**MVP scope (this document):**

- One complete game: **Memory Match (flip cards)**
- One category: **fruit** (8-10 items), real images generated via Pollinations
- English on/off toggle (persisted in localStorage)
- Difficulty selection (presets + slider for number of pairs)
- Basic sound effects (click/success)
- Animated background on the Home screen
- PWA + responsive
- Data-driven architecture, built to extend with more games/categories later

**Out of MVP scope (later phases):**

- Puzzle game, Color-matching game
- 3D with Three.js
- Text-to-speech pronunciation for vocabulary
- Additional categories (animal, color, vegetable...)
- SonarCloud / external code-quality analysis

## 2. Tech Stack

| Component     | Choice                      | Rationale                                                  |
| ------------- | --------------------------- | ---------------------------------------------------------- |
| Build tool    | Vite                        | Fast, simple static-site deploy                            |
| Framework     | React + TypeScript (strict) | Component-based, type-safe                                 |
| Styling       | Tailwind CSS                | Fast to customize, playful tone for kids                   |
| UI components | shadcn/ui (Radix-based)     | Copied into project, no imposed look, easy to customize    |
| Animation     | Framer Motion               | Card flip, celebration effects, smooth animated background |
| PWA           | vite-plugin-pwa             | Add-to-home-screen + offline cache                         |
| Storage       | localStorage                | Only settings + bag state; no backend/database             |
| Deploy        | Vercel free tier            | Static site, free                                          |

**Not using:** backend, database, Next.js (a static app needs no server-side/API routes).

## 3. Code Quality Tooling

- **TypeScript** `strict: true`
- **ESLint** with `typescript-eslint` + React hooks plugin (primary linter — richest
  React/TS rule ecosystem)
- **Prettier** for formatting, minimal config, no conflicts with ESLint
- **Husky + lint-staged**: pre-commit hook runs ESLint + Prettier check on staged files,
  blocks the commit on errors
- **No Sonar**

## 4. Directory Structure

```
src/
  data/         # fruit.ts — data per category
  games/        # memory-match/ (first game)
  components/   # ItemCard, DifficultySelector, LanguageToggle, AnimatedBackground
  context/      # SettingsContext (useSettings hook)
  hooks/        # useSound, useBagRandomizer
public/
  images/fruit/ # optimized WebP images from Pollinations
scripts/
  generate-images.ts  # calls Pollinations, converts to WebP, compresses (run manually)
```

Principle: separate each game into its own folder under `games/`, sharing `ItemCard`,
`useSettings`, and the data layer. Adding a new game (Puzzle/Color-match) = adding one game
folder, without touching existing code.

## 5. Data Model

```ts
interface Item {
  id: string; // "apple"
  vi: string; // "Táo" — displayed large, primary
  en: string; // "Apple" — displayed smaller, shown/hidden via toggle
  category: string; // "fruit"
  image: string; // "/images/fruit/apple.webp"
}
```

MVP: category `fruit`, 8-10 items (apple, banana, orange, watermelon, grape, mango,
pineapple, strawberry, papaya, guava).

## 6. Images (Fluent Emoji 3D Pipeline)

> **Revised 2026-09-05.** Image source evolved through testing: Pollinations AI
> (text-to-image) could not reliably produce correct/recognizable artwork (wrong colors,
> unrecognizable results) → OpenMoji flat SVGs were clean but read as too cartoonish for
> the youngest kids → settled on **Microsoft Fluent Emoji, 3D style** (MIT license):
> rendered, dimensional artwork that is more realistic and easier for toddlers to
> recognize, while staying clean, consistent, and correctly colored. Custom AI/3D artwork
> remains a later-phase option.

Script `scripts/generate-images.ts` (run manually, NOT at build/runtime):

1. Map each item id to a Fluent asset folder (`FLUENT_FOLDER` table in the script)
2. Download the matching Fluent 3D PNG
3. Fit into 512x512 with padding, on a transparent background (the card color shows
   through), using `sharp`
4. Write WebP (quality 90) to `public/images/fruit/`

Result: 10 images, ~164KB total — trivially light to commit and deploy.

Note: `papaya` and `guava` (no matching emoji asset) were swapped for `peach` 🍑 and
`lemon` 🍋 so every item has clean Fluent artwork.

## 7. Game: Memory Match

**Difficulty selection (before starting):**

- Presets: Easy / Medium / Hard
- Slider to customize number of pairs, bounded 3-10 (avoid overwhelming or trivial games)
- Allow pairs-per-round smaller than the pool → each round is a different subset, reducing
  the feeling of repetition

**Anti-repetition (fully client-side, no backend):**

- **Fisher-Yates shuffle** for card positions — every permutation equally likely, no bias,
  no guessable pattern (replaces the biased `sort(() => Math.random() - 0.5)`)
- **Bag randomizer** for item selection order — keep a "bag" of item IDs not yet used in
  the current cycle; each round draws the needed count from the bag; when the bag empties,
  reshuffle the full pool. Persist the remaining IDs to localStorage (a few hundred bytes,
  reset each cycle, does NOT accumulate history). Guarantees the whole pool is used before
  any item repeats.

**Gameplay flow:**

- Randomize items (bag) + positions (Fisher-Yates) each play, no progress/score saved
- Tap a tile → flip (Framer Motion flip animation) + click sound
- Flip two matching tiles → keep them open, small celebration + success sound, show the name
  (vi large, en small if toggle on)
- Flip a mismatch → flip back after ~1s + a distinct soft sound
- Complete all pairs → celebration + play-again button (new random round)

**Sound:** click on flip, success on match. No voice pronunciation yet (later phase).

## 8. Theme & Background

**Primary palette** — bright nature tones, moderate saturation (no harsh neon):

- Sky: light blue → light cyan gradient (`#87CEEB` → `#B3E5FC`)
- Ground/grass: fresh green (`#8BC34A`, `#AED581`)
- Accents (buttons, cards, correct effects): sunny yellow (`#FFD54F`), peach orange
  (`#FFAB91`), flower red (`#EF5350`) — used selectively, not covering the whole screen
- Text/UI: warm earthy brown (`#6D4C41`) instead of pure black, gentler on kids' eyes

**Animated background — ONLY on Home/game-select screen:**

- One static illustrated background (sky, grassy hills, flowers) — generated via the same
  Pollinations/WebP pipeline
- Layered with a few gently moving decorative elements via CSS/Framer Motion: slowly
  drifting clouds, swaying leaves, 1-2 small creatures (butterfly/bird) flying across
  periodically
- Motion is **slow, sparse, minimal** (2-4 elements) to avoid visual clutter
- No heavy GIF/Lottie — only lightweight SVG/images + CSS transforms, keeping performance
  good on older devices

**Inside the game screen (Memory Match):**

- Same palette but a STATIC, much simpler background (sky gradient + a static grass strip at
  the bottom, no moving elements) so the child focuses on the cards

## 9. Responsive & PWA

- Tailwind responsive layout, card grid scales to the screen (phone portrait, iPad
  landscape/portrait)
- `vite-plugin-pwa`: manifest named "Bloomy", bright theme, icon, offline cache for loaded
  images/assets, add-to-home-screen

## 10. Settings (localStorage)

| Key            | Content                                       | Size                                  |
| -------------- | --------------------------------------------- | ------------------------------------- |
| English toggle | boolean, show/hide `en`                       | a few bytes                           |
| Bag state      | array of item IDs unused in the current cycle | a few hundred bytes, reset each cycle |

No score, no game progress, no history saved.
