import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { config } from '../config.js';
import { BadRequestError } from './errors.js';

const NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;
export const MAX_IMAGE_SIDE = 1200;

export function isValidImageName(name: string) {
  return NAME_RE.test(name);
}

export function imageFilePath(name: string) {
  if (!isValidImageName(name)) throw new BadRequestError('Invalid image name');
  return path.join(config.uploadDir, name);
}

export async function ensureUploadDir() {
  await fs.mkdir(config.uploadDir, { recursive: true });
}

/** Resizes to max 1200px on the longest side, converts to WebP and stores it. Returns the file name. */
export async function processAndStoreImage(input: Buffer): Promise<string> {
  let output: Buffer;
  try {
    output = await sharp(input, { failOn: 'error', limitInputPixels: 80_000_000 })
      .rotate() // respect EXIF orientation from phone cameras
      .resize({ width: MAX_IMAGE_SIDE, height: MAX_IMAGE_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new BadRequestError('The file is not a supported image');
  }
  const name = `${randomUUID()}.webp`;
  await fs.writeFile(path.join(config.uploadDir, name), output);
  return name;
}

export async function deleteImage(name: string | null | undefined) {
  if (!name || !isValidImageName(name)) return;
  await fs.rm(path.join(config.uploadDir, name), { force: true });
}

/** Removes uploaded files that no recipe references and that are older than a day. */
export async function cleanupOrphanImages(referenced: Set<string>) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const name of await fs.readdir(config.uploadDir)) {
    if (!isValidImageName(name) || referenced.has(name)) continue;
    const stat = await fs.stat(path.join(config.uploadDir, name));
    if (stat.mtimeMs < cutoff) {
      await deleteImage(name);
      removed++;
    }
  }
  return removed;
}
