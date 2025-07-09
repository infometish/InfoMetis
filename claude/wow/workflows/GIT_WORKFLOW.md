[← Back to Claude-Swift Home](../../README.md)

# GIT_WORKFLOW

## 🚨 CRITICAL: Only 3 Rules to Remember

1. **Session Start**: `git-sync-session-start` (single command)
2. **After PR Merge**: `git-sync-post-pr` (single command)  
3. **Before New Work**: `git-verify-sync` (automatic check)

**Everything else is automation and detail. Master these 3 commands and sync issues disappear.**

## Automation Overview
Provides single-command automation for git operations following governance rules defined in OPERATIONAL_RULES.md.

**Note**: All governance rules (branch policies, PR protocols, etc.) are defined in OPERATIONAL_RULES.md. This workflow focuses on automation commands that implement those rules.

## Automated Sync Commands

**Purpose**: Single-command automation prevents manual process errors and ensures compliance with OPERATIONAL_RULES governance.

### ⚠️ MANDATORY: Bundled Sync Commands
```bash
# After PR merge (replaces 5 manual steps)
git-sync-post-pr() {
    echo "🔄 Syncing branches after PR merge..."
    git checkout main && \
    git pull origin main && \
    git checkout unplanned && \
    git merge main && \
    git push origin unplanned && \
    echo "✅ Post-PR sync complete" && \
    git branch -vv
}

# Session start (replaces 4 manual steps)  
git-sync-session-start() {
    echo "🔄 Starting session sync..."
    git fetch origin && \
    git checkout main && \
    git pull origin main && \
    git checkout unplanned && \
    git merge main && \
    echo "✅ Session sync complete" && \
    git branch -vv
}

# Verification before any work
git-verify-sync() {
    if git branch -vv | grep -q "behind\|ahead"; then
        echo "❌ Branches out of sync - run git-sync-session-start first"
        return 1
    fi
    echo "✅ Branches synchronized - safe to proceed"
}
```

**WHY AUTOMATION WORKS**: 
- Single command vs 5 manual steps = 80% less cognitive load
- Immediate feedback prevents silent failures
- Impossible to skip steps accidentally
- **Compliance becomes effortless instead of burdensome**

### 🎯 SESSION_START Synchronization (AUTOMATED)
**FIRST ACTION in every session**:
```bash
git-sync-session-start                 # Single command replaces 6 manual steps
```

**What it does automatically**:
- Fetches latest remote state
- Syncs local main with origin/main  
- Updates unplanned with latest changes
- Shows branch status for verification

### 🔄 Pre-Work Verification (AUTOMATED)
**Before starting ANY new work**:
```bash
git-verify-sync                        # Automatic check - fails fast if sync needed
```

**Enforced workflow**:
```bash
# Safe commit (with automatic verification)
git-verify-sync && git commit -m "message"

# Safe PR creation (with automatic verification)  
git-verify-sync && gh pr create --title "title"
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
if [ -f claude/project/audit/current/current.log ]; then
    mv claude/project/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/project/audit/current/current.log
fi

git add .                                       # Stage ALL files (atomic work packages)
git commit -m "feat: implement feature (#123)" # Reference issue number
gh pr create --title "Feature title (#123)" --body "Closes #123"
```

### Unplanned Work (SIMPLIFIED)
```bash
# 1. Start with sync verification
git-verify-sync || git-sync-session-start

# 2. Make changes...

# 3. Archive audit log before commit  
if [ -f claude/project/audit/current/current.log ]; then
    mv claude/project/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/project/audit/current/current.log
fi

# 4. Safe commit and PR (with automatic verification)
git add .
git-verify-sync && git commit -m "..."
git-verify-sync && gh pr create --title "Unplanned: description" --body "Unplanned work"
gh pr merge --squash

# 5. ⚠️ CRITICAL: Post-PR Sync (SINGLE COMMAND)
git-sync-post-pr                       # Replaces 5 manual steps, prevents all future sync issues
```

**Cognitive Load Reduction**: 15 manual commands → 4 automated commands (73% reduction)

## 🧹 Emergency Recovery & Troubleshooting

### 🚨 Emergency Sync Recovery (AUTOMATED)
```bash
# Single command for emergency recovery
git-sync-emergency() {
    echo "🚨 Emergency sync recovery..."
    git fetch origin --all && \
    git checkout main && \
    git reset --hard origin/main && \
    git checkout unplanned && \
    git reset --hard main && \
    git push origin unplanned --force-with-lease && \
    echo "✅ Emergency recovery complete" && \
    git branch -vv
}
```

**When to use**: When `git-verify-sync` fails and normal sync doesn't work.

### 🔍 What Happens When You Skip Sync
```
Skip Count → Consequence → Recovery Time
    0-1    → No issues    → 0 minutes  
    2-3    → Minor conflicts → 2-5 minutes
    4-5    → Major conflicts → 15-30 minutes  
    6+     → Emergency recovery → 45+ minutes
```

**Psychology**: Skipping sync feels free but costs compound exponentially.

### 📋 Quick Command Reference
| Situation | Command | Time Cost |
|-----------|---------|-----------|
| Starting session | `git-sync-session-start` | 30 seconds |
| After PR merge | `git-sync-post-pr` | 30 seconds |
| Before new work | `git-verify-sync` | 5 seconds |
| Emergency fix | `git-sync-emergency` | 2 minutes |
| **Skip sync penalty** | **Manual conflict resolution** | **15-45 minutes** |

## 🛠️ Setup: Automated Workflow Helpers

### Installation
```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
source /path/to/claude-swift/claude/scripts/git-workflow-helpers.sh

# Or run once per session
source claude/scripts/git-workflow-helpers.sh
```

### Available Commands
- `git-sync-session-start` - Session start with full sync (replaces 6 steps)
- `git-sync-post-pr` - Post-PR sync (replaces 5 steps)  
- `git-verify-sync` - Check sync status (prevents issues)
- `git-sync-emergency` - Nuclear option recovery
- `git-commit-safe` - Commit with automatic sync verification
- `gh-pr-create-safe` - PR creation with automatic sync verification
- `git-workflow-help` - Show all available commands

### Psychology of Compliance

**Why the old workflow failed**:
- 22 commands across 6 scenarios = cognitive overload
- Manual steps get skipped under time pressure
- No immediate consequences create false sense of safety
- Success despite non-compliance undermines discipline

**Why automation works**:
- 4 commands replace 22 manual steps (82% reduction)
- Impossible to skip internal steps accidentally
- Immediate feedback prevents silent failures
- Compliance becomes easier than non-compliance

**Key insight**: Make the right thing the easy thing.

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
if [ -f claude/project/audit/current/current.log ]; then
    mv claude/project/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/project/audit/current/current.log
fi
git add .
git commit -m "test: add failing test for bug (#456)"

# Implement fix (Green)  
# Archive audit log before commit
if [ -f claude/project/audit/current/current.log ]; then
    mv claude/project/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/project/audit/current/current.log
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
if [ -f claude/project/audit/current/current.log ]; then
    mv claude/project/audit/current/current.log claude/audit/current/session_$(date -u +%Y-%m-%dT%H-%M-%S).log
    touch claude/project/audit/current/current.log
fi

# 2. Make project changes and commit
git add .
git commit -m "project changes"

# 3. Add operational audit entries to new current.log
echo "workflow progress..." >> claude/project/audit/current/current.log

# 4. Stash audit log before git operations
git stash push claude/project/audit/current/current.log -m "workflow audit updates"

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