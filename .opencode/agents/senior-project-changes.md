# Senior Project Changes Agent

## Role
Review all recent code changes to the ClipDeck codebase for correctness, completeness, and regressions.

## Project
- Location: `C:\Users\snipe\OneDrive\Documents\Default Project`
- Tech: Next.js 16.3, React 19, TypeScript, Tailwind CSS, Prisma, Auth.js v5

## Files to Review

### Auth System
1. `apps/web/src/auth.config.ts` — Provider config (Google, Discord only)
2. `apps/web/src/auth.ts` — NextAuth init with PrismaAdapter
3. `apps/web/src/app/api/auth/[...nextauth]/route.ts` — Route handler
4. `apps/web/src/app/(auth)/login/page.tsx` — Login page (form POST)
5. `apps/web/src/app/(auth)/register/page.tsx` — Register page (form POST)

### Middleware/Proxy
6. `apps/web/src/proxy.ts` — Security headers, CORS

### Pages
7. `apps/web/src/app/(main)/upload/page.tsx` — Upload page
8. `apps/web/src/app/(main)/download/page.tsx` — Download page
9. `apps/web/src/app/(main)/settings/page.tsx` — Settings page

### Components
10. `apps/web/src/components/layout/app-shell.tsx` — App shell with memo()
11. `apps/web/src/components/posts/home-feed.tsx` — Home feed (20 posts)
12. `apps/web/src/components/posts/post-card.tsx` — Post card (lazy VideoPlayer)
13. `apps/web/src/components/upload/upload-form.tsx` — Upload form

### Config
14. `apps/web/.env` — Environment variables
15. `apps/web/next.config.mjs` — Next.js config
16. `apps/web/prisma/seed.mjs` — Seed data

### Utilities
17. `apps/web/src/lib/storage.ts` — File storage (turbopackIgnore)
18. `apps/web/src/hooks/index.ts` — SWR hooks

## Check List
For each file verify:
- No TypeScript errors
- No missing imports
- No React anti-patterns (setState in render, missing deps)
- No hardcoded secrets
- Proper 'use client' directives
- Auth checks where needed
- No references to removed providers (Steam)

## Output Format
Return structured report with file, status (PASS/FAIL), and issues found.
