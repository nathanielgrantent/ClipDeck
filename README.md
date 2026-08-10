# ClipDeck

Open-source gaming clip platform. Share clips and screenshots, tag them by game and platform, and browse communities. Built with Next.js, Prisma, Tailwind CSS, and a Tauri desktop app.

## Features

- **Community-driven** — Create and join communities for any game or topic
- **Clip sharing** — Upload videos (HLS adaptive streaming) and screenshots with automatic transcoding
- **Game tagging** — Tag posts with games and platforms; browse by game with popularity rankings
- **Voting & comments** — Upvote/downvote posts and comments with nested threaded replies
- **Automod** — Keyword, regex, domain, and account-age filters with configurable severity scoring
- **Moderation queue** — Community moderators review flagged content; site admins see the global queue
- **Reports** — Users can report posts or comments; reports are routed to community moderators
- **Real-time presence** — Online/idle/offline status with Redis-backed pub/sub
- **Background worker** — BullMQ job queue for video transcoding, thumbnail generation, and HLS packaging
- **Desktop app** — Cross-platform Tauri client (Windows, macOS, Linux) with auto-updates
- **Auth** — Google and Discord OAuth via NextAuth v5
- **Storage quotas** — Per-user storage limits with usage tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 3, SWR |
| Backend | Next.js API routes, Prisma ORM |
| Database | SQLite (dev) / PostgreSQL 16 (prod) |
| Queue | BullMQ + Redis 7 |
| Auth | NextAuth v5 (Auth.js) |
| Desktop | Tauri 2 |
| Build | npm workspaces, TypeScript 5 |
| Deploy | Docker Compose |

## Prerequisites

- **Node.js** 22+ (see `.nvmrc`)
- **npm** 10+
- **Docker & Docker Compose** (for production / self-hosting)
- **FFmpeg** (for video transcoding; optional in dev)

## Quick Start (Docker)

The fastest way to run ClipDeck in production:

```bash
# Clone the repository
git clone https://github.com/nathanielgrantent/ClipDeck.git
cd ClipDeck

# Create your .env file
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env and set AUTH_SECRET

# Start all services
docker compose -f infra/docker-compose.yml up -d

# Run database migrations
docker compose -f infra/docker-compose.yml exec web npx prisma migrate deploy

# Seed the database (optional)
docker compose -f infra/docker-compose.yml exec web node prisma/seed.mjs
```

The app will be available at `http://localhost:3000`.

## Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env` — at minimum set `AUTH_SECRET` (generate with `openssl rand -base64 32`).

For local SQLite development, update `DATABASE_URL` in `.env`:

```
DATABASE_URL="file:./dev.db"
```

### 3. Push the database schema

```bash
npm run prisma:push
npm run prisma:generate
```

### 4. Seed the database (optional)

```bash
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Other commands

```bash
# Typecheck all packages
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build

# Start the background worker (video transcoding)
npm run worker
```

## Environment Variables

All environment variables are documented in `apps/web/.env.example`. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite (`file:./dev.db`) or PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth session encryption key |
| `REDIS_URL` | No | Redis connection for BullMQ (worker) and presence |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | No | Google OAuth credentials |
| `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | No | Discord OAuth credentials |
| `NEXT_PUBLIC_APP_URL` | No | Public URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_NAME` | No | Site name (default: `ClipDeck`) |
| `UPLOAD_DIR` | No | Upload storage directory (default: `/data/uploads`) |
| `RAWG_API_KEY` | No | RAWG.io API key for game metadata sync |
| `FFMPEG_PATH` | No | Path to ffmpeg binary (auto-detected if empty) |
| `GITHUB_REPO` | No | GitHub repo URL for desktop release downloads |

## Desktop App Downloads

Download the latest release for your platform from the [Downloads page](https://cancelled-constant-clusters-furthermore.trycloudflare.com/download) or from [GitHub Releases](https://github.com/nathanielgrantent/ClipDeck/releases).

| Platform | Format | Link |
|----------|--------|------|
| Windows | Installer (.exe) | [Download](https://github.com/nathanielgrantent/ClipDeck/releases/latest/download/ClipDeck-Setup-1.0.0.exe) |
| macOS | Disk Image (.dmg) | [Download](https://github.com/nathanielgrantent/ClipDeck/releases/latest/download/ClipDeck-1.0.0.dmg) |
| Linux | AppImage | [Download](https://github.com/nathanielgrantent/ClipDeck/releases/latest/download/ClipDeck-1.0.0.AppImage) |

## Project Structure

```
clipdeck/
├── apps/
│   └── web/                    # Next.js web application
│       ├── prisma/
│       │   ├── schema.prisma           # SQLite schema (source of truth)
│       │   ├── schema.postgres.prisma  # PostgreSQL schema (generated)
│       │   └── seed.mjs               # Database seeder
│       ├── src/
│       │   ├── app/                    # Next.js App Router
│       │   │   ├── api/                # API routes
│       │   │   ├── (auth)/             # Auth pages (login, register)
│       │   │   └── layout.tsx          # Root layout
│       │   ├── components/             # React components
│       │   │   ├── auth/               # Auth components
│       │   │   ├── community/          # Community components
│       │   │   ├── game/               # Game components
│       │   │   ├── layout/             # App shell, sidebar, nav
│       │   │   ├── post/               # Post components
│       │   │   ├── posts/              # Post feed components
│       │   │   ├── ui/                 # Shared UI primitives
│       │   │   └── upload/             # Upload components
│       │   ├── hooks/                  # Custom React hooks
│       │   ├── lib/                    # Server utilities
│       │   │   ├── moderation.ts       # Automod logic
│       │   │   ├── moderators.ts       # Permission helpers
│       │   │   ├── validation.ts       # Zod schemas
│       │   │   └── prisma.ts           # Prisma client singleton
│       │   └── types/                  # TypeScript types
│       └── worker/                     # BullMQ background worker
├── packages/
│   ├── shared/                 # Shared types, constants, helpers
│   └── seed/                   # Game data sync scripts
├── scripts/
│   └── gen-postgres-schema.mjs # Generate Postgres schema from SQLite
├── infra/
│   ├── docker-compose.yml      # Docker Compose for production
│   ├── web.Dockerfile          # Web app Dockerfile
│   └── worker.Dockerfile       # Worker Dockerfile
├── .github/workflows/
│   ├── ci.yml                  # CI pipeline
│   └── release.yml             # Release automation
└── .nvmrc                      # Node version
```

## API Routes

### Posts
- `GET /api/posts` — List posts (with filters)
- `POST /api/posts` — Create a post
- `GET /api/posts/[id]` — Get a single post
- `DELETE /api/posts/[id]` — Delete a post

### Comments
- `GET /api/comments` — List comments for a post
- `POST /api/comments` — Create a comment
- `DELETE /api/comments/[id]` — Delete a comment

### Votes
- `POST /api/votes` — Upvote/downvote/remove vote

### Communities
- `GET /api/communities` — List communities
- `POST /api/communities` — Create a community
- `GET /api/communities/[slug]` — Get community details
- `POST /api/communities/[slug]/subscribe` — Subscribe/unsubscribe

### Upload
- `POST /api/upload` — Start an upload session (returns presigned URL)

### Moderation
- `GET /api/mod/queue` — List mod queue items
- `POST /api/mod/actions` — Take a moderation action (approve, remove, ban)
- `GET /api/mod/rules` — List automod rules
- `POST /api/mod/rules` — Create an automod rule

### Reports
- `POST /api/reports` — Report a post or comment

### Auth
- NextAuth API routes (`/api/auth/*`)

### User
- `GET /api/me` — Current user profile
- `PATCH /api/me` — Update profile

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run typecheck and lint:
   ```bash
   npm run typecheck
   npm run lint
   ```
5. Commit your changes (`git commit -m 'Add my feature'`)
6. Push to the branch (`git push origin feature/my-feature`)
7. Open a Pull Request

Please follow the existing code style. All code is TypeScript with strict typing.

## License

[MIT](LICENSE) — see the LICENSE file for details.
