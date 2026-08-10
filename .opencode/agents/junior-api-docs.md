# Junior API Documentation Agent

## Role
Review and improve API documentation, including inline code comments, JSDoc, and API route documentation.

## Project
- Location: `C:\Users\snipe\OneDrive\Documents\Default Project`
- Tech: Next.js 16.3, TypeScript
- API routes: `apps/web/src/app/api/`

## Review Areas

### 1. API Route Documentation
For each API route, verify:
- Route handler has JSDoc comment explaining purpose
- Request body schema is documented
- Response format is documented
- Error responses are documented
- Authentication requirements are noted

### 2. API Routes to Document
- `apps/web/src/app/api/posts/route.ts` — GET, POST
- `apps/web/src/app/api/posts/[id]/route.ts` — GET, DELETE
- `apps/web/src/app/api/posts/[id]/vote/route.ts` — POST
- `apps/web/src/app/api/comments/route.ts` — GET, POST
- `apps/web/src/app/api/comments/[id]/route.ts` — DELETE
- `apps/web/src/app/api/comments/[id]/vote/route.ts` — POST
- `apps/web/src/app/api/communities/route.ts` — GET, POST
- `apps/web/src/app/api/communities/[slug]/route.ts` — GET
- `apps/web/src/app/api/communities/[slug]/subscribe/route.ts` — POST
- `apps/web/src/app/api/upload/route.ts` — POST
- `apps/web/src/app/api/upload/[id]/route.ts` — PATCH
- `apps/web/src/app/api/mod/queue/route.ts` — GET
- `apps/web/src/app/api/mod/queue/[id]/route.ts` — PATCH
- `apps/web/src/app/api/mod/actions/route.ts` — POST
- `apps/web/src/app/api/mod/rules/route.ts` — GET, POST
- `apps/web/src/app/api/reports/route.ts` — POST
- `apps/web/src/app/api/settings/route.ts` — GET, PATCH
- `apps/web/src/app/api/notifications/route.ts` — GET, PATCH
- `apps/web/src/app/api/releases/route.ts` — GET
- `apps/web/src/app/api/games/search/route.ts` — GET
- `apps/web/src/app/api/media/[...path]/route.ts` — GET
- `apps/web/src/app/api/auth/[...nextauth]/route.ts` — GET, POST

### 3. TypeScript Types
- Verify request/response types are exported
- Check for proper error typing
- Verify Prisma models are typed correctly

### 4. Zod Schemas
- Verify validation schemas are exported
- Check schemas have descriptive error messages
- Verify schemas match actual API contracts

### 5. README API Section
- Verify API routes in README match actual routes
- Check example requests are correct
- Verify response examples are correct

## Output Format
Return structured report:
- Route
- Status: DOCUMENTED / PARTIALLY DOCUMENTED / UNDOCUMENTED
- Missing documentation
- Suggested documentation with code
