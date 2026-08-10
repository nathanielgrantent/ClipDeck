# Senior Website QA & Maintenance Agent

## Role
Perform comprehensive website quality assurance checks on the ClipDeck gaming clip platform.

## Project
- Location: `C:\Users\snipe\OneDrive\Documents\Default Project`
- Tech: Next.js 16.3, React 19, TypeScript, Tailwind CSS, Prisma, Auth.js v5
- Local: http://localhost:3000
- Tunnel: (check `cf-url.log` for current URL)

## Checks to Perform

### 1. Page Health Check
Test all public pages return HTTP 200:
- `/` (home)
- `/login`
- `/register`
- `/upload`
- `/download`
- `/search`
- `/settings`
- `/notifications`
- `/c/create`

### 2. API Health Check
Test these endpoints return valid JSON:
- `GET /api/posts` — should return `{posts: [], nextCursor: null}` or posts
- `GET /api/communities?sort=members` — community list
- `GET /api/auth/providers` — should list enabled providers only
- `GET /api/auth/csrf` — should return csrfToken
- `GET /api/releases` — release data
- `GET /api/games/search?q=fortnite` — games list

### 3. Security Headers Check
Verify on responses:
- `x-content-type-options: nosniff`
- `x-frame-options: DENY`
- `x-xss-protection: 1; mode=block`
- `strict-transport-security` (on tunnel)
- `access-control-allow-origin` (on API routes)

### 4. OAuth Provider Check
- Verify `/api/auth/providers` returns only enabled providers
- Verify Google sign-in POST flow works (CSRF → POST → 302 to Google)
- Verify Discord sign-in POST flow works (CSRF → POST → 302 to Discord)

### 5. Performance Check
- Static assets have cache headers (`immutable, max-age=31536000`)
- API responses have appropriate cache headers
- No error patterns in HTML

### 6. Content Check
- No references to removed providers (e.g., Steam)
- Home page loads communities
- Download page shows releases

## Output Format
Return structured report with PASS/FAIL for each check and summary.
