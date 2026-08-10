import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();

function parseArray(value) {
  try {
    const v = JSON.parse(value ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function json(value) {
  return JSON.stringify(value ?? []);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.resolve(__dirname, '../../../packages/seed/data/console-games.json');

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function seedGames() {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const platformMap = {
    STEAM: 'STEAM',
    PC: 'PC',
    PS5: 'PS5',
    PS4: 'PS4',
    PS3: 'PS4',
    XBOX: 'XBOX',
    SWITCH: 'SWITCH',
    OTHER: 'OTHER',
  };

  let created = 0;
  let updated = 0;
  for (const entry of raw) {
    const platform = platformMap[entry.platform] ?? 'OTHER';
    const normalizedName = normalize(entry.name);
    const existing = await prisma.game.findUnique({
      where: { normalizedName },
    });
    if (existing) {
      const needsUpdate =
        existing.platform !== platform ||
        (entry.aliases?.length &&
          JSON.stringify(parseArray(existing.aliases)) !== JSON.stringify(entry.aliases));
      if (needsUpdate) {
        await prisma.game.update({
          where: { id: existing.id },
          data: { platform, aliases: json(entry.aliases ?? parseArray(existing.aliases)) },
        });
        updated++;
      }
      continue;
    }
    await prisma.game.create({
      data: {
        name: entry.name,
        normalizedName,
        platform,
        aliases: json(entry.aliases ?? []),
        popularity: 100,
      },
    });
    created++;
  }
  console.log(`[seed] games: ${created} created, ${updated} updated (${raw.length} entries)`);
}

async function ensureSystemUser() {
  return prisma.user.upsert({
    where: { username: 'clipdeck' },
    update: {},
    create: {
      username: 'clipdeck',
      name: 'ClipDeck',
      role: 'ADMIN',
      email: 'system@clipdeck.local',
    },
  });
}

async function seedCommunities() {
  const systemUser = await ensureSystemUser();
  const defaults = [
    {
      slug: 'clipdeckshowcase',
      name: 'ClipDeck Showcase',
      description:
        'The main community for sharing clips and screenshots. Post any game, tag it properly, and get feedback.',
      rules: [
        'Be kind and constructive.',
        'Tag posts with the correct game and platform.',
        'No spam, self-promo spam, or NSFW content.',
        'Credit creators when reposting highlights.',
      ],
    },
    {
      slug: 'gaming',
      name: 'Gaming',
      description: 'General gaming discussion, clips, and news across all platforms.',
      rules: ['Stay on topic', 'No harassment or hate speech', 'Mark spoilers'],
    },
    {
      slug: 'esports',
      name: 'Esports',
      description: 'Competitive highlights, tournament clips, and esports discussion.',
      rules: ['No spoilers in titles', 'Credit the tournament/clip source'],
    },
    {
      slug: 'pc-master-race',
      name: 'PC Master Race',
      description: 'PC gaming clips, setups, benchmarks, and Steam content.',
      rules: ['PC content only', 'No console war baiting'],
    },
    {
      slug: 'console-gamers',
      name: 'Console Gamers',
      description: 'PlayStation, Xbox, and Switch clips and discussion.',
      rules: ['Be respectful across platforms', 'Flair posts with your console'],
    },
    {
      slug: 'indies',
      name: 'Indie Gems',
      description: 'Underrated indie games and clips worth spotlighting.',
      rules: ['Indie titles only', 'No major studio releases'],
    },
  ];

  for (const c of defaults) {
    const existing = await prisma.community.findUnique({ where: { slug: c.slug } });
    if (!existing) {
      const owner = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      await prisma.community.create({
        data: {
          slug: c.slug,
          name: c.name,
          description: c.description,
          rules: json(c.rules),
          ownerId: owner?.id ?? systemUser.id,
        },
      });
      console.log(`[seed] community created: ${c.slug}`);
    }
  }
}

async function seedAutomodRules() {
  const existing = await prisma.automodRule.count({ where: { scope: 'GLOBAL' } });
  if (existing > 0) {
    console.log('[seed] automod rules already present, skipping');
    return;
  }
  const systemUser = await ensureSystemUser();
  const owner = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  const rules = [
    {
      name: 'Spam links',
      scope: 'GLOBAL',
      priority: 100,
      conditions: {
        linkCountAbove: 2,
        blockedDomains: [
          'bit.ly',
          'tinyurl.com',
          'spam.tk',
          'free-vbucks-now.xyz',
          'cheap-followers.example',
        ],
      },
      actions: [
        {
          action: 'REMOVE',
          reason: 'Multiple suspicious links detected (spam rule)',
          category: 'SPAM',
          weight: 10,
          notifyUser: true,
          log: true,
        },
      ],
      scoreThreshold: 15,
      escalateTo: 'REMOVE',
    },
    {
      name: 'Profanity (removal)',
      scope: 'GLOBAL',
      priority: 90,
      conditions: {
        keywords: [
          'fuck you',
          'shut the f',
          'kill yourself',
          'kys',
          'retard',
          'cunt',
          'gook',
          'spic',
          'nigger',
          'faggot',
        ],
      },
      actions: [
        {
          action: 'REMOVE',
          reason: 'Hateful or abusive language (automod)',
          category: 'ABUSE',
          weight: 8,
          notifyUser: true,
          log: true,
        },
      ],
    },
    {
      name: 'New user holding',
      scope: 'GLOBAL',
      priority: 50,
      conditions: {
        newUserOnly: true,
        minKarma: 0,
      },
      actions: [
        {
          action: 'FILTER',
          reason: 'New account - held for mod review',
          category: 'NEW_USER',
          weight: 1,
          notifyUser: false,
          log: true,
        },
      ],
    },
    {
      name: 'NSFW/SFW filter',
      scope: 'GLOBAL',
      priority: 95,
      conditions: {
        isNSFW: true,
      },
      actions: [
        {
          action: 'REMOVE',
          reason: 'NSFW content is not allowed on this SFW-only platform',
          category: 'NSFW',
          weight: 12,
          notifyUser: true,
          log: true,
        },
      ],
    },
    {
      name: 'Mass capitalized shouting',
      scope: 'GLOBAL',
      priority: 30,
      conditions: { capitalizedWordsAbove: 4 },
      actions: [
        {
          action: 'NOTIFY',
          reason: 'Please avoid excessive caps - looks like shouting',
          category: 'ETIQUETTE',
          weight: 1,
          notifyUser: true,
          log: true,
        },
      ],
    },
  ];

  for (const r of rules) {
    await prisma.automodRule.create({
      data: {
        ...r,
        authorId: owner?.id ?? systemUser.id,
        actions: json(r.actions),
        conditions: json(r.conditions),
      },
    });
  }
  console.log(`[seed] automod rules created: ${rules.length}`);
}

async function seedReleases() {
  const existing = await prisma.desktopRelease.count();
  if (existing > 0) {
    console.log('[seed] releases already present, skipping');
    return;
  }
  const GITHUB_REPO = process.env.GITHUB_REPO || 'https://github.com/clipdeck/clipdeck';
  const releases = [
    {
      version: '1.0.0',
      platform: 'WIN',
      url: `${GITHUB_REPO}/releases/download/v1.0.0/ClipDeck-Setup-1.0.0.exe`,
      notes: 'Initial release of ClipDeck Desktop.\n- Local clip uploader with drag & drop\n- Screen capture with hotkey\n- System notifications\n- 500MB storage quota meter\n- Tray icon with global hotkey',
      publishedAt: new Date('2026-08-07'),
    },
    {
      version: '1.0.0',
      platform: 'MAC',
      url: `${GITHUB_REPO}/releases/download/v1.0.0/ClipDeck-1.0.0.dmg`,
      notes: 'Initial release of ClipDeck Desktop for macOS.\n- Local clip uploader with drag & drop\n- Screen capture with hotkey\n- System notifications\n- 500MB storage quota meter\n- Menu bar icon with global hotkey',
      publishedAt: new Date('2026-08-07'),
    },
    {
      version: '1.0.0',
      platform: 'LINUX',
      url: `${GITHUB_REPO}/releases/download/v1.0.0/ClipDeck-1.0.0.AppImage`,
      notes: 'Initial release of ClipDeck Desktop for Linux.\n- Local clip uploader with drag & drop\n- Screen capture with hotkey\n- System notifications\n- 500MB storage quota meter\n- Tray icon with global hotkey',
      publishedAt: new Date('2026-08-07'),
    },
  ];
  for (const r of releases) {
    await prisma.desktopRelease.create({ data: r });
  }
  console.log(`[seed] releases created: ${releases.length}`);
}

async function main() {
  await seedGames();
  await seedCommunities();
  await seedAutomodRules();
  await seedReleases();
  console.log('[seed] done');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
