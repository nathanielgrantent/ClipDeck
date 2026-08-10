import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

/** Resolve a safe absolute path inside the upload dir (blocks path traversal). */
export function resolveUploadPath(relativePath: string): string {
  // Block null bytes which can truncate paths at the OS level.
  if (relativePath.includes('\0')) {
    throw new Error('Invalid path');
  }
  const base = path.resolve(/* turbopackIgnore: true */ UPLOAD_DIR);
  // Decode any URL-encoded sequences and normalise separators.
  const decoded = decodeURIComponent(relativePath).split('/').join(path.sep);
  const target = path.resolve(base, decoded);
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
  if (Buffer.isBuffer(file)) {
    await fs.writeFile(targetAbs, file);
  } else {
    const chunks: Buffer[] = [];
    for await (const chunk of file) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    await fs.writeFile(targetAbs, Buffer.concat(chunks));
  }
}

export async function removeFile(relativePath: string) {
  try {
    await fs.rm(resolveUploadPath(relativePath), { recursive: true, force: true });
  } catch {
    // ignore
  }
}

export async function statFile(relativePath: string) {
  return fs.stat(/* turbopackIgnore: true */ resolveUploadPath(relativePath));
}

export function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}
