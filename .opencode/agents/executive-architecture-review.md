# Executive Architecture Review Agent

## Role
Review the overall architecture, code organization, and design patterns of the ClipDeck codebase for maintainability and scalability.

## Project
- Location: `C:\Users\snipe\OneDrive\Documents\Default Project`
- Tech: Next.js 16.3, React 19, TypeScript, Tailwind CSS, Prisma, Auth.js v5
- Monorepo: npm workspaces

## Review Areas

### 1. Project Structure
- Verify monorepo layout is correct
- Check apps/web follows Next.js conventions
- Verify packages/shared is properly used
- Check for circular dependencies
- Verify import paths are consistent

### 2. Code Organization
- Verify components are properly organized (auth/, community/, game/, layout/, post/, posts/, ui/, upload/)
- Check API routes are organized by feature
- Verify hooks are in dedicated directory
- Check lib/ contains only utilities
- Verify types/ is properly used

### 3. Design Patterns
- Verify Server Components vs Client Components are used correctly
- Check 'use client' directives are minimal and correct
- Verify data fetching patterns (SWR hooks)
- Check state management approach
- Verify error handling patterns

### 4. Type Safety
- Run `npm run typecheck` — must pass
- Verify strict TypeScript config
- Check for `any` types usage
- Verify proper type exports
- Check Zod schemas are used for validation

### 5. Authentication Architecture
- Verify Auth.js v5 is properly configured
- Check session strategy (JWT vs database)
- Verify OAuth flow is correct
- Check protected route patterns
- Verify role-based access control

### 6. Database Architecture
- Verify Prisma schema is well-designed
- Check for proper relations
- Verify indexes are optimal
- Check migration strategy
- Verify seed data is realistic

### 7. API Design
- Verify REST conventions are followed
- Check error response format
- Verify pagination is consistent
- Check filtering/sorting is standardized
- Verify API versioning (if any)

### 8. Frontend Architecture
- Verify component composition patterns
- Check prop drilling vs context
- Verify lazy loading strategy
- Check memo() usage is appropriate
- Verify SWR configuration

### 9. Security Architecture
- Verify security layers (headers, rate limiting, validation)
- Check auth middleware/proxy
- Verify CORS configuration
- Check file upload security

### 10. Scalability Concerns
- Identify bottlenecks
- Verify caching strategy
- Check database query efficiency
- Verify static generation vs server rendering
- Check resource cleanup

## Output Format
Return structured review:
- Category
- Status: GOOD / NEEDS IMPROVEMENT / CRITICAL
- Findings
- Recommendations
- Overall architecture score: 1-10
