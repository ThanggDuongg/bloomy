import { writeFile, mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import sharp from 'sharp';
import { SILHOUETTE_FLUENT_FOLDER } from '../src/data/silhouetteAssets';

// Generates the transparent-background icons used by the "shadow match" game.
// See src/data/silhouetteAssets.ts for why these need a dedicated, separate asset
// set instead of reusing the regular Pexels photos.
const OUT_DIR = 'public/images/silhouette';
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
  // Minimal padding so the silhouette fills its card the same way the real photos
  // do (a heavily-padded icon reads as noticeably smaller/weaker than the edge-to-
  // edge item photos it sits next to).
  const webp = await sharp(input)
    .resize(496, 496, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 90 })
    .toBuffer();
  await writeFile(`${OUT_DIR}/${id}.webp`, webp);
  console.log(`✓ ${id}.webp (${(webp.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const only = process.argv.slice(2);
  const entries = Object.entries(SILHOUETTE_FLUENT_FOLDER).filter(
    ([id]) => only.length === 0 || only.includes(id),
  );

  for (const [id, folder] of entries) {
    await generate(id, folder);
  }
  console.log(`Done: ${entries.length} image(s) in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
