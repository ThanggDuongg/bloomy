import { writeFile, mkdir } from 'node:fs/promises';
import process from 'node:process';
import { fruit } from '../src/data/fruit';

// Curation helper: fetch several Pexels candidates for a query and save small
// previews so a human (or the assistant) can eyeball them and pick the best photo
// id to pin in `generate-photos.ts` PHOTO_ID.
//
// Usage:
//   npm run pexels:pick -- durian
//   npm run pexels:pick -- "dragon fruit pitaya" dragonfruit
// First arg is the search query (or a fruit id); optional second arg is a label
// used in the output filenames.

const OUT_DIR = process.env.PICK_OUT_DIR ?? 'scripts/.pexels-candidates';
const PER_PAGE = 12;

interface PexelsPhoto {
  id: number;
  alt: string;
  src: { medium?: string; tiny?: string };
}
interface PexelsResponse {
  photos: PexelsPhoto[];
}

function loadKey(): string {
  try {
    process.loadEnvFile('.env');
  } catch {
    // fall back to ambient env
  }
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY not set (see .env.example).');
  return key;
}

async function main() {
  const key = loadKey();
  const [rawQuery, rawLabel] = process.argv.slice(2);
  if (!rawQuery) throw new Error('Provide a query or fruit id.');

  // If the arg matches a fruit id, use a sensible default query from its English name.
  const match = fruit.find((f) => f.id === rawQuery);
  const query = match ? `${match.en} fruit isolated white background` : rawQuery;
  const label = rawLabel ?? (match ? match.id : rawQuery.replace(/\s+/g, '_'));

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query,
  )}&per_page=${PER_PAGE}`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`search failed: HTTP ${res.status}`);
  const data = (await res.json()) as PexelsResponse;

  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Query: "${query}" -> ${data.photos.length} candidates`);
  for (const photo of data.photos) {
    const preview = photo.src.medium ?? photo.src.tiny;
    if (!preview) continue;
    const imgRes = await fetch(preview);
    if (!imgRes.ok) continue;
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const file = `${OUT_DIR}/${label}__${photo.id}.jpg`;
    await writeFile(file, buf);
    console.log(`  id=${photo.id}  ${file}  (${photo.alt || 'no alt'})`);
  }
  console.log('Review the files, then pin the best id in PHOTO_ID in generate-photos.ts.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
