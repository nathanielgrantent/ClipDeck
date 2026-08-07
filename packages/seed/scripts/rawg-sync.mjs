#!/usr/bin/env node
/**
 * Optional: enrich the catalog from the free RAWG video games API.
 * Requires RAWG_API_KEY in apps/web/.env (free from rawg.io/apidocs).
 * Usage: npm run rawg:sync -w @gamingclips/seed  [--pages=2]
 */
import { PrismaClient, Platform } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../apps/web/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

const prisma = new PrismaClient();
const API_KEY = process.env.RAWG_API_KEY;
if (!API_KEY) {
  console.error('RAWG_API_KEY not set in apps/web/.env');
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    return [k, rest.join('=') || 'true'];
  }),
);
const PAGES = Number(args.pages ?? 2);

const PLATFORM_MAP = {
  playstation5: 'PS5',
  playstation4: 'PS4',
  playstation3: 'PS4',
  xbox-series-x: 'XBOX',
  xbox-one: 'XBOX',
  xbox360: 'XBOX',
  pc: 'PC',
  nintendo-switch: 'SWITCH',
  'wii-u': 'SWITCH',
  nintendo-3ds: 'SWITCH',
};

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function main() {
  let imported = 0;
  for (let page = 1; page <= PAGES; page++) {
    const url = `https://api.rawg.io/api/games?key=${API_KEY}&page=${page}&page_size=40`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`RAWG error ${res.status}`);
      break;
    }
    const data = await res.json();
    for (const g of data.results ?? []) {
      const platform = g.platforms?.map((p) => PLATFORM_MAP[p.platform?.slug])?.find(Boolean);
      const name = g.name;
      const normalizedName = normalize(name);
      const existing = await prisma.game.findUnique({ where: { normalizedName } });
      if (existing) {
        if (platform && existing.platform === 'OTHER') {
          await prisma.game.update({
            where: { id: existing.id },
            data: { platform },
          });
        }
        if (!existing.coverUrl && g.background_image) {
          await prisma.game.update({
            where: { id: existing.id },
            data: { coverUrl: g.background_image },
          });
        }
        continue;
      }
      try {
        await prisma.game.create({
          data: {
            name,
            normalizedName,
            platform: platform ?? 'OTHER',
            coverUrl: g.background_image ?? null,
            popularity: g.rating ? Math.round(g.rating * 20) : 0,
          },
        });
        imported++;
      } catch (e) {
        if (e.code !== 'P2002') throw e;
      }
    }
    await new Promise((r) => setTimeout(r, 800)); // rate limit
  }
  console.log(`[rawg-sync] done. ${imported} new games imported`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
