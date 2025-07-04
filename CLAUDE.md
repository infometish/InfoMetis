# CLAUDE.md

This file provides essential operational guidance for Claude Code when working with this repository.

## Quick Reference

**Essential Workflow Commands:**
- `start sesame` → SESSION_START workflow
- `finish sesame` → SESSION_END workflow  
- `git sesame` → GIT_WORKFLOW
- `next sesame` → NEXT_ISSUE
- `planning sesame` → PLANNED_VS_UNPLANNED

**Critical Workflow Principles:**
- **Single-Step Completion**: Each step is DONE, then choose next action
- **File Path Specification**: All references MUST specify exact paths
- **Version Scope Control**: Project contains only current version work
- **Branch Default State**: Always return to `unplanned` branch

**IMPORTANT**: All rules marked "MANDATORY" override default behavior and MUST be followed exactly.

## Critical File Reference Rule

**MANDATORY FILE PATH SPECIFICATION**: All file references in workflows, documentation, and instructions MUST specify exact file paths.

**Examples:**
- ❌ "log in timelog" → ✅ "log in `claude/project/audit/current/current.log`"
- ❌ "update documentation" → ✅ "update `docs/project-overview.md`"
- ❌ "check the config" → ✅ "check `settings/config.json`"

**Purpose**: Eliminates ambiguity, prevents errors, enables automation, and improves maintainability.

## Critical Audit Format Enforcement Rule

**MANDATORY AUDIT FORMAT VALIDATION**: Before ANY audit logging, Claude MUST verify correct format usage:

**CORRECT Format**: `TIMESTAMP|WORKFLOW|STEP_TYPE|CONTEXT|FILE_PATH|DESCRIPTION`
- ✅ `2025-06-23T18:35:00Z|GIT_WORKFLOW|step|branch_sync||Fixed sync issues`
- ❌ `##→2025-06-23T18:35:00Z | GIT_WORKFLOW | step: Fixed sync issues` (OLD FORMAT)

**Format Validation Checklist**:
- [ ] Uses pipe separators `|` (not spaces or arrows)
- [ ] No `##→` prefix (old format) 
- [ ] Five pipe separators creating six fields
- [ ] Empty fields use `||` not single `|`
- [ ] Timestamp in ISO format with Z suffix

**AUTOMATIC CORRECTION**: When encountering old format audit entries, Claude MUST:
1. Identify format violations
2. Convert to correct format immediately  
3. Log the correction activity itself
4. Reference `claude/wow/workflows/AUDIT_LOGGING.md` for definitive rules

**Purpose**: Prevents audit format drift and ensures consistent operational logging across all sessions.
## Critical Session Start Git Status Rule

**MANDATORY SESSION_START GIT STATUS CHECK**: During SESSION_START workflow, Claude MUST run `git status` and verify clean working directory. If uncommitted changes exist, Claude MUST:
1. Log the detection in audit log with format: `TIMESTAMP|SESSION_START|step|git_status_check||Uncommitted changes detected from previous session`
2. Ask user whether to commit previous session changes or discard them
3. Complete the git operations before proceeding with new session work
4. Log completion: `TIMESTAMP|SESSION_START|step|git_status_resolved||Previous session changes handled - repository clean`

**Purpose**: Prevents incomplete session recovery and ensures proper workflow accountability across sessions.

## Critical Workflow Optimization Rule

**MANDATORY WORKFLOW IMPROVEMENT**: When Claude encounters workflow failures, inefficiencies, or gaps, Claude MUST:
1. Immediately propose specific MANDATORY rule additions to prevent recurrence
2. Explain the optimization benefit for Claude's operational efficiency
3. Add the rule to `CLAUDE.md` with user approval
4. Log the optimization in audit log

**Examples of Required Optimizations:**
- Workflow execution failures → Add mandatory checks
- Repeated manual steps → Add automation requirements
- Missing validation → Add mandatory verification steps
- Ambiguous procedures → Add specific mandatory formats

**Purpose**: Ensures continuous workflow improvement and prevents repeated operational failures.

## Critical Workflow Execution Rule

**MANDATORY WORKFLOW LOGGING**: When any custom workflow is recognized, Claude MUST:

1. **FIRST ACTION**: Log workflow start in current audit log before executing any workflow steps:
   ```
   YYYY-MM-DDTHH:MM:SSZ|WORKFLOW_NAME|workflow_start|context|file_path|workflow description
   ```

2. **DURING EXECUTION**: Log each workflow step as it is completed:
   ```
   YYYY-MM-DDTHH:MM:SSZ|WORKFLOW_NAME|step|context|file_path|step description
   ```

3. **LAST ACTION**: Log workflow completion after all workflow steps complete:
   ```
   YYYY-MM-DDTHH:MM:SSZ|WORKFLOW_NAME|workflow_complete|context|file_path|completion summary
   ```

**CRITICAL**: All audit entries MUST follow the format: `TIMESTAMP|WORKFLOW|STEP_TYPE|CONTEXT|FILE_PATH|DESCRIPTION`
- Use `||` for empty FILE_PATH fields
- Append entries before `##APPEND_MARKER_UNIQUE##` marker in `claude/project/audit/current/current.log`
- See `claude/wow/workflows/AUDIT_LOGGING.md` for complete formatting rules

This enables detection of incomplete workflow executions and ensures proper workflow accountability.

**SESSION_START SPECIAL REQUIREMENT**: When SESSION_START workflow is recognized, Claude MUST check system time first to ensure accurate timestamps for all session activities.

## Critical Step-by-Step Execution Rule

**MANDATORY WORKFLOW PATTERN**: All work MUST follow single-step completion with choice points.

### 1. Single-Step Completion
- Each step is a complete, meaningful achievement
- Mark step as DONE immediately upon completion
- NO automatic progression to "next step" of same task

### 2. Choice Point After Every Step
- After completing ANY step, PAUSE and present options:
  - Continue with related next step
  - Switch to different priority item
  - Address urgent issues
  - End session

### 3. Item Granularity
- ALL work items MUST be single completable steps
- ❌ "Implement AVRO service" 
- ✅ "Create GitHub issue for AVRO prototype"
- ✅ "Research AVRO library options"
- ✅ "Write AVRO schema example"

### 4. Progress Recognition
- Celebrate each completed step as meaningful progress
- **MANDATORY**: Update current audit log with step completion using correct format: `TIMESTAMP|WORKFLOW|step|context|file_path|description`
- **MANDATORY**: Follow REPO_TODO_WORKFLOW for repository todo list management - See [claude/wow/workflows/REPO_TODO_WORKFLOW.md](./claude/wow/workflows/REPO_TODO_WORKFLOW.md)

**Purpose**: Prevents tunnel vision, enables dynamic re-prioritization, provides clear progress tracking, and creates natural stopping points for session management.

## Critical Version Management Rule

**MANDATORY VERSION SCOPE CONTROL**: All version planning and project management MUST follow strict scope boundaries.

### 1. Issue List = Backlog + Completed Work
- ALL issues (open + closed) represent complete project history
- Issues and milestones are NEVER removed - only closed when completed
- Provides permanent historical tracking across all versions

### 2. Milestones = Version Phases  
- Milestones define phases within specific versions
- **Pattern**: `[EPIC]-[VERSION]: [EPIC_NAME] - Phase [N]`
- **Examples**: `SE-1: External Install - Phase 1`, `CAE-1: Core API - Phase 1`
- Milestones contain only work planned for that specific version

### 3. Project = Current Version Only
- GitHub Project contains ONLY current version work
- Issues without milestones = future version candidates
- Clean project scope enables accurate progress tracking

### 4. Release Reports
- Version completion triggers comprehensive release report
- Report includes: completed issues, milestone phases, epic progress
- Provides full accountability for version deliverables

### 5. Version Transition Protocol
- Before starting new version: close current project
- Create new project for next version
- Assign appropriate milestones to next-version issues
- Maintain clean separation between version scopes

**Purpose**: Ensures version accountability, accurate progress tracking, comprehensive release reports, and historical preservation of all project work.

## Critical Backlog to Completion Workflow

**MANDATORY TASK CREATION PROCESS**: All planned work MUST follow structured decomposition workflow.

### Workflow Stages
1. **Backlog (Unplanned)**: High-level issues without milestones
2. **Planned Work - Task Creation**: Parent issues assigned milestones, decomposed into child issues  
3. **Planned Work - Implementation**: Child issues executed following single-step rule
4. **Completion**: Parent closed when all children complete

### Task Creation Rules
- **Mandatory Decomposition**: Parent issues MUST be broken into child issues before implementation
- **Parent-Child Linking**: Child issues MUST reference parent for traceability
- **Issue Count Increase Expected**: Task creation increases issue count - this is healthy decomposition
- **Milestone Inheritance**: Child issues inherit milestone from parent

### Integration with Version Management
- **Milestone Assignment**: Commits parent to specific version
- **Project Inclusion**: Child issues appear in version project boards
- **Progress Tracking**: Version completion measured by child issue completion

**Purpose**: Bridges strategic planning with executable implementation through granular task decomposition.

**Reference**: See `docs/backlog-to-completion-workflow.md` for complete workflow documentation.

## Critical Branch Management Rule

**MANDATORY BRANCH POLICY**: Repository MUST maintain proper branch state for all work types.

### 1. Default State Rule
- Repository MUST default to `unplanned` branch at all times
- Prevents accidental commits to main branch
- SESSION_START MUST verify and switch to unplanned if on main

### 2. Branch Switching Protocol
**MANDATORY: Complete work cycle before leaving ANY branch:**
1. Commit all changes to current branch
2. Push current branch to remote
3. Create PR: current-branch → main
4. Merge PR (integrates work into main)
5. Only then switch to target branch

**After switching to target branch:**
- Merge main → target-branch to get latest changes (including work just merged)
- Ensures target branch starts with complete current codebase

**CRITICAL WORKFLOW INTEGRITY RULE:**
- **MUST NOT modify any repository files during steps 1-5 above**
- **NO audit log entries, documentation updates, or any file changes during PR cycle**
- **File modifications ONLY allowed after successful branch switch**
- **Workflow tracking happens AFTER transition, never during**

**Critical Rules:**
- NO branch transitions without completing PR cycle first
- NO file modifications during transition sequence

### 3. Work Lifecycle Management
**Issue Branches (`feature/issue-123`, `bugfix/issue-456`):**
- Accumulate multiple commits throughout issue development
- MUST complete PR cycle when transitioning away from branch (even if issue incomplete)
- Branch can be recreated from main for continued work
- Branch deleted only after issue completion

**Unplanned Branch:**
- Immediate commit + PR + merge cycle for each work session
- MUST complete PR cycle when transitioning to issue work
- Always kept active, never deleted
- Gets continuous main updates through merge operations

### 4. Integration Strategy
**All Branch Transitions:**
```
any-branch: commit → push → PR → merge → switch → merge main into target
```

**Unplanned Work Flow:**
```
unplanned: commit → PR → merge → (optional switch)
```

**Issue Work Flow:**
```
issue-branch: accumulate commits → PR when transitioning → continue or complete
```

**Integration Points:**
- Every branch transition forces work through main
- All active branches stay synchronized via main
- No work isolation - everything integrates continuously
- Prevents branch divergence and work loss

**Purpose**: Maintains clean separation between planned/unplanned work, prevents conflicts, ensures all work stays current with latest changes.
## Workflow Triggers

**KEYWORD_REGISTRY** → See [claude/wow/KEYWORD_REGISTRY.md](./claude/wow/KEYWORD_REGISTRY.md) - Complete keyword system

### User-Friendly Sesame Triggers
Use natural language with "sesame" suffix:
- `start sesame` → SESSION_START workflow
- `finish sesame` → SESSION_END workflow  
- `git sesame` → GIT_WORKFLOW
- `github sesame` → GITHUB_WORKFLOW
- `rules sesame` → OPERATIONAL_RULES
- `commands sesame` → ESSENTIAL_COMMANDS
- `release sesame` → RELEASE_PROCESS
- `planning sesame` → PLANNED_VS_UNPLANNED
- `project sesame` → PROJECT_AUTOMATION
- `next sesame` → NEXT_ISSUE
- `recommend sesame` → WORKFLOW_RECOMMENDATION (experimental)
- `transition sesame` → VERSION_TRANSITION (complete 5-step automation)
- `todo sesame` → REPO_TODO_WORKFLOW
- `version planning sesame` → NEW_VERSION_PLANNING
- `docs sesame` → DOCUMENTATION_WORKFLOW

### Technical Keywords (for documentation)
**SESSION_START** → See [claude/wow/workflows/SESSION_START.md](./claude/wow/workflows/SESSION_START.md)
**GITHUB_WORKFLOW** → See [claude/wow/workflows/GITHUB_WORKFLOW.md](./claude/wow/workflows/GITHUB_WORKFLOW.md)  
**GIT_WORKFLOW** → See [claude/wow/workflows/GIT_WORKFLOW.md](./claude/wow/workflows/GIT_WORKFLOW.md)
**OPERATIONAL_RULES** → See [claude/wow/workflows/OPERATIONAL_RULES.md](./claude/wow/workflows/OPERATIONAL_RULES.md)
**ESSENTIAL_COMMANDS** → See [claude/wow/workflows/ESSENTIAL_COMMANDS.md](./claude/wow/workflows/ESSENTIAL_COMMANDS.md)
**RELEASE_PROCESS** → See [claude/wow/workflows/RELEASE_PROCESS.md](./claude/wow/workflows/RELEASE_PROCESS.md)
**PLANNED_VS_UNPLANNED** → See [claude/wow/workflows/PLANNED_VS_UNPLANNED.md](./claude/wow/workflows/PLANNED_VS_UNPLANNED.md)
**WORKFLOW_RECOMMENDATION** → See [claude/wow/workflows/WORKFLOW_RECOMMENDATION.md](./claude/wow/workflows/WORKFLOW_RECOMMENDATION.md)
**VERSION_TRANSITION** → See [claude/wow/workflows/VERSION_TRANSITION.md](./claude/wow/workflows/VERSION_TRANSITION.md)
**REPO_TODO_WORKFLOW** → See [claude/wow/workflows/REPO_TODO_WORKFLOW.md](./claude/wow/workflows/REPO_TODO_WORKFLOW.md)
**NEW_VERSION_PLANNING** → See [claude/wow/workflows/NEW_VERSION_PLANNING.md](./claude/wow/workflows/NEW_VERSION_PLANNING.md)
**DOCUMENTATION_WORKFLOW** → See [claude/wow/workflows/DOCUMENTATION_WORKFLOW.md](./claude/wow/workflows/DOCUMENTATION_WORKFLOW.md)

## spl1 Context

**Transition Repository**: spl1 focuses on repository restructure, external install workflows, and core API enhancements. See [Federated Monorepo Design](./docs/federated-monorepo-design.md) for transition strategy.

**Development Strategy**: Uses [Phase-Based Development](./claude/wow/docs/phase-based-development-strategy.md) - breaking roadmap items into phases that combine efficiently across different areas, following PRINCE2 "just enough planning" principles.


## Essential Development Tools

**Required for AI-assisted development**:
- `gh` (GitHub CLI) - Release creation, PR management, project integration
- `rg` (ripgrep) - Fast code searching (preferred over grep)
- `7z` - Archive operations via tools/7zip API
- `git` - Version control via tools/git API
- `node` v14+ - Core runtime

## Key Files for Understanding

**Core Platform**:
- `modules/spl/spl.js` - Core utility library
- `docs/project-overview.md` - Architecture and components  
- `docs/app-development.md` - Application development patterns
- `docs/code-quality-patterns.md` - Critical coding standards
- `docs/testing-frameworks.md` - Testing methodologies

**spl1 Strategy**:
- `claude/wow/docs/phase-based-development-strategy.md` - PRINCE2-inspired roadmap execution approach
- `claude/wow/workflows/phase-based-implementation-guide.md` - Step-by-step workflow implementation guide
- `claude/wow/workflows/branching-strategy.md` - Simplified GitHub Flow with integrated TDD
- `claude/project/docs/current-development-process.md` - Current development workflow and process


## Persistent Todo Management

**Repository Todo List**: `claude/project/todo.md` - Maintains discussion topics and todos across sessions to ensure continuity.

## Learning Rule

At regular intervals, ask "What have I learned?" and update documentation in appropriate docs/ files.

## Future Evolution

See [Subdirectory CLAUDE.md Evolution Plan](./docs/subdirectory-claude-md-plan.md) for planned transition to federated repository architecture.

## Documentation Standards

**MANDATORY DOCUMENTATION RULES**:
1. **File Location**: All documentation MUST be created in `docs/` directory or appropriate subdirectory
2. **Homepage Back Links**: All documentation files MUST include back link to README.md at TOP of file
3. **Back Link Format**: `[← Back to Claude-Swift Home](../README.md)` (adjust path as needed)
4. **No External Documentation**: NEVER create documentation files outside `docs/` hierarchy
5. **README.md Content Organization** (claude-swift rule): README.md contents MUST reflect docs/ folder contents FIRST, followed by claude/ folder contents of interest to users

**AUTOMATIC CORRECTION**: When documentation files are found outside `docs/`, Claude MUST:
1. Move files to appropriate `docs/` subdirectory
2. Update all references to new locations
3. Fix homepage back links to be at top of files