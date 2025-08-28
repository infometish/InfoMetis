---
target: infometish/InfoMetis
source: claude-swift
created: 2025-07-30T12:00:00.000Z
description: Remove CLAUDE.md and claude/wow symlinks from git tracking and add to .gitignore
---

# Remove CLAUDE.md and claude/wow symlinks from git tracking and add to .gitignore

## Task Details
- Remove CLAUDE.md from git tracking: `git rm --cached CLAUDE.md`
- Remove claude/wow from git tracking: `git rm --cached -r claude/wow` 
- Add both to .gitignore:
  - CLAUDE.md
  - claude/wow/
- Commit changes with message about removing orchestrator symlinks from version control

## Background
These are symlinks to the orchestrator's files and should not be tracked in individual project repositories. They are managed by the orchestrator and should be local-only in each project.
