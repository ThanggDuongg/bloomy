# Bloomy MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side educational Memory Match game for kids aged 2-5 (Vietnamese primary, English optional), running as a responsive PWA.

**Architecture:** A data-driven React SPA. Pure game logic (shuffle, bag randomizer, deck building) lives in tested utilities decoupled from UI. Screens (Home, Game) compose shared components (ItemCard, DifficultySelector, LanguageToggle). Settings and bag state persist in localStorage; no backend. Images are pre-generated once by a standalone Node script.

**Tech Stack:** Vite, React 19, TypeScript (strict), Tailwind CSS v4, Radix UI primitives (shadcn-style), Motion (`motion/react`, the successor to framer-motion), Vitest + React Testing Library, vite-plugin-pwa, ESLint, Prettier, Husky, lint-staged, sharp (script only).

## Global Constraints

- Install the **latest stable** version of every dependency (do not pin to old majors). `npm install <pkg>` without a version fetches latest; after install, verify the app builds/tests against those versions and adapt any API changes.
- Node.js >= 20 (required by current Vite / Tailwind v4 tooling; use an active LTS).
- TypeScript `strict: true` — no `any` without explicit justification.
- All source code, comments, identifiers, and docs in **English**.
- No backend, no database, no network calls at runtime — only localStorage.
- App display name is exactly **"Bloomy"** (manifest, title, headings).
- Randomness helpers must accept an injectable `rng: () => number` (default `Math.random`) so they are deterministically testable.
- Palette (use as Tailwind theme tokens): sky `#87CEEB`→`#B3E5FC`, grass `#8BC34A`/`#AED581`, accents yellow `#FFD54F` / peach `#FFAB91` / red `#EF5350`, text brown `#6D4C41`.
- Every code change ends with a passing `npm run lint` and `npm test`.
- Note: git is intentionally NOT initialized yet (user is switching git accounts). Where steps say "Commit", stage the files but SKIP the actual `git commit` until the user initializes git; instead run `npm run lint && npm test` as the task gate. Once git exists, resume normal commits.

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**

- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

**Interfaces:**

- Produces: a runnable Vite dev server (`npm run dev`) rendering an `App` component. Later tasks mount screens inside `App`.

- [ ] **Step 1: Scaffold with the Vite react-ts template into the current directory**

Run:

```bash
npm create vite@latest . -- --template react-ts
```

If prompted about a non-empty directory, choose "Ignore files and continue" (the `docs/` folder must be preserved).

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

- [ ] **Step 3: Replace `src/App.tsx` with a minimal placeholder**

```tsx
export default function App() {
  return <h1>Bloomy</h1>;
}
```

- [ ] **Step 4: Set the document title in `index.html`**

Change the `<title>` element to:

```html
<title>Bloomy</title>
```

- [ ] **Step 5: Run the dev server and verify it renders**

Run: `npm run dev`
Expected: server starts; opening the URL shows the "Bloomy" heading. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TypeScript project"
```

(Per Global Constraints: if git is not initialized yet, skip the commit and instead confirm `npm run dev` works.)

---

### Task 2: Testing setup (Vitest + React Testing Library)

**Files:**

- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/App.test.tsx`
- Modify: `package.json` (scripts)

**Interfaces:**

- Produces: `npm test` (single run) and `npm run test:watch`. Later tasks add `*.test.ts(x)` files discovered by Vitest.

- [ ] **Step 1: Install test dependencies**

Run:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

- [ ] **Step 3: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Add scripts to `package.json`**

Add to the `"scripts"` object:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write a smoke test `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Bloomy heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Bloomy' })).toBeInTheDocument();
});
```

- [ ] **Step 6: Run the test and verify it passes**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: add Vitest and React Testing Library setup"
```

---

### Task 3: Code quality tooling (ESLint, Prettier, Husky, lint-staged)

**Files:**

- Create: `.prettierrc.json`, `.prettierignore`, `.husky/pre-commit`
- Modify: `package.json` (scripts, lint-staged config), `eslint.config.js` (from Vite template)

**Interfaces:**

- Produces: `npm run lint`, `npm run format`. A pre-commit hook runs lint-staged.

- [ ] **Step 1: Install tooling**

Run:

```bash
npm install -D prettier eslint-config-prettier eslint-plugin-react-hooks husky lint-staged
```

- [ ] **Step 2: Create `.prettierrc.json`**

```json
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

- [ ] **Step 3: Create `.prettierignore`**

```
dist
node_modules
public/images
```

- [ ] **Step 4: Ensure `eslint.config.js` extends prettier (disable conflicting rules)**

Add `eslintConfigPrettier` as the LAST entry in the exported config array of `eslint.config.js`:

```js
import eslintConfigPrettier from 'eslint-config-prettier';
// ...inside the exported array, as the final element:
eslintConfigPrettier,
```

- [ ] **Step 5: Add scripts and lint-staged config to `package.json`**

Add to `"scripts"`:

```json
"lint": "eslint .",
"format": "prettier --write ."
```

Add a top-level `"lint-staged"` key:

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

- [ ] **Step 6: Initialize Husky and add the pre-commit hook**

Run:

```bash
npx husky init
```

Then set `.husky/pre-commit` contents to:

```sh
npx lint-staged
```

- [ ] **Step 7: Verify lint and format run clean**

Run: `npm run format && npm run lint`
Expected: format rewrites files as needed; lint exits 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: add ESLint, Prettier, Husky, lint-staged"
```

---

### Task 4: Tailwind CSS v4 + theme palette

**Files:**

- Create: `src/index.css` (replace default), `src/theme.css`
- Modify: `vite.config.ts`, `src/main.tsx` (import css)

**Interfaces:**

- Produces: Tailwind utilities available app-wide; custom color tokens `sky-soft`, `sky-deep`, `grass`, `grass-soft`, `sunny`, `peach`, `flower`, `earth` usable as `bg-*`/`text-*`.

- [ ] **Step 1: Install Tailwind v4 Vite plugin**

Run:

```bash
npm install tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Register the plugin in `vite.config.ts`**

Add the import and include it in `plugins`:

```ts
import tailwindcss from '@tailwindcss/vite';
// plugins: [react(), tailwindcss()]
```

- [ ] **Step 3: Create `src/index.css`**

```css
@import 'tailwindcss';
@import './theme.css';

body {
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}
```

- [ ] **Step 4: Create `src/theme.css` with the palette tokens**

```css
@theme {
  --color-sky-soft: #b3e5fc;
  --color-sky-deep: #87ceeb;
  --color-grass: #8bc34a;
  --color-grass-soft: #aed581;
  --color-sunny: #ffd54f;
  --color-peach: #ffab91;
  --color-flower: #ef5350;
  --color-earth: #6d4c41;
}
```

- [ ] **Step 5: Import the stylesheet in `src/main.tsx`**

Ensure this import exists (replace any default `./index.css` import):

```ts
import './index.css';
```

- [ ] **Step 6: Verify a themed utility renders**

Temporarily set `App.tsx` heading to `<h1 className="text-flower">Bloomy</h1>`, run `npm run dev`, confirm the heading is red `#EF5350`, then revert the className.

- [ ] **Step 7: Run tests to confirm nothing broke**

Run: `npm test`
Expected: existing smoke test still passes.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind v4 with Bloomy theme palette"
```

---

### Task 5: Data model and fruit category data

**Files:**

- Create: `src/data/types.ts`, `src/data/fruit.ts`, `src/data/index.ts`, `src/data/fruit.test.ts`

**Interfaces:**

- Produces:
  - `interface Item { id: string; vi: string; en: string; category: string; image: string; }`
  - `const fruit: Item[]`
  - `const categories: Record<string, Item[]>` and `getCategory(name: string): Item[]`

- [ ] **Step 1: Write the failing test `src/data/fruit.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fruit } from './fruit';

describe('fruit data', () => {
  it('has 8-10 items', () => {
    expect(fruit.length).toBeGreaterThanOrEqual(8);
    expect(fruit.length).toBeLessThanOrEqual(10);
  });

  it('has unique ids', () => {
    const ids = fruit.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item has vi, en and a webp image path in the fruit folder', () => {
    for (const item of fruit) {
      expect(item.vi.length).toBeGreaterThan(0);
      expect(item.en.length).toBeGreaterThan(0);
      expect(item.category).toBe('fruit');
      expect(item.image).toMatch(/^\/images\/fruit\/.+\.webp$/);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- fruit`
Expected: FAIL (cannot find `./fruit`).

- [ ] **Step 3: Create `src/data/types.ts`**

```ts
export interface Item {
  id: string;
  vi: string;
  en: string;
  category: string;
  image: string;
}
```

- [ ] **Step 4: Create `src/data/fruit.ts`**

```ts
import type { Item } from './types';

const make = (id: string, vi: string, en: string): Item => ({
  id,
  vi,
  en,
  category: 'fruit',
  image: `/images/fruit/${id}.webp`,
});

export const fruit: Item[] = [
  make('apple', 'Táo', 'Apple'),
  make('banana', 'Chuối', 'Banana'),
  make('orange', 'Cam', 'Orange'),
  make('watermelon', 'Dưa hấu', 'Watermelon'),
  make('grape', 'Nho', 'Grape'),
  make('mango', 'Xoài', 'Mango'),
  make('pineapple', 'Dứa', 'Pineapple'),
  make('strawberry', 'Dâu', 'Strawberry'),
  make('papaya', 'Đu đủ', 'Papaya'),
  make('guava', 'Ổi', 'Guava'),
];
```

- [ ] **Step 5: Create `src/data/index.ts`**

```ts
import type { Item } from './types';
import { fruit } from './fruit';

export type { Item };
export const categories: Record<string, Item[]> = { fruit };

export function getCategory(name: string): Item[] {
  const items = categories[name];
  if (!items) throw new Error(`Unknown category: ${name}`);
  return items;
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- fruit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Item data model and fruit category"
```

---

### Task 6: Fisher-Yates shuffle utility

**Files:**

- Create: `src/lib/shuffle.ts`, `src/lib/shuffle.test.ts`

**Interfaces:**

- Produces: `shuffle<T>(input: readonly T[], rng?: () => number): T[]` — returns a new array (does not mutate input); uses unbiased Fisher-Yates.

- [ ] **Step 1: Write the failing test `src/lib/shuffle.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('returns a permutation with the same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(5);
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3];
    shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });

  it('is deterministic given a fixed rng', () => {
    // rng always returns 0 => Fisher-Yates picks index 0 each step
    const out = shuffle(['a', 'b', 'c'], () => 0);
    expect(out).toEqual(['b', 'c', 'a']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- shuffle`
Expected: FAIL (cannot find `./shuffle`).

- [ ] **Step 3: Create `src/lib/shuffle.ts`**

```ts
export function shuffle<T>(input: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- shuffle`
Expected: PASS (verify the `() => 0` case matches `['b','c','a']`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add unbiased Fisher-Yates shuffle"
```

---

### Task 7: Bag randomizer (logic + localStorage hook)

**Files:**

- Create: `src/lib/bag.ts`, `src/lib/bag.test.ts`, `src/hooks/useBagRandomizer.ts`

**Interfaces:**

- Consumes: `shuffle` from `src/lib/shuffle.ts`.
- Produces:
  - `interface BagState { remaining: string[] }`
  - `drawFromBag(allIds: readonly string[], count: number, state: BagState, rng?: () => number): { drawn: string[]; state: BagState }`
  - `useBagRandomizer(allIds: string[], storageKey: string): { draw: (count: number) => string[] }`

- [ ] **Step 1: Write the failing test `src/lib/bag.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { drawFromBag, type BagState } from './bag';

const ids = ['a', 'b', 'c', 'd'];

describe('drawFromBag', () => {
  it('draws the requested count', () => {
    const { drawn } = drawFromBag(ids, 2, { remaining: [] });
    expect(drawn).toHaveLength(2);
  });

  it('draws only ids from the pool', () => {
    const { drawn } = drawFromBag(ids, 2, { remaining: [] });
    for (const id of drawn) expect(ids).toContain(id);
  });

  it('does not repeat an id until the pool is exhausted', () => {
    let state: BagState = { remaining: [] };
    const seen: string[] = [];
    // Draw 2 at a time, twice => 4 draws should cover the whole pool with no repeats
    for (let round = 0; round < 2; round++) {
      const res = drawFromBag(ids, 2, state);
      state = res.state;
      seen.push(...res.drawn);
    }
    expect(new Set(seen).size).toBe(4);
  });

  it('refills when the remaining bag is smaller than count', () => {
    const { drawn, state } = drawFromBag(ids, 3, { remaining: ['a'] });
    expect(drawn).toHaveLength(3);
    // 'a' consumed from old bag, then bag refilled and 2 more drawn
    expect(new Set(drawn).size).toBe(3);
    expect(state.remaining.length).toBe(ids.length - (3 - 1) - 1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- bag`
Expected: FAIL (cannot find `./bag`).

- [ ] **Step 3: Create `src/lib/bag.ts`**

```ts
import { shuffle } from './shuffle';

export interface BagState {
  remaining: string[];
}

/**
 * Draws `count` ids without repeating until the pool is exhausted.
 * When the current bag runs dry, it is refilled from a fresh shuffle of `allIds`.
 */
export function drawFromBag(
  allIds: readonly string[],
  count: number,
  state: BagState,
  rng: () => number = Math.random,
): { drawn: string[]; state: BagState } {
  let bag = [...state.remaining];
  const drawn: string[] = [];

  while (drawn.length < count) {
    if (bag.length === 0) {
      bag = shuffle(allIds, rng);
    }
    drawn.push(bag.shift()!);
  }

  return { drawn, state: { remaining: bag } };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- bag`
Expected: PASS.

- [ ] **Step 5: Write the hook `src/hooks/useBagRandomizer.ts`**

```ts
import { useCallback, useRef } from 'react';
import { drawFromBag, type BagState } from '../lib/bag';

function loadState(storageKey: string): BagState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as BagState;
  } catch {
    // ignore malformed storage
  }
  return { remaining: [] };
}

export function useBagRandomizer(allIds: string[], storageKey: string) {
  const stateRef = useRef<BagState>(loadState(storageKey));

  const draw = useCallback(
    (count: number): string[] => {
      const { drawn, state } = drawFromBag(allIds, count, stateRef.current);
      stateRef.current = state;
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // ignore storage write failures
      }
      return drawn;
    },
    [allIds, storageKey],
  );

  return { draw };
}
```

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add bag randomizer logic and hook"
```

---

### Task 8: Deck builder for Memory Match

**Files:**

- Create: `src/games/memory-match/deck.ts`, `src/games/memory-match/deck.test.ts`

**Interfaces:**

- Consumes: `shuffle` from `src/lib/shuffle.ts`.
- Produces:
  - `interface Card { key: string; itemId: string; }`
  - `buildDeck(itemIds: readonly string[], rng?: () => number): Card[]` — duplicates each id into a pair, assigns unique keys, shuffles positions.

- [ ] **Step 1: Write the failing test `src/games/memory-match/deck.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildDeck } from './deck';

describe('buildDeck', () => {
  it('produces two cards per item', () => {
    const deck = buildDeck(['apple', 'banana', 'orange']);
    expect(deck).toHaveLength(6);
    const counts = deck.reduce<Record<string, number>>((acc, c) => {
      acc[c.itemId] = (acc[c.itemId] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ apple: 2, banana: 2, orange: 2 });
  });

  it('gives every card a unique key', () => {
    const deck = buildDeck(['apple', 'banana']);
    const keys = deck.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- deck`
Expected: FAIL (cannot find `./deck`).

- [ ] **Step 3: Create `src/games/memory-match/deck.ts`**

```ts
import { shuffle } from '../../lib/shuffle';

export interface Card {
  key: string;
  itemId: string;
}

export function buildDeck(itemIds: readonly string[], rng: () => number = Math.random): Card[] {
  const cards: Card[] = itemIds.flatMap((itemId) => [
    { key: `${itemId}-a`, itemId },
    { key: `${itemId}-b`, itemId },
  ]);
  return shuffle(cards, rng);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- deck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add memory-match deck builder"
```

---

### Task 9: Settings context (English toggle)

**Files:**

- Create: `src/context/SettingsContext.tsx`, `src/hooks/useSettings.ts`, `src/context/SettingsContext.test.tsx`
- Modify: `src/main.tsx` (wrap `<App />` in `<SettingsProvider>`)

**Interfaces:**

- Produces:
  - `SettingsProvider` component
  - `useSettings(): { showEnglish: boolean; toggleEnglish: () => void }` — persisted under localStorage key `bloomy:showEnglish`.

- [ ] **Step 1: Write the failing test `src/context/SettingsContext.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from './SettingsContext';
import { useSettings } from '../hooks/useSettings';

function Probe() {
  const { showEnglish, toggleEnglish } = useSettings();
  return <button onClick={toggleEnglish}>{showEnglish ? 'english-on' : 'english-off'}</button>;
}

describe('SettingsContext', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to english off and toggles', async () => {
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('english-off');
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('english-on');
    expect(localStorage.getItem('bloomy:showEnglish')).toBe('true');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- SettingsContext`
Expected: FAIL (cannot find `./SettingsContext`).

- [ ] **Step 3: Create `src/context/SettingsContext.tsx`**

```tsx
import { createContext, useCallback, useState, type ReactNode } from 'react';

export interface SettingsValue {
  showEnglish: boolean;
  toggleEnglish: () => void;
}

export const SettingsContext = createContext<SettingsValue | null>(null);

const KEY = 'bloomy:showEnglish';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showEnglish, setShowEnglish] = useState<boolean>(() => {
    try {
      return localStorage.getItem(KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleEnglish = useCallback(() => {
    setShowEnglish((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEY, String(next));
      } catch {
        // ignore storage write failures
      }
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ showEnglish, toggleEnglish }}>
      {children}
    </SettingsContext.Provider>
  );
}
```

- [ ] **Step 4: Create `src/hooks/useSettings.ts`**

```ts
import { useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
```

- [ ] **Step 5: Wrap `<App />` in `src/main.tsx`**

```tsx
import { SettingsProvider } from './context/SettingsContext';
// render:
// <SettingsProvider><App /></SettingsProvider>
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- SettingsContext`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add settings context with English toggle"
```

---

### Task 10: useSound hook

**Files:**

- Create: `src/hooks/useSound.ts`, `src/hooks/useSound.test.ts`
- Create (placeholders): `public/sounds/click.mp3`, `public/sounds/success.mp3`, `public/sounds/error.mp3`

**Interfaces:**

- Produces: `useSound(): { playClick: () => void; playSuccess: () => void; playError: () => void; }` — each plays a short sound via `HTMLAudioElement`, failures swallowed.

- [ ] **Step 1: Add placeholder sound files**

Create three short royalty-free mp3 files at `public/sounds/click.mp3`, `success.mp3`, `error.mp3`. If real assets are not available yet, create empty files as placeholders (playback errors are swallowed by design) and note them for later replacement.

Run:

```bash
mkdir -p public/sounds && touch public/sounds/click.mp3 public/sounds/success.mp3 public/sounds/error.mp3
```

- [ ] **Step 2: Write the failing test `src/hooks/useSound.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSound } from './useSound';

describe('useSound', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  it('exposes play functions that do not throw', () => {
    const { result } = renderHook(() => useSound());
    expect(() => result.current.playClick()).not.toThrow();
    expect(() => result.current.playSuccess()).not.toThrow();
    expect(() => result.current.playError()).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- useSound`
Expected: FAIL (cannot find `./useSound`).

- [ ] **Step 4: Create `src/hooks/useSound.ts`**

```ts
import { useCallback, useMemo } from 'react';

function play(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    void audio.play().catch(() => {});
  } catch {
    // ignore audio failures (e.g. autoplay policy)
  }
}

export function useSound() {
  const playClick = useCallback(() => play('/sounds/click.mp3'), []);
  const playSuccess = useCallback(() => play('/sounds/success.mp3'), []);
  const playError = useCallback(() => play('/sounds/error.mp3'), []);
  return useMemo(
    () => ({ playClick, playSuccess, playError }),
    [playClick, playSuccess, playError],
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- useSound`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add useSound hook with placeholder audio"
```

---

### Task 11: ItemCard component

**Files:**

- Create: `src/components/ItemCard.tsx`, `src/components/ItemCard.test.tsx`

**Interfaces:**

- Consumes: `Item` from `src/data/types.ts`, `useSettings`.
- Produces: `<ItemCard item={Item} revealed={boolean} onClick={() => void} />` — shows the image + Vietnamese name always; English name only when `showEnglish` is on and the card is `revealed`.

- [ ] **Step 1: Write the failing test `src/components/ItemCard.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemCard } from './ItemCard';
import { SettingsProvider } from '../context/SettingsContext';
import type { Item } from '../data/types';

const apple: Item = {
  id: 'apple',
  vi: 'Táo',
  en: 'Apple',
  category: 'fruit',
  image: '/images/fruit/apple.webp',
};

function renderCard(revealed: boolean) {
  return render(
    <SettingsProvider>
      <ItemCard item={apple} revealed={revealed} onClick={() => {}} />
    </SettingsProvider>,
  );
}

describe('ItemCard', () => {
  it('shows the Vietnamese name when revealed', () => {
    renderCard(true);
    expect(screen.getByText('Táo')).toBeInTheDocument();
  });

  it('hides names when not revealed', () => {
    renderCard(false);
    expect(screen.queryByText('Táo')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ItemCard`
Expected: FAIL (cannot find `./ItemCard`).

- [ ] **Step 3: Create `src/components/ItemCard.tsx`**

```tsx
import type { Item } from '../data/types';
import { useSettings } from '../hooks/useSettings';

interface ItemCardProps {
  item: Item;
  revealed: boolean;
  onClick: () => void;
}

export function ItemCard({ item, revealed, onClick }: ItemCardProps) {
  const { showEnglish } = useSettings();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.vi}
      className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl bg-sunny p-2 shadow-md transition-transform active:scale-95"
    >
      {revealed ? (
        <>
          <img src={item.image} alt={item.vi} className="h-3/4 w-3/4 object-contain" />
          <span className="text-lg font-bold text-earth">{item.vi}</span>
          {showEnglish && <span className="text-sm text-earth/70">{item.en}</span>}
        </>
      ) : (
        <span className="text-4xl">❓</span>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ItemCard`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add ItemCard component"
```

---

### Task 12: LanguageToggle and DifficultySelector components

**Files:**

- Create: `src/components/LanguageToggle.tsx`, `src/components/DifficultySelector.tsx`, `src/components/DifficultySelector.test.tsx`

**Interfaces:**

- Consumes: `useSettings`, Radix primitives.
- Produces:
  - `<LanguageToggle />` — a switch bound to `showEnglish`/`toggleEnglish`.
  - `type Difficulty = { label: string; pairs: number }`
  - `<DifficultySelector value={number} onChange={(pairs: number) => void} min={3} max={10} />` — preset buttons (Easy=4, Medium=6, Hard=8) plus a range slider.

- [ ] **Step 1: Install Radix primitives**

Run:

```bash
npm install @radix-ui/react-switch @radix-ui/react-slider
```

- [ ] **Step 2: Write the failing test `src/components/DifficultySelector.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DifficultySelector } from './DifficultySelector';

describe('DifficultySelector', () => {
  it('calls onChange with the preset pair count', async () => {
    const onChange = vi.fn();
    render(<DifficultySelector value={6} onChange={onChange} min={3} max={10} />);
    await userEvent.click(screen.getByRole('button', { name: /easy/i }));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- DifficultySelector`
Expected: FAIL (cannot find `./DifficultySelector`).

- [ ] **Step 4: Create `src/components/DifficultySelector.tsx`**

```tsx
import * as Slider from '@radix-ui/react-slider';

interface DifficultySelectorProps {
  value: number;
  onChange: (pairs: number) => void;
  min: number;
  max: number;
}

const PRESETS = [
  { label: 'Easy', pairs: 4 },
  { label: 'Medium', pairs: 6 },
  { label: 'Hard', pairs: 8 },
];

export function DifficultySelector({ value, onChange, min, max }: DifficultySelectorProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.pairs)}
            className={`rounded-xl px-4 py-2 font-bold text-earth shadow ${
              value === p.pairs ? 'bg-peach' : 'bg-grass-soft'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex w-64 items-center gap-3">
        <span className="font-bold text-earth">{value} pairs</span>
        <Slider.Root
          className="relative flex h-5 flex-1 touch-none items-center"
          value={[value]}
          min={min}
          max={max}
          step={1}
          onValueChange={([v]) => onChange(v)}
        >
          <Slider.Track className="relative h-2 flex-1 rounded-full bg-grass-soft">
            <Slider.Range className="absolute h-full rounded-full bg-grass" />
          </Slider.Track>
          <Slider.Thumb
            aria-label="Number of pairs"
            className="block h-6 w-6 rounded-full bg-flower shadow"
          />
        </Slider.Root>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/components/LanguageToggle.tsx`**

```tsx
import * as Switch from '@radix-ui/react-switch';
import { useSettings } from '../hooks/useSettings';

export function LanguageToggle() {
  const { showEnglish, toggleEnglish } = useSettings();
  return (
    <label className="flex items-center gap-2 font-bold text-earth">
      <span>English</span>
      <Switch.Root
        checked={showEnglish}
        onCheckedChange={toggleEnglish}
        className="relative h-6 w-11 rounded-full bg-grass-soft data-[state=checked]:bg-grass"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
    </label>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- DifficultySelector`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add LanguageToggle and DifficultySelector"
```

---

### Task 13: Memory Match game board

**Files:**

- Create: `src/games/memory-match/useMemoryMatch.ts`, `src/games/memory-match/useMemoryMatch.test.ts`, `src/games/memory-match/MemoryMatchBoard.tsx`

**Interfaces:**

- Consumes: `buildDeck`, `Card`, `getCategory`, `ItemCard`, `useSound`.
- Produces:
  - `useMemoryMatch(itemIds: string[]): { cards: Card[]; revealed: Set<string>; matched: Set<string>; isComplete: boolean; flip: (key: string) => void; }`
  - `<MemoryMatchBoard itemIds={string[]} onComplete={() => void} />`

- [ ] **Step 1: Write the failing test `src/games/memory-match/useMemoryMatch.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMemoryMatch } from './useMemoryMatch';

describe('useMemoryMatch', () => {
  it('marks a matching pair as matched', () => {
    const { result } = renderHook(() => useMemoryMatch(['apple', 'banana']));
    const cards = result.current.cards;
    const appleCards = cards.filter((c) => c.itemId === 'apple');

    act(() => result.current.flip(appleCards[0].key));
    act(() => result.current.flip(appleCards[1].key));

    expect(result.current.matched.has('apple')).toBe(true);
  });

  it('does not match two different items', () => {
    const { result } = renderHook(() => useMemoryMatch(['apple', 'banana']));
    const apple = result.current.cards.find((c) => c.itemId === 'apple')!;
    const banana = result.current.cards.find((c) => c.itemId === 'banana')!;

    act(() => result.current.flip(apple.key));
    act(() => result.current.flip(banana.key));

    expect(result.current.matched.has('apple')).toBe(false);
    expect(result.current.matched.has('banana')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- useMemoryMatch`
Expected: FAIL (cannot find `./useMemoryMatch`).

- [ ] **Step 3: Create `src/games/memory-match/useMemoryMatch.ts`**

```ts
import { useMemo, useState, useCallback } from 'react';
import { buildDeck, type Card } from './deck';

export function useMemoryMatch(itemIds: string[]) {
  const cards = useMemo<Card[]>(() => buildDeck(itemIds), [itemIds]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());

  const flip = useCallback(
    (key: string) => {
      const card = cards.find((c) => c.key === key);
      if (!card) return;
      if (matched.has(card.itemId) || revealed.has(key)) return;
      if (revealed.size >= 2) return; // wait for the current pair to resolve

      const nextRevealed = new Set(revealed).add(key);
      setRevealed(nextRevealed);

      if (nextRevealed.size === 2) {
        const [k1, k2] = [...nextRevealed];
        const c1 = cards.find((c) => c.key === k1)!;
        const c2 = cards.find((c) => c.key === k2)!;
        if (c1.itemId === c2.itemId) {
          setMatched((m) => new Set(m).add(c1.itemId));
          setRevealed(new Set());
        } else {
          setTimeout(() => setRevealed(new Set()), 1000);
        }
      }
    },
    [cards, matched, revealed],
  );

  const isComplete = matched.size === itemIds.length && itemIds.length > 0;

  return { cards, revealed, matched, isComplete, flip };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- useMemoryMatch`
Expected: PASS.

- [ ] **Step 5: Create `src/games/memory-match/MemoryMatchBoard.tsx`**

```tsx
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useMemoryMatch } from './useMemoryMatch';
import { getCategory } from '../../data';
import { ItemCard } from '../../components/ItemCard';
import { useSound } from '../../hooks/useSound';

interface MemoryMatchBoardProps {
  itemIds: string[];
  onComplete: () => void;
}

export function MemoryMatchBoard({ itemIds, onComplete }: MemoryMatchBoardProps) {
  const { cards, revealed, matched, isComplete, flip } = useMemoryMatch(itemIds);
  const { playClick, playSuccess } = useSound();
  const fruit = getCategory('fruit');

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  const itemById = (id: string) => fruit.find((i) => i.id === id)!;

  return (
    <div className="grid grid-cols-4 gap-3 p-4 sm:gap-4">
      {cards.map((card) => {
        const isUp = revealed.has(card.key) || matched.has(card.itemId);
        return (
          <motion.div
            key={card.key}
            animate={{ rotateY: isUp ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ItemCard
              item={itemById(card.itemId)}
              revealed={isUp}
              onClick={() => {
                playClick();
                const before = matched.size;
                flip(card.key);
                if (matched.size > before) playSuccess();
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Memory Match board and game hook"
```

---

### Task 14: Animated background + Home screen

**Files:**

- Create: `src/components/AnimatedBackground.tsx`, `src/screens/HomeScreen.tsx`

**Interfaces:**

- Consumes: `motion` (motion/react), `LanguageToggle`, `DifficultySelector`.
- Produces:
  - `<AnimatedBackground />` — sky gradient + 2-4 slowly moving decorative elements (clouds/butterfly) via CSS/Framer Motion; pointer-events none.
  - `<HomeScreen onStart={(pairs: number) => void} />` — title, LanguageToggle, DifficultySelector, Start button over the animated background.

- [ ] **Step 1: Install Framer Motion**

Run:

```bash
npm install motion
```

- [ ] **Step 2: Create `src/components/AnimatedBackground.tsx`**

```tsx
import { motion } from 'motion/react';

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-sky-deep to-sky-soft">
      <motion.div
        className="absolute left-0 top-10 text-6xl"
        animate={{ x: ['-10vw', '110vw'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        ☁️
      </motion.div>
      <motion.div
        className="absolute left-0 top-32 text-4xl"
        animate={{ x: ['-10vw', '110vw'] }}
        transition={{ duration: 55, repeat: Infinity, ease: 'linear', delay: 5 }}
      >
        ☁️
      </motion.div>
      <motion.div
        className="absolute top-1/2 text-3xl"
        animate={{ x: ['-10vw', '110vw'], y: [0, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      >
        🦋
      </motion.div>
      <div className="absolute bottom-0 h-24 w-full bg-grass" />
    </div>
  );
}
```

- [ ] **Step 3: Create `src/screens/HomeScreen.tsx`**

```tsx
import { useState } from 'react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { LanguageToggle } from '../components/LanguageToggle';
import { DifficultySelector } from '../components/DifficultySelector';

interface HomeScreenProps {
  onStart: (pairs: number) => void;
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  const [pairs, setPairs] = useState(6);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <AnimatedBackground />
      <h1 className="text-6xl font-extrabold text-earth drop-shadow">Bloomy</h1>
      <LanguageToggle />
      <DifficultySelector value={pairs} onChange={setPairs} min={3} max={10} />
      <button
        type="button"
        onClick={() => onStart(pairs)}
        className="rounded-full bg-flower px-10 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95"
      >
        Play
      </button>
    </main>
  );
}
```

- [ ] **Step 4: Verify visually**

Temporarily render `<HomeScreen onStart={() => {}} />` inside `App`, run `npm run dev`, confirm the background animates (clouds drift, butterfly flies) and controls appear. Revert after checking (Task 15 wires it properly).

- [ ] **Step 5: Run lint and tests**

Run: `npm run lint && npm test`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add animated background and home screen"
```

---

### Task 15: App screen wiring (Home ↔ Game)

**Files:**

- Modify: `src/App.tsx`
- Create: `src/screens/GameScreen.tsx`, `src/App.test.tsx` (update)

**Interfaces:**

- Consumes: `HomeScreen`, `MemoryMatchBoard`, `useBagRandomizer`, `getCategory`.
- Produces: full navigation — Home → (draw items via bag) → Game → back to Home. A win shows a celebration overlay with a Play-again action.

- [ ] **Step 1: Create `src/screens/GameScreen.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryMatchBoard } from '../games/memory-match/MemoryMatchBoard';

interface GameScreenProps {
  itemIds: string[];
  onExit: () => void;
  onPlayAgain: () => void;
}

export function GameScreen({ itemIds, onExit, onPlayAgain }: GameScreenProps) {
  const [won, setWon] = useState(false);
  // Re-key the board so Play-again rebuilds a fresh deck.
  const boardKey = useMemo(() => itemIds.join('-'), [itemIds]);

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-sky-deep to-sky-soft">
      <button
        type="button"
        onClick={onExit}
        className="m-4 self-start rounded-xl bg-white/80 px-4 py-2 font-bold text-earth shadow"
      >
        ← Home
      </button>

      <MemoryMatchBoard key={boardKey} itemIds={itemIds} onComplete={() => setWon(true)} />

      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/40"
          >
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-7xl">
              🎉
            </motion.div>
            <button
              type="button"
              onClick={() => {
                setWon(false);
                onPlayAgain();
              }}
              className="rounded-full bg-sunny px-8 py-4 text-2xl font-extrabold text-earth shadow-lg active:scale-95"
            >
              Play again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
```

- [ ] **Step 2: Rewrite `src/App.tsx` to wire screens together**

```tsx
import { useCallback, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { getCategory } from './data';
import { useBagRandomizer } from './hooks/useBagRandomizer';

const fruitIds = getCategory('fruit').map((i) => i.id);

export default function App() {
  const { draw } = useBagRandomizer(fruitIds, 'bloomy:bag:fruit');
  const [itemIds, setItemIds] = useState<string[] | null>(null);

  const start = useCallback((pairs: number) => setItemIds(draw(pairs)), [draw]);

  if (!itemIds) return <HomeScreen onStart={start} />;

  return (
    <GameScreen
      itemIds={itemIds}
      onExit={() => setItemIds(null)}
      onPlayAgain={() => setItemIds((prev) => draw(prev?.length ?? 6))}
    />
  );
}
```

- [ ] **Step 3: Update `src/App.test.tsx` for the new App**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';
import { SettingsProvider } from './context/SettingsContext';

test('renders the Bloomy home screen', () => {
  render(
    <SettingsProvider>
      <App />
    </SettingsProvider>,
  );
  expect(screen.getByRole('heading', { name: 'Bloomy' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Manual end-to-end check**

Run: `npm run dev`. From Home, pick a difficulty, press Play, flip cards, match all pairs, see the celebration, press Play again, and use ← Home. (Card images will be broken placeholders until Task 16 generates them — that is expected here.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire Home and Game screens with bag-based rounds"
```

---

### Task 16: Image generation script (Pollinations → WebP)

**Files:**

- Create: `scripts/generate-images.ts`, `scripts/README.md`
- Modify: `package.json` (script), install `sharp` and a TS runner as devDependencies

**Interfaces:**

- Consumes: `fruit` data (ids) from `src/data/fruit.ts`.
- Produces: `npm run generate:images` writes `public/images/fruit/<id>.webp` (512x512, quality 80) for every fruit id.

- [ ] **Step 1: Install script dependencies**

Run:

```bash
npm install -D sharp tsx
```

- [ ] **Step 2: Create `scripts/generate-images.ts`**

```ts
import { writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { fruit } from '../src/data/fruit';

const OUT_DIR = 'public/images/fruit';
const STYLE =
  'flat vector illustration, cute, simple solid background, centered, kid-friendly, no text';

async function generate(id: string, en: string) {
  const prompt = encodeURIComponent(`${en}, ${STYLE}`);
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=42`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${en}: ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());

  const webp = await sharp(input)
    .resize(512, 512, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
  await writeFile(`${OUT_DIR}/${id}.webp`, webp);
  console.log(`✓ ${id}.webp (${(webp.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const item of fruit) {
    await generate(item.id, item.en);
  }
  console.log(`Done: ${fruit.length} images in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Add the npm script**

Add to `"scripts"` in `package.json`:

```json
"generate:images": "tsx scripts/generate-images.ts"
```

- [ ] **Step 4: Create `scripts/README.md`**

```md
# Image generation

`npm run generate:images` fetches one illustration per fruit id from Pollinations,
resizes to 512x512, and writes optimized WebP files to `public/images/fruit/`.

Run manually and review the output before committing. A fixed `seed` keeps results
stable between runs; change or remove it to regenerate different art.
```

- [ ] **Step 5: Run the script and verify output**

Run: `npm run generate:images`
Expected: 8-10 `.webp` files created under `public/images/fruit/`, each logged with a small KB size. Review the images look kid-appropriate. (Requires internet access to Pollinations.)

- [ ] **Step 6: Verify images render in the game**

Run: `npm run dev`, play a round, confirm real fruit images now appear on matched/revealed cards.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Pollinations image generation script and assets"
```

---

### Task 17: PWA + responsive polish

**Files:**

- Modify: `vite.config.ts`, `index.html`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png` (app icons)

**Interfaces:**

- Consumes: `vite-plugin-pwa`.
- Produces: an installable PWA named "Bloomy" with offline caching for app shell + images; layout verified on phone and tablet widths.

- [ ] **Step 1: Install the PWA plugin**

Run:

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Add app icons**

Create `public/icons/icon-192.png` (192x192) and `public/icons/icon-512.png` (512x512) — simple Bloomy icon on a bright background. Placeholder solid-color PNGs are acceptable initially.

- [ ] **Step 3: Configure the plugin in `vite.config.ts`**

Add the import and plugin entry:

```ts
import { VitePWA } from 'vite-plugin-pwa';

// inside plugins array, after tailwindcss():
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
  manifest: {
    name: 'Bloomy',
    short_name: 'Bloomy',
    description: 'Educational game for kids aged 2-5',
    theme_color: '#87CEEB',
    background_color: '#B3E5FC',
    display: 'standalone',
    orientation: 'any',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,webp,png,mp3}'],
  },
}),
```

- [ ] **Step 4: Add viewport + theme meta to `index.html`**

Ensure inside `<head>`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#87CEEB" />
```

- [ ] **Step 5: Verify responsive layout**

Run `npm run dev`, use browser device emulation to check phone portrait (e.g. 390px) and tablet (e.g. 820px): the card grid, controls, and celebration overlay stay usable and centered without horizontal scroll.

- [ ] **Step 6: Verify the production build and PWA manifest**

Run:

```bash
npm run build && npm run preview
```

Expected: build succeeds; in the preview, DevTools → Application shows the "Bloomy" manifest and a registered service worker.

- [ ] **Step 7: Run the full check**

Run: `npm run lint && npm test && npm run build`
Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add PWA support and responsive polish"
```

---

## Self-Review Notes

- **Spec coverage:** stack (T1,T2,T3,T4), tooling (T3), data model (T5), Fisher-Yates (T6), bag randomizer (T7), deck/Memory Match (T8,T13), difficulty presets+slider (T12), English toggle (T9,T12), sound (T10), ItemCard (T11), animated background/Home (T14), screen wiring + celebration (T15), Pollinations pipeline (T16), PWA + responsive + theme (T4,T17). All spec sections mapped.
- **Out-of-scope items** (Puzzle/Color games, Three.js, TTS, extra categories, Sonar) intentionally excluded.
- **Type consistency:** `Item`, `Card { key, itemId }`, `BagState { remaining }`, `drawFromBag`, `buildDeck`, `useMemoryMatch` return shape, and `useSettings` shape are referenced consistently across tasks.
- **Known pragmatic placeholders:** sound files (T10) and app icons (T17) start as placeholders to keep tasks testable; flagged for asset replacement. This is intentional, not a plan gap.
