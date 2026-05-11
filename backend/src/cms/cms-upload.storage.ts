import { existsSync, mkdirSync } from 'fs';
import { basename } from 'path';
import { BadRequestException } from '@nestjs/common';

export const SITE_MEDIA_DIR = `${process.cwd()}/uploads/site-media`;

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const ALLOWED_SITE_MEDIA_MIMES = new Set(Object.keys(MIME_EXT));

export function ensureSiteMediaDir(): void {
  if (!existsSync(SITE_MEDIA_DIR)) {
    mkdirSync(SITE_MEDIA_DIR, { recursive: true });
  }
}

export function extFromMime(mime: string): string | null {
  const e = MIME_EXT[mime.toLowerCase()];
  return e ?? null;
}

/** Rejects path traversal and unexpected shapes; returns basename for disk lookup. */
export function assertSafeSiteMediaFilename(raw: string): string {
  const name = basename(raw.trim());
  if (!name || name !== raw.trim()) {
    throw new BadRequestException('Invalid media filename');
  }
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.[a-z0-9]+$/i.test(name)) {
    throw new BadRequestException('Invalid media filename');
  }
  return name;
}

export function contentTypeForSiteMediaFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}
