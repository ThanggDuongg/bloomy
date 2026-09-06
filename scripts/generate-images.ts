import { writeFile, mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import sharp from 'sharp';
import { fruit } from '../src/data/fruit';

const OUT_DIR = 'public/images/fruit';

// Each item maps to a Microsoft Fluent Emoji asset folder. The Fluent "3D" style is
// rendered, dimensional artwork — more realistic and easier for toddlers to recognize
// than flat emoji, while staying clean, consistent, and correctly colored.
// License: MIT. Library: https://github.com/microsoft/fluentui-emoji
const FLUENT_FOLDER: Record<string, string> = {
  apple: 'Red apple',
  green_apple: 'Green apple',
  pear: 'Pear',
  orange: 'Tangerine',
  lemon: 'Lemon',
  banana: 'Banana',
  watermelon: 'Watermelon',
  melon: 'Melon',
  grape: 'Grapes',
  strawberry: 'Strawberry',
  blueberry: 'Blueberries',
  cherry: 'Cherries',
  peach: 'Peach',
  mango: 'Mango',
  pineapple: 'Pineapple',
  coconut: 'Coconut',
  kiwi: 'Kiwi fruit',
  avocado: 'Avocado',
};

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 1500;

function assetUrl(folder: string): string {
  const file = `${folder.toLowerCase().replaceAll(' ', '_')}_3d.png`;
  const base = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets';
  return `${base}/${encodeURIComponent(folder)}/3D/${file}`;
}

async function fetchImage(id: string, folder: string): Promise<Buffer> {
  const url = assetUrl(folder);
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      console.warn(`  ${id}: HTTP ${res.status} (attempt ${attempt}/${MAX_RETRIES})`);
    } catch (err) {
      console.warn(`  ${id}: ${(err as Error).message} (attempt ${attempt}/${MAX_RETRIES})`);
    }
    if (attempt < MAX_RETRIES) await delay(RETRY_DELAY_MS * attempt);
  }
  throw new Error(`Failed to fetch ${id} (${folder}) after ${MAX_RETRIES} attempts`);
}

async function generate(id: string, folder: string) {
  const input = await fetchImage(id, folder);
  // Fit into a 512 square with padding, on a transparent background so the card
  // color shows through.
  const webp = await sharp(input)
    .resize(448, 448, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 32,
      bottom: 32,
      left: 32,
      right: 32,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 90 })
    .toBuffer();
  await writeFile(`${OUT_DIR}/${id}.webp`, webp);
  console.log(`✓ ${id}.webp (${(webp.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  // Optional CLI filter: `npm run generate:images -- apple banana` regenerates a subset.
  const only = process.argv.slice(2);
  const items = only.length ? fruit.filter((f) => only.includes(f.id)) : fruit;

  for (const item of items) {
    const folder = FLUENT_FOLDER[item.id];
    if (!folder) {
      console.warn(`! ${item.id}: no Fluent asset mapped, skipping`);
      continue;
    }
    await generate(item.id, folder);
  }
  console.log(`Done: ${items.length} image(s) in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
