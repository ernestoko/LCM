/**
 * One-off marketing-image optimiser. The public photos are decorative,
 * full-bleed JPEGs that ship far larger than they render. This downscales them
 * to a sensible max width and re-encodes as progressive mozjpeg, cutting page
 * weight (and LCP) dramatically with no visible quality loss. Originals are in
 * git, so a bad result is one `git checkout` away.
 *
 * Run: node scripts/optimize-images.mjs
 */
import { readdir, stat, rename, unlink } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const DIR = "public/images";
const MAX_DIM = 1500; // cap the longest side — heroes/cards never render larger
const QUALITY = 72;

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

const files = (await readdir(DIR)).filter((f) => /\.(jpe?g)$/i.test(f));
let beforeTotal = 0;
let afterTotal = 0;

for (const file of files) {
  const src = join(DIR, file);
  const tmp = join(DIR, `.opt-${file}`);
  const before = (await stat(src)).size;
  beforeTotal += before;

  const meta = await sharp(src).metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  const pipeline = sharp(src).rotate(); // honour EXIF orientation, then strip it
  if (longest > MAX_DIM) {
    // Fit inside a MAX_DIM box (no crop, no enlargement) so tall images shrink too.
    pipeline.resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true });
  }
  await pipeline
    .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
    .toFile(tmp);

  const after = (await stat(tmp)).size;
  if (after < before) {
    await unlink(src);
    await rename(tmp, src);
    afterTotal += after;
    const w = longest > MAX_DIM ? ` (→${MAX_DIM}px)` : "";
    console.log(`✓ ${file.padEnd(22)} ${kb(before).padStart(10)} → ${kb(after).padStart(10)}  (-${Math.round((1 - after / before) * 100)}%)${w}`);
  } else {
    await unlink(tmp);
    afterTotal += before;
    console.log(`· ${file.padEnd(22)} ${kb(before).padStart(10)}  (already optimal, kept)`);
  }
}

console.log("─".repeat(60));
console.log(`Total: ${kb(beforeTotal)} → ${kb(afterTotal)}  (-${Math.round((1 - afterTotal / beforeTotal) * 100)}%)`);
