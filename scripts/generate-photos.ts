import { writeFile, mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import process from 'node:process';
import sharp from 'sharp';
import { categories, getCategory } from '../src/data/index';

// Real-photo pipeline using the Pexels API. Covers items that have no clean emoji
// (durian, rambutan, ...). Photos are square center-cropped so the subject stays
// centered and every thumbnail is uniform.
//
// Setup: copy `.env.example` to `.env` and set PEXELS_API_KEY.
// Usage:
//   npm run generate:photos                 # all items in the default category (fruit)
//   npm run generate:photos -- animal       # a whole category
//   npm run generate:photos -- animal dog   # a subset of a category
// Docs: https://www.pexels.com/api/documentation/

// Appended to the plain English name to disambiguate the search per category.
const QUERY_SUFFIX: Record<string, string> = { fruit: 'fruit', animal: 'animal' };

// Better search terms for items where the plain English name is ambiguous on Pexels.
const SEARCH_TERM: Record<string, string> = {
  // fruit
  green_apple: 'green apple',
  orange: 'orange citrus',
  melon: 'cantaloupe melon',
  cherry: 'cherries',
  kiwi: 'kiwi',
  avocado: 'avocado',
  durian: 'durian',
  dragonfruit: 'dragon fruit pitaya',
  rambutan: 'rambutan',
  jackfruit: 'jackfruit',
  papaya: 'papaya',
  custard_apple: 'sugar apple sweetsop',
  starfruit: 'star fruit carambola',
  longan: 'longan',
  lychee: 'lychee',
  pomelo: 'pomelo',
  guava: 'guava',
  persimmon: 'persimmon',
  // animal
  chicken: 'hen chicken bird',
  duck: 'duck bird',
  fish: 'fish aquarium',
  bear: 'brown bear wildlife',
  cow: 'cow cattle',
  frog: 'green frog',
  mouse: 'mouse rodent animal',
  buffalo: 'water buffalo',
  hippo: 'hippopotamus',
  rhino: 'rhinoceros',
  panda: 'panda bear',
  goose: 'goose bird',
  owl: 'owl bird',
  eagle: 'eagle bird',
  crab: 'crab animal',
  octopus: 'octopus sea',
  shark: 'shark underwater',
  whale: 'whale ocean',
  dolphin: 'dolphin ocean',
  snake: 'snake reptile',
  turtle: 'turtle animal',
  ant: 'ant insect macro',
  bee: 'honey bee insect',
  butterfly: 'butterfly insect',
  ladybug: 'ladybug ladybird insect',
  snail: 'snail animal',
  deer: 'deer wildlife',
  fox: 'fox wildlife',
  wolf: 'wolf wildlife',
  bat: 'bat flying mammal wildlife',
  turkey: 'turkey bird farm',
  dove: 'dove pigeon bird',
  spider: 'spider web animal',
  swan: 'swan bird lake',
  flamingo: 'flamingo bird',
  ostrich: 'ostrich bird',
  donkey: 'donkey animal',
  seal: 'seal animal beach',
  hedgehog: 'hedgehog animal',
  dragonfly: 'dragonfly insect',
  shrimp: 'shrimp prawn',
  lobster: 'lobster',
  seahorse: 'seahorse',
  starfish: 'starfish',
  jellyfish: 'jellyfish',
  dinosaur: 't-rex dinosaur',
};

// Manually pinned Pexels photo IDs for items where auto-search picks a wrong or
// cluttered image. Filled in during curation (see `npm run pexels:pick`). A pinned
// id is fetched directly and always wins over search.
const PHOTO_ID: Record<string, number> = {
  blueberry: 5679194, // clear bright blue vs the previous near-black, underexposed shot
  longan: 5945881, // auto-search returned a street-vendor scene
  lemon: 36371030, // cleaner single lemon vs a leafy tree shot
  pear: 7636159, // cleaner single pear vs a leafy tree shot
  fish: 7254919, // auto-search returned a person's silhouette at an aquarium
  lion: 29459559, // color portrait with a full mane vs a dark B&W profile
  peacock: 15909934, // full fanned tail display vs a plain standing bird
  sheep: 31675605, // clear sheep in a meadow vs one behind a wire fence
  butterfly: 38090604, // open colorful wings vs a closed-wing cluster
  // Clearer, better-framed shots (heads no longer cropped).
  bear: 35435,
  cat: 3822875, // full cat vs an extreme face close-up
  crab: 31612416,
  goat: 35324344,
  deer: 20393013,
  dolphin: 162079, // centered dolphin head vs an off-center jump

  giraffe: 29106247,
  hippo: 37340587,
  octopus: 3046629,
  parrot: 35495574,
  penguin: 4468725,
  rhino: 29506188,
  shark: 18659794,
  snake: 28510929,
  whale: 12490332,
  turkey: 30568753, // single turkey vs a barn full of them
  swan: 69474, // classic S-neck head-up vs swans dabbling head-down
  spider: 5012064, // clear jumping spider vs a tiny speck in a web
  seal: 7003085, // clear seal face vs two seals far off on a beach
};

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 2000;
const BETWEEN_IMAGES_MS = 400;

interface PexelsPhoto {
  src: { large?: string; large2x?: string; medium?: string; original?: string };
}
interface PexelsResponse {
  photos: PexelsPhoto[];
}

function loadKey(): string {
  try {
    process.loadEnvFile('.env');
  } catch {
    // no .env file; fall back to the ambient environment
  }
  const key = process.env.PEXELS_API_KEY;
  if (!key || key === 'your_pexels_api_key_here') {
    throw new Error(
      'PEXELS_API_KEY is not set. Copy .env.example to .env and add your key ' +
        '(get one free at https://www.pexels.com/api/).',
    );
  }
  return key;
}

function pickSrc(photo: PexelsPhoto | undefined): string | undefined {
  return photo?.src.large2x ?? photo?.src.large ?? photo?.src.original;
}

async function photoUrlById(photoId: number, key: string): Promise<string> {
  const url = `https://api.pexels.com/v1/photos/${photoId}`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`photo ${photoId}: HTTP ${res.status}`);
  const photo = (await res.json()) as PexelsPhoto;
  const src = pickSrc(photo);
  if (!src) throw new Error(`photo ${photoId}: no usable src`);
  return src;
}

async function searchPhotoUrl(id: string, query: string, key: string): Promise<string> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { Authorization: key } });
      if (res.ok) {
        const data = (await res.json()) as PexelsResponse;
        const src = pickSrc(data.photos[0]);
        if (src) return src;
        throw new Error(`no photo found for "${query}"`);
      }
      console.warn(`  ${id}: HTTP ${res.status} (attempt ${attempt}/${MAX_RETRIES})`);
    } catch (err) {
      console.warn(`  ${id}: ${(err as Error).message} (attempt ${attempt}/${MAX_RETRIES})`);
    }
    if (attempt < MAX_RETRIES) await delay(RETRY_DELAY_MS * attempt);
  }
  throw new Error(`Failed to find a photo for ${id} after ${MAX_RETRIES} attempts`);
}

async function resolvePhotoUrl(id: string, query: string, key: string): Promise<string> {
  const pinned = PHOTO_ID[id];
  if (pinned) return photoUrlById(pinned, key);
  return searchPhotoUrl(id, query, key);
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function generate(outDir: string, id: string, query: string, key: string) {
  const photoUrl = await resolvePhotoUrl(id, query, key);
  const input = await download(photoUrl);
  const webp = await sharp(input)
    // Square center-crop so every thumbnail is uniform and fills the card.
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toBuffer();
  await writeFile(`${outDir}/${id}.webp`, webp);
  console.log(`✓ ${id}.webp (${(webp.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  const key = loadKey();
  const [rawCategory, ...idFilter] = process.argv.slice(2);
  const category = rawCategory && categories[rawCategory] ? rawCategory : 'fruit';
  const suffix = QUERY_SUFFIX[category] ?? category;
  const outDir = `public/images/${category}`;

  const all = getCategory(category);
  const items = idFilter.length ? all.filter((i) => idFilter.includes(i.id)) : all;

  await mkdir(outDir, { recursive: true });
  for (const item of items) {
    const query = SEARCH_TERM[item.id] ?? `${item.en} ${suffix}`;
    await generate(outDir, item.id, query, key);
    await delay(BETWEEN_IMAGES_MS);
  }
  console.log(`Done: ${items.length} photo(s) in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
