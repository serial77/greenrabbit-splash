// Encode responsive image sets, icons and fonts into src/static/.
// Originals in images/ are never modified. Run via `npm run images`
// (scripts/compose.py must have produced build/raw/ first).
import sharp from 'sharp';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'images');
const RAW = join(ROOT, 'build/raw');
const OUT = join(ROOT, 'src/static');
const IMG = join(OUT, 'assets/img');
const FONTS = join(OUT, 'assets/fonts');
await mkdir(IMG, { recursive: true });
await mkdir(FONTS, { recursive: true });

// slug -> [source file, widths]
const PHOTOS = {
  'hero-lounge': ['7aa671cb-591e-411f-a9c5-88228f0e0429.jpeg', [640, 800, 1080, 1280, 1600]],
  'lounge': ['48aff171-39e5-49de-9e58-2c9bda786668.jpeg', [480, 800, 1200, 1448]],
  'bar': ['60f011a3-0d41-4027-8ce2-a6d03b3bdc7e.jpeg', [480, 800, 1200]],
  'games-room': ['fc5d3072-e2a3-4f1c-86a9-457812e009fc.jpeg', [480, 800, 1200]],
  'board-games': ['887cb7ed-11df-4e8b-9c0d-8066f6021828.jpeg', [480, 800, 1200]],
  'workspace': ['b1b274e6-822b-4384-a1da-cf3b7b60f163.jpeg', [480, 800, 1200]],
  'cinema': ['bb512bd4-c975-4854-bc97-b70cff920b7b.jpeg', [480, 800, 1200]],
};

// The hero photo is shown large and full-bleed, so it gets higher quality and full chroma.
const HERO = new Set(['hero-lounge']);
const manifest = {};

async function encodeSet(slug, input, widths) {
  const meta = await sharp(input).metadata();
  manifest[slug] = { ratio: meta.height / meta.width, widths };
  for (const w of widths) {
    const base = sharp(input).resize({ width: w, withoutEnlargement: true });
    const hero = HERO.has(slug);
    await base.clone().avif({ quality: hero ? 58 : 50, effort: 6, chromaSubsampling: hero && w >= 1280 ? '4:4:4' : '4:2:0' }).toFile(join(IMG, `${slug}-${w}.avif`));
    await base.clone().webp({ quality: hero ? 82 : 72 }).toFile(join(IMG, `${slug}-${w}.webp`));
    await base.clone().jpeg({ quality: hero ? 84 : 76, mozjpeg: true }).toFile(join(IMG, `${slug}-${w}.jpg`));
  }
}

for (const [slug, [file, widths]] of Object.entries(PHOTOS)) {
  await encodeSet(slug, join(SRC, file), widths);
}
await encodeSet('map', join(RAW, 'map.png'), [600, 1200]);

// Logo badge (transparent circle).
const badge = join(RAW, 'logo-badge.png');
for (const w of [96, 192, 384]) {
  await sharp(badge).resize(w).webp({ quality: 85, alphaQuality: 90 }).toFile(join(IMG, `logo-${w}.webp`));
}
await sharp(badge).resize(512).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(join(IMG, 'logo-512.png'));

// Icons: rabbit-head crop on navy, so it reads at tiny sizes.
const icon = join(RAW, 'icon-square.png');
await sharp(icon).resize(180).png().toFile(join(OUT, 'apple-touch-icon.png'));
await sharp(icon).resize(192).png().toFile(join(OUT, 'icon-192.png'));
await sharp(icon).resize(512).png().toFile(join(OUT, 'icon-512.png'));
await sharp(icon).resize(32).png().toFile(join(OUT, 'favicon-32.png'));

// Open Graph image (JPEG for maximum crawler compatibility).
await sharp(join(RAW, 'og.jpg')).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, 'og-image.jpg'));

// Self-hosted fonts (latin subset covers Spanish).
const FONT_FILES = {
  'inter-var.woff2': '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  'cormorant-500.woff2': '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2',
};
for (const [name, from] of Object.entries(FONT_FILES)) {
  await copyFile(join(ROOT, 'node_modules', from), join(FONTS, name));
}

await writeFile(join(ROOT, 'src/image-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('images ->', IMG);
