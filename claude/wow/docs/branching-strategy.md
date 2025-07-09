# Branching Strategy

## Overview

Simple GitHub Flow approach with integrated TDD workflow.

## Branch Types

### Main Branch
- `main` - Production-ready code, protected branch

### Feature Branches  
- `feature/*` - Roadmap items (includes planning docs, implementation, refactor, tests)
- Examples: `feature/user-authentication`, `feature/api-integration`

### Bug Fix Branches
- `bugfix/*` - TDD-driven bug fixes following Red-Green-Refactor cycle
- Examples: `bugfix/issue-123`, `bugfix/console-log-null-args`

## Workflows

### Feature Development
```bash
# Start roadmap item
git checkout -b feature/user-authentication

# Work includes all aspects:
# - Planning documentation
# - Implementation code  
# - Refactoring existing code
# - Test coverage
# - Documentation updates

git commit -m "feat: implement user authentication system"
gh pr create --title "User Authentication" --body "Implements user login and registration"
```

### TDD Bug Fix Process
1. **Report** → GitHub issue created with bug description
2. **Test Case** → Write failing test that reproduces the bug
3. **Red** → Commit failing test to `bugfix/issue-123`
4. **Green** → Implement minimal fix to make test pass
5. **Refactor** → Clean up implementation if needed
6. **Merge** → PR with both test and fix

```bash
# Bug: "spl/console/log doesn't handle null arguments"
git checkout -b bugfix/console-log-null-args

# 1. Write failing test first
./spl spl/app/exec -f tests/console-log-null.batch  # Should fail
git add . && git commit -m "test: add failing test for null args in console/log"

# 2. Implement fix
# Edit modules/spl/console/log.js to handle null
git add . && git commit -m "fix: handle null arguments in console/log"

# 3. Create PR
gh pr create --title "Fix console/log null argument handling"
```

## Design Principles

### Simplified Approach
- **No separate branches** for documentation or refactoring
- **Documentation is part of features** - planning and implementation go together
- **Refactoring is integrated** - happens as part of roadmap items
- **TDD-first for bugs** - test cases become permanent regression protection

### Automation Goals
- Bug reports automatically create GitHub issues
- Test failures trigger bug fix workflow
- Automated testing on all PRs
- Automated release process integration

## Branch Protection

### Main Branch Rules
- Require PR reviews
- Require status checks (tests, linting)
- No direct pushes to main
- Auto-delete feature branches after merge

### PR Requirements
- All tests must pass
- Documentation must be updated
- Follow conventional commit format
- Include test coverage for new features

## Integration with spl1 Roadmap

This branching strategy supports the three main concerns:

1. **Repository Restructure** → `feature/repository-restructure`
2. **External Install Workflow** → `feature/external-install-workflow`  
3. **Core API Enhancement** → `feature/avro-integration`, `feature/tdd-implementation`

Each feature branch will contain the complete implementation including planning docs, code changes, refactoring, and comprehensive test coverage.