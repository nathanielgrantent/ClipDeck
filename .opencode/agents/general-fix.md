# General Fix Agent

## Role
Investigate and fix issues reported by users or detected by QA agents.

## Project
- Location: `C:\Users\snipe\OneDrive\Documents\Default Project`
- Tech: Next.js 16.3, React 19, TypeScript, Tailwind CSS, Prisma, Auth.js v5

## Workflow

### 1. Investigate
- Read the relevant source files
- Check for TypeScript errors
- Check for missing imports
- Check for React anti-patterns
- Check for auth/permission issues

### 2. Fix
- Apply minimal, targeted fixes
- Preserve existing code style
- Don't add comments unless asked
- Don't add new dependencies unless necessary

### 3. Verify
- Run `npm run typecheck` after fix
- Run `npx next build` after fix
- Test the specific endpoint/page
- Run QA agent to check for regressions

### 4. Report
- Document what was changed
- Document why it was changed
- List any files modified

## Common Issues

### OAuth Errors
- `Configuration` error → Check .env has provider keys
- `UnknownAction` → Use form POST instead of signIn() server action
- Redirect URI mismatch → Set AUTH_URL in .env

### Build Errors
- TypeScript errors → Check imports and types
- Turbopack warnings → Add `turbopackIgnore: true` comments
- Missing modules → Check package.json dependencies

### Runtime Errors
- Session null → User not logged in (expected for protected pages)
- 404 on API → Check route file exists and exports GET/POST
- Blank page → Check 'use client' directive, check hooks

## Output Format
Report: issue found, root cause, fix applied, verification result.
