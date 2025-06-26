# GIT_WORKFLOW

## Branching Strategy
Uses simplified GitHub Flow with issue-per-branch approach integrated with GitHub Projects.

## Branch Types
- `feature/issue-123` - Feature development tied to GitHub issue
- `bugfix/issue-456` - Bug fixes with TDD workflow tied to GitHub issue
- `unplanned` - Unplanned work (reused branch, minimize usage)

## 🚨 CRITICAL: Branch Synchronization Protocol

**ROOT CAUSE OF SYNC ISSUES**: Local main never updates automatically after PR merges at origin. This causes progressive branch drift and sync failures.

### ⚠️ MANDATORY: Post-PR Synchronization
**AFTER EVERY SINGLE PR MERGE** (no exceptions):
```bash
# This MUST happen immediately after any PR merge
git checkout main
git pull origin main                    # ← CRITICAL: Sync local main with merged PR
git checkout unplanned  
git merge main                          # ← Update unplanned with merged changes
git push origin unplanned               # ← Keep origin/unplanned synchronized
```

**WHY THIS MATTERS**: 
- PR merges happen at origin/main but don't update local main
- Without this sync, branches progressively drift apart
- Multiple missed syncs create complex merge conflicts
- **This step is NOT optional - it prevents all sync issues**

### 🎯 SESSION_START Synchronization (MANDATORY)
**FIRST ACTION in every session**:
```bash
git status                              # Check current state
git fetch origin                        # Get latest remote state
git checkout main
git pull origin main                    # ← Sync local main (may be behind!)
git checkout unplanned                  # Return to default working branch
git merge main                          # Ensure unplanned has latest changes
```

**VERIFICATION**: After sync, `git branch -vv` should show both branches are up to date with their origins.

### 🔄 Pre-Work Synchronization  
**Before starting ANY new work**:
```bash
git fetch origin                        # Always fetch first
git checkout main
git pull origin main                    # Ensure main is current
# Now safe to create branches or switch to unplanned
```

## Timelog-Driven Branch Selection

**Before any code changes, check timelog context:**

### Issue Work (Planned)
```bash
# Timelog shows: ##→2025-06-17T10:30:00Z | FREESTYLE | development: #123 feature description

# 1. Sync main first
git checkout main
git pull origin main                            # Ensure main is current

# 2. Create issue branch from current main
git checkout -b feature/issue-123               # or bugfix/issue-123
git merge main                                  # Ensure branch has latest main

# 3. Work on specific issue...

# Archive audit log before commit
if [ -f claude/audit/current/current.log ]; then
    mv claude/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/audit/current/current.log
fi

git add .                                       # Stage ALL files (atomic work packages)
git commit -m "feat: implement feature (#123)" # Reference issue number
gh pr create --title "Feature title (#123)" --body "Closes #123"
```

### Unplanned Work
```bash
# Timelog shows: ##→2025-06-17T10:30:00Z | FREESTYLE | development: unassigned

# 1. ALWAYS sync main first (prevents all issues)
git fetch origin
git checkout main  
git pull origin main                    # ← CRITICAL: Get latest merged PRs
git checkout unplanned
git merge main                          # Ensure unplanned has latest main

# 2. Make changes...

# Archive audit log before commit
if [ -f claude/audit/current/current.log ]; then
    mv claude/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/audit/current/current.log
fi

git add .
git commit -m "..." # Use unplanned commit format (see below)
gh pr create --title "Unplanned: description" --body "Unplanned work"
gh pr merge --squash                            # Merge PR immediately

# 3. ⚠️ CRITICAL: Post-PR Sync (PREVENTS FUTURE SYNC ISSUES)
git checkout main
git pull origin main                    # ← Update local main with the PR we just merged!
git checkout unplanned
git merge main                          # Update unplanned with merged changes
git push origin unplanned               # Keep origin/unplanned synchronized

# 4. Verify clean state
git branch -vv                          # Should show both branches "up to date"
```

## 🧹 Branch Housekeeping & Troubleshooting

### 🚨 Emergency Sync Recovery
If branches are out of sync (common symptoms: "ahead/behind" in `git branch -vv`):
```bash
# 1. Force sync with remote state
git fetch origin --all
git checkout main
git reset --hard origin/main           # ⚠️ Discards local main changes

# 2. Update unplanned
git checkout unplanned
git merge main                          # This might have conflicts

# 3. If conflicts, resolve and complete
# [resolve conflicts in editor]
git add .
git commit -m "resolve sync conflicts"
git push origin unplanned

# 4. Verify clean state
git branch -vv                          # Should show "up to date"
```

### 🔍 Sync Status Verification
**Run after every sync operation**:
```bash
git branch -vv
# Expected output:
#   main      abc1234 [origin/main] (up to date)
# * unplanned def5678 [origin/unplanned] (up to date)
```

**🚩 Warning Signs** (indicates sync needed):
- `[origin/main: behind X]` - local main needs `git pull origin main`
- `[origin/unplanned: ahead X]` - need `git push origin unplanned`
- `[origin/unplanned: behind X]` - need `git merge main`

### Branch Cleanup
- **Issue branches**: Delete when GitHub issue is closed (`git branch -d feature/issue-123`)
- **Unplanned branch**: Keep active, reuse for all unplanned work
- **Goal**: Minimize unplanned work to reduce maintenance overhead

### 📋 Sync Checklist (Use This!)
**Before starting work**:
- [ ] `git branch -vv` shows clean state
- [ ] `git fetch origin` completed
- [ ] Local main synced with `git pull origin main`

**After PR merge**:
- [ ] Local main updated with `git pull origin main`
- [ ] Unplanned merged with `git merge main`
- [ ] Origin synced with `git push origin unplanned`
- [ ] `git branch -vv` shows "up to date"

## Unplanned Work Commits
For unplanned work (no GitHub issue), reference timelog context:
```bash
git commit -m "$(cat <<'EOF'
feat: descriptive title of changes

- Bullet point summary of changes
- Include key implementation details

This was unplanned work - [brief context of how it emerged].
Full activity tracked in timelog: [relevant timelog contexts].

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## TDD Bug Workflow
```bash
git checkout -b bugfix/issue-456               # Bug fix branch

# Write failing test first (Red)
# Archive audit log before commit
if [ -f claude/audit/current/current.log ]; then
    mv claude/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/audit/current/current.log
fi
git add .
git commit -m "test: add failing test for bug (#456)"

# Implement fix (Green)  
# Archive audit log before commit
if [ -f claude/audit/current/current.log ]; then
    mv claude/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/audit/current/current.log
fi
git add .
git commit -m "fix: resolve issue description (#456)"

gh pr create --title "Fix bug title (#456)" --body "Closes #456"
```

## Audit Log Handling in Git Workflow

### **MANDATORY Pattern for Current.log**
When executing git workflows, follow this pattern to avoid committing operational audit entries:

```bash
# 1. Archive current audit log (this gets committed)
if [ -f claude/audit/current/current.log ]; then
    mv claude/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/audit/current/current.log
fi

# 2. Make project changes and commit
git add .
git commit -m "project changes"

# 3. Add operational audit entries to new current.log
echo "workflow progress..." >> claude/audit/current/current.log

# 4. Stash audit log before git operations
git stash push claude/audit/current/current.log -m "workflow audit updates"

# 5. Execute git workflow (push, PR, merge, sync)
git push origin branch
gh pr create --title "..." --body "..."
gh pr merge --squash
git checkout main && git pull origin main
git checkout unplanned && git merge main

# 6. Restore audit log (stays local, not committed)
git stash pop
```

### **Key Principles:**
- **Archive gets committed**: Session boundaries are permanent project history
- **Operational entries stay local**: Current workflow tracking doesn't need to be in git history
- **Clean git operations**: Stash/unstash prevents operational noise in commits
- **Session boundaries preserved**: Archived logs maintain accountability without cluttering history

## Version Release Workflow
```bash
# 1. Archive timelog before creating version
node scripts/archive_timelog.js <version>      # Archive timelog with version stamp

# 2. Create git tag and release
git tag v<version>
git push origin v<version>
gh release create v<version> --title "Version <version>" --notes "Release notes"
```

## Timelog Archive Rule
**CRITICAL**: When creating any new version/release, the timelog must be archived first:
- Archives current audit logs to `audit/v<version>/audit_v<version>.log`
- Clears current timelog and adds version boundary marker
- Preserves complete time tracking history for each version
- Enables post-release analysis of development time patterns