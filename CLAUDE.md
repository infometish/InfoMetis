# CLAUDE.md

This file provides essential operational guidance for Claude Code when working with this repository.

## Quick Reference

**User-Friendly Sesame Triggers:**
Use natural language with "sesame" suffix:
- `start sesame` → SESSION_START workflow
- `finish sesame` → SESSION_END workflow  
- `release sesame` → RELEASE_PROCESS (full version)
- `patch sesame` → RELEASE_PROCESS (patch mode)
- `planning sesame` → PLANNED_VS_UNPLANNED
- `next sesame` → NEXT_ISSUE
- `transition sesame` → VERSION_TRANSITION (complete 6-step automation)
- `todo sesame` → REPO_TODO_WORKFLOW
- `version sesame` → NEW_VERSION_PLANNING (version setup and issue management)
- `issue sesame` → Manual issue creation for occasional needs
- `close sesame` → Manual issue closure for occasional needs

**Project-specific triggers**: See [claude/project/KEYWORD_REGISTRY.md](./claude/project/KEYWORD_REGISTRY.md)

**Single-Word Sesame Magic Word:**
**`sesame`** (standalone) → **Universal positive affirmation**
- **Meaning**: "Yes", "I agree", "Go ahead", "Proceed", "Approved"
- **Usage**: Response to proposals, options, or requests for confirmation
- **Context**: Replaces verbose confirmations with elegant single-word approval
- **Reference**: "Open Sesame" - the magic word that opens possibilities

**Critical Workflow Principles:**
- **Outcome-First Optimization**: Question when rules add value vs. create overhead - optimize for outcomes, activate process only when needed
- **Ceremonial Workflow Boundaries**: `start sesame` and `finish sesame` workflows exist for critical session boundaries but should be completely ignored during normal work - zero cognitive load until explicitly triggered
- **Item-Triggered Audit Logging**: When work 'feels' like a discrete item, execute the work completely, then log multiple `item_complete` entries reflecting each workflow used during completion. Log any observations about what went badly or issues encountered, then forget - fire and forget approach
- **Single-Step Completion**: Each step is DONE, then choose next action
- **File Path Specification**: All references MUST specify exact paths
- **Branch Default State**: Always return to `unplanned` branch

**IMPORTANT**: All rules marked "MANDATORY" override default behavior and MUST be followed exactly.

## Unified Todo Management

**Repository Todo List**: `claude/project/todo.md` - Long-term planning and session continuity. Access via `todo sesame` trigger only - not for routine work management.

## Critical File Reference Rule

**MANDATORY FILE PATH SPECIFICATION**: All file references in workflows, documentation, and instructions MUST specify exact file paths.

**Examples:**
- ❌ "log in timelog" → ✅ "log in `claude/project/audit/current/current.log`"
- ❌ "update documentation" → ✅ "update `docs/project-overview.md`"
- ❌ "check the config" → ✅ "check `settings/config.json`"

**Purpose**: Eliminates ambiguity, prevents errors, enables automation, and improves maintainability.

## Critical Audit Logging Rule

**Audit Format and Procedures**: See `claude/wow/workflows/AUDIT_LOGGING.md` for complete audit logging requirements, format specifications, and error handling procedures.
## Critical Workflow Execution Rule

**SESSION_START SPECIAL REQUIREMENT**: When SESSION_START workflow is recognized, Claude MUST check system time first to ensure accurate timestamps for all session activities.

## Critical Step-by-Step Execution Rule

**Collaboration Pattern**: See `claude/wow/workflows/OPERATIONAL_RULES.md` for step-by-step execution rules and collaborative decision-making patterns.

## Critical Version Management Rule

**Version Management**: See `claude/wow/workflows/NEW_VERSION_PLANNING.md` for version planning and scope control patterns.

## Critical Backlog to Completion Workflow

**Task Creation Process**: See `claude/wow/docs/backlog-to-completion-workflow.md` for structured decomposition workflow patterns.

## Critical Branch Management Rule

**Branch Management**: See `claude/wow/workflows/GIT_WORKFLOW.md` for branch management patterns and integration strategies.
## Workflow Triggers

**KEYWORD_REGISTRY** → See [claude/wow/KEYWORD_REGISTRY.md](./claude/wow/KEYWORD_REGISTRY.md) - Complete keyword system
**PROJECT_KEYWORD_REGISTRY** → See [claude/project/KEYWORD_REGISTRY.md](./claude/project/KEYWORD_REGISTRY.md) - Project-specific keywords


### Technical Keywords (for documentation)
**SESSION_START** → See [claude/wow/workflows/SESSION_START.md](./claude/wow/workflows/SESSION_START.md)
**RELEASE_PROCESS** → See [claude/wow/workflows/RELEASE_PROCESS.md](./claude/wow/workflows/RELEASE_PROCESS.md)
**PLANNED_VS_UNPLANNED** → See [claude/wow/workflows/PLANNED_VS_UNPLANNED.md](./claude/wow/workflows/PLANNED_VS_UNPLANNED.md)
**VERSION_TRANSITION** → See [claude/wow/workflows/VERSION_TRANSITION.md](./claude/wow/workflows/VERSION_TRANSITION.md)
**REPO_TODO_WORKFLOW** → See [claude/wow/workflows/REPO_TODO_WORKFLOW.md](./claude/wow/workflows/REPO_TODO_WORKFLOW.md)
**NEW_VERSION_PLANNING** → See [claude/wow/workflows/NEW_VERSION_PLANNING.md](./claude/wow/workflows/NEW_VERSION_PLANNING.md)

**Project-specific keywords**: See [claude/project/KEYWORD_REGISTRY.md](./claude/project/KEYWORD_REGISTRY.md)

## Project Context

**Project-Specific Information**: For project-specific context, epic definitions, and version configuration, read the project hook file at `claude/project/project-info.md`.

**Development Strategy**: Uses [Phase-Based Development](./claude/wow/docs/phase-based-development-strategy.md) - breaking roadmap items into phases that combine efficiently across different areas.


## Essential Development Tools

**Required for AI-assisted development**:
- `gh` (GitHub CLI) - Release creation, PR management, project integration
- `rg` (ripgrep) - Fast code searching (preferred over grep)
- `7z` - Archive operations via tools/7zip API
- `git` - Version control via tools/git API
- `node` v14+ - Core runtime

## Key Files for Understanding

**Core Platform**:
- `claude/wow/` - Ways of Working framework

**Development Strategy**:
- `claude/wow/docs/phase-based-development-strategy.md` - Roadmap execution approach
- `claude/wow/docs/branching-strategy.md` - GitHub Flow with integrated TDD
- `claude/project/todo.md` - Repository todo list for session continuity


## Documentation Standards

**Documentation Rules**: See `claude/wow/workflows/OPERATIONAL_RULES.md` for mandatory documentation standards and automatic correction procedures.