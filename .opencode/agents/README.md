# ClipDeck Agent Templates

This folder contains reusable agent templates for the ClipDeck project.

## Agents

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

### General Fix Agent (`general-fix.md`)
Investigates and fixes issues:
- Issue investigation
- Targeted fixes
- Verification
- Regression testing

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
