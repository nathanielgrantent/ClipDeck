# ClipDeck Agent Templates

This folder contains reusable agent templates for the ClipDeck project.

## Senior Agents (2)

### Senior Website QA Agent (`senior-website-qa.md`)
Performs comprehensive website quality assurance:
- Page health checks (HTTP 200)
- API health checks (valid JSON)
- Security headers verification
- OAuth provider checks
- Performance checks
- Content checks

### Senior Project Changes Agent (`senior-project-changes.md`)
Reviews code changes for correctness:
- Auth system review
- Proxy/middleware review
- Page/component review
- Config review
- Anti-pattern detection

### Senior Security Audit Agent (`senior-security-audit.md`)
Deep security audit of the codebase:
- Authentication security
- Authorization checks
- Input validation
- Security headers
- Rate limiting
- File security
- Dependency security
- Data exposure

### Senior Performance Optimization Agent (`senior-performance-audit.md`)
Performance audit and optimization:
- Frontend performance (React, SWR, images)
- Bundle optimization
- API performance
- Database performance
- Caching strategy
- Code splitting

## Executive Agents (2)

### Executive Audit Agent (`executive-audit.md`)
Final production readiness audit:
- Build verification
- Server health
- Route inventory
- Security headers
- Caching strategy
- OAuth flow
- Database integrity
- File integrity

### Executive Git Repository Audit Agent (`executive-git-repo-audit.md`)
Git repository health and public readiness:
- Repository structure
- Commit quality
- README quality
- Documentation completeness
- CI/CD configuration
- Security (no secrets)
- Branch strategy
- License compliance

### Executive Architecture Review Agent (`executive-architecture-review.md`)
Overall architecture and design review:
- Project structure
- Code organization
- Design patterns
- Type safety
- Authentication architecture
- Database architecture
- API design
- Frontend architecture
- Scalability concerns

## Junior Agents (4)

### General Fix Agent (`general-fix.md`)
Investigates and fixes issues:
- Issue investigation
- Targeted fixes
- Verification
- Regression testing

### Junior UI Polish Agent (`junior-ui-polish.md`)
UI consistency and polish review:
- Component consistency
- Responsive design
- Accessibility
- Loading states
- Error states
- Animation & transitions
- Dark mode

### Junior Test Coverage Agent (`junior-test-coverage.md`)
Test coverage review and improvement:
- Existing test quality
- Missing test coverage
- Test reliability
- Test patterns
- Test configuration

### Junior API Documentation Agent (`junior-api-docs.md`)
API documentation review:
- Route documentation
- TypeScript types
- Zod schemas
- README API section

### Junior DevOps Agent (`junior-devops.md`)
DevOps configuration review:
- GitHub Actions CI/CD
- Docker configuration
- Environment configuration
- Database management
- Development tooling

## Usage

These templates are designed to be used with the Task tool in OpenCode. Each agent:

1. Reads the relevant source files
2. Performs structured checks
3. Returns PASS/FAIL for each check
4. Provides actionable recommendations

## Adding New Agents

To add a new agent:
1. Create a new `.md` file in this folder
2. Follow the template format (Role, Project, Checks, Output)
3. Reference it in your OpenCode config
