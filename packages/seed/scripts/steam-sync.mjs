#!/usr/bin/env node
/**
 * Optional: sync the full Steam catalog (free, no API key) into the DB.
 * Usage: npm run steam:sync -w @gamingclips/seed
 *   [--limit=5000]       cap how many apps to import (default: all)
 *   [--min-players=0]    only import apps above a peak-players threshold
 *   [--fetch-meta]       also fetch appdetails metadata (slower, rate-limited)
 */
import { PrismaClient, Platform } from '@prisma/client';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// load apps/web/.env
const envPath = path.resolve(__dirname, '../../apps/web/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

const prisma = new PrismaClient();

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    return [k, rest.join('=') || 'true'];
  }),
);

const LIMIT = Number(args.limit ?? Infinity);
const FETCH_META = args['fetch-meta'] === 'true';

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function getAppList() {
  const res = await fetch(
    'https://api.steampowered.com/ISteamApps/GetAppList/v2/',
  );
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const data = await res.json();
  return data.applist.apps;
}

async function fetchAppDetails(appId, type) {
  const res = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appId}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  const info = data?.[appId];
  if (!info?.success || !info.data) return null;
  const d = info.data;
  if (type && d.type !== type) return null;
  return d;
}

async function main() {
  console.log('[steam-sync] fetching app list...');
  const apps = await getAppList();
  console.log(`[steam-sync] ${apps.length} apps total`);

  let imported = 0;
  let skipped = 0;
  for (const app of apps) {
    if (imported >= LIMIT) break;
    if (!app.name || !app.name.trim()) {
      skipped++;
      continue;
    }
    const appId = Number(app.appid);
    if (!Number.isInteger(appId)) {
      skipped++;
      continue;
    }

    const existing = await prisma.game.findUnique({
      where: { steamAppId: appId },
    });
    if (existing) {
      skipped++;
      continue;
    }

    let coverUrl = null;
    if (FETCH_META) {
      const meta = await fetchAppDetails(appId, 'game');
      if (meta?.header_image) coverUrl = meta.header_image;
      // be nice to the Steam store API
      await new Promise((r) => setTimeout(r, 120));
    }

    const normalizedName = normalize(app.name);
    const dup = await prisma.game.findUnique({ where: { normalizedName } });
    if (dup) {
      // already present (e.g. from bundled console data) - just attach steam id
      await prisma.game.update({
        where: { id: dup.id },
        data: { steamAppId: appId, platform: 'STEAM' },
      });
      imported++;
      continue;
    }

    try {
      await prisma.game.create({
        data: {
          name: app.name,
          normalizedName,
          platform: 'STEAM',
          steamAppId: appId,
          coverUrl,
          popularity: 50,
        },
      });
      imported++;
    } catch (e) {
      if (e.code === 'P2002') {
        skipped++;
        continue;
      }
      throw e;
    }

    if (imported % 1000 === 0) {
      console.log(`[steam-sync] ${imported} imported...`);
    }
  }

  console.log(`[steam-sync] done. ${imported} imported, ${skipped} skipped/dup`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
