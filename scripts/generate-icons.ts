import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const OUT_DIR = 'public/icons';

// A simple, friendly Bloomy mark: a sprout on a sunny sky-blue rounded square.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#87CEEB"/>
  <circle cx="256" cy="150" r="70" fill="#FFD54F"/>
  <path d="M256 470 L256 300" stroke="#6D4C41" stroke-width="26" stroke-linecap="round"/>
  <path d="M256 340 C200 300 150 320 140 250 C210 250 250 280 256 330 Z" fill="#8BC34A"/>
  <path d="M256 340 C312 300 362 320 372 250 C302 250 262 280 256 330 Z" fill="#AED581"/>
</svg>
`;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const base = Buffer.from(svg);
  for (const size of [192, 512]) {
    await sharp(base)
      .resize(size, size)
      .png()
      .toFile(`${OUT_DIR}/icon-${size}.png`);
    console.log(`✓ icon-${size}.png`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
