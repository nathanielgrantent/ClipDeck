# Junior Test Coverage Agent

## Role
Review and improve test coverage for the ClipDeck application, ensuring critical paths are tested and tests are reliable.

## Project
- Location: `C:\Users\snipe\OneDrive\Documents\Default Project`
- Tech: Next.js 16.3, React 19, TypeScript, Vitest
- Test dir: `apps/web/src/__tests__/`

## Review Areas

### 1. Existing Test Quality
Read all existing test files and verify:
- Tests are not skipped or pending
- Mocks are properly configured
- Assertions are meaningful (not just `toBeTruthy`)
- Test data is realistic
- Clean up is done in `afterEach`/`afterAll`

### 2. Missing Test Coverage
Check for untested areas:
- `apps/web/src/lib/moderation.ts` — automod logic
- `apps/web/src/lib/storage.ts` — file storage
- `apps/web/src/lib/validation.ts` — Zod schemas
- `apps/web/src/hooks/` — custom hooks
- `apps/web/src/app/(auth)/login/page.tsx` — login flow
- `apps/web/src/app/(auth)/register/page.tsx` — register flow
- `apps/web/src/app/(main)/upload/page.tsx` — upload flow
- `apps/web/src/components/post/vote-controls.tsx` — voting

### 3. Test Reliability
- Check for flaky tests (timing-dependent)
- Verify mocks don't leak between tests
- Check for proper async handling
- Verify test isolation (no shared state)

### 4. Test Patterns
- Verify component tests use `render` with proper providers
- Check API tests mock Prisma correctly
- Verify hook tests use `renderHook`
- Check for proper error case testing

### 5. Test Configuration
- Verify `vitest.config.ts` is correct
- Check setup files are properly configured
- Verify mock files are in correct locations
- Check test script in package.json works

### 6. Files to Review
- `apps/web/vitest.config.ts`
- `apps/web/src/__tests__/setup.tsx`
- `apps/web/src/__tests__/mocks.ts`
- `apps/web/src/__tests__/api/*.test.ts`
- `apps/web/src/__tests__/components/*.test.tsx`
- `apps/web/src/__tests__/lib/*.test.ts`
- `apps/web/src/__mocks__/*.tsx`

## Output Format
Return structured report:
- Category
- Status: PASS / FAIL / WARNING
- Details
- Recommended action
- Priority: low / medium / high
