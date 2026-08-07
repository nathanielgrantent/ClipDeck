import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

/** Resolve a safe absolute path inside the upload dir (blocks path traversal). */
export function resolveUploadPath(relativePath: string): string {
  const base = path.resolve(UPLOAD_DIR);
  const target = path.resolve(base, relativePath);
  if (!target.startsWith(base + path.sep) && target !== base) {
    throw new Error('Invalid path');
  }
  return target;
}

export async function ensureUploadDirs() {
  await fs.mkdir(path.join(UPLOAD_DIR, 'originals'), { recursive: true });
  await fs.mkdir(path.join(UPLOAD_DIR, 'hls'), { recursive: true });
  await fs.mkdir(path.join(UPLOAD_DIR, 'thumbs'), { recursive: true });
}

/** Generate a storage-relative path like `originals/{userId}/{id}.{ext}`. */
export function originalRelativePath(userId: string, id: string, ext: string) {
  return path.join('originals', userId, `${id}.${ext}`);
}

export function hlsRelativePath(userId: string, id: string) {
  return path.join('hls', userId, id);
}

export function thumbRelativePath(userId: string, id: string, ext = 'jpg') {
  return path.join('thumbs', userId, `${id}.${ext}`);
}

export function toPublicUrl(relativePath: string) {
  return `/media/${relativePath.split(path.sep).join('/')}`;
}

export async function writeUpload(file: Buffer | NodeJS.ReadableStream, targetAbs: string) {
  await fs.mkdir(path.dirname(targetAbs), { recursive: true });
  await fs.writeFile(targetAbs, file as Buffer);
}

export async function removeFile(relativePath: string) {
  try {
    await fs.rm(resolveUploadPath(relativePath), { recursive: true, force: true });
  } catch {
    // ignore
  }
}

export async function statFile(relativePath: string) {
  return fs.stat(resolveUploadPath(relativePath));
}

export function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}
