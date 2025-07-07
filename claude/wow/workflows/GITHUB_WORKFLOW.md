# GITHUB_WORKFLOW

## Quick Start Commands
```bash
# Create backlog issue:    gh issue create --title "..." --label "enhancement,SE"
# Version planning:        NEW_VERSION_PLANNING workflow
# Create milestone:        gh api repos/:owner/:repo/milestones --method POST
# Close issue:            gh issue close 123 --reason "completed"
# Verify closure:         gh issue view 123 --json state
```

## Workflow Integration Points
- **SESSION_START**: Initialize audit logging for milestone/issue operations
- **NEW_VERSION_PLANNING**: Systematic version setup and milestone creation
- **GIT_WORKFLOW**: Branch management for issue development
- **REPO_TODO_WORKFLOW**: Task continuity across sessions

## Primary Workflow
Backlog → Project → Planning → Implementation

## Epic Framework
- **RR**: Repository Restructure (federated monorepo design)
- **SE**: [EPIC_SE_DESCRIPTION]  
- **CAE**: Core API Enhancement (unified streaming APIs)
- **TDD**: TDD Implementation (comprehensive test-driven workflow)
- **BARE**: Migration to Bare (minimal dependency architecture)
- **NFD**: New Functionality Development (cross-epic supporting tools)
- **AVRO**: AVRO Integration (schema-based data architecture)

## Backlog → Planning → Execution Workflow

### 1. Adding New Work to Backlog (Lightweight)
```bash
# Create issue with proper dual labeling - NO project assignment  
gh issue create --title "Descriptive feature title" \
  --label "enhancement,SE" \
  --body "Detailed description..."
# Fast backlog creation - no configuration overhead
# NEVER use epic prefixes in titles (SE-1:, RR-2:, etc.)
# Epic labels provide the grouping mechanism
```

### 2. Version Planning and Issue Organization
```bash
# Use NEW_VERSION_PLANNING workflow for systematic version setup
# Creates milestones, assigns epic labels, and organizes version scope
gh issue list --label "v1.2.3" --milestone "EPIC-1: Foundation"
```

### 3. Milestone Creation and Project Info Updates
```bash
# Create milestone for epic phase
gh api repos/:owner/:repo/milestones --method POST \
  --field title="SE-1: External Install - Phase 1" \
  --field description="First phase of [EPIC_NAME] epic" \
  --field due_on="2025-08-15T00:00:00Z"

# MANDATORY: Update project info after milestone creation
# Add milestone to version-config.md development phases
# Associate current version with corresponding milestone
# Update project-info.md if milestone represents major architecture change
```

### 4. Daily Work Management
```bash
# Filter issues by version and epic for focused development
gh issue list --label "v1.2.3,EPIC" --state open
# Track progress through milestone completion and issue closure
```

### 5. Issue Closure After PR Merge
```bash
# MANDATORY: Close issues after PR merge
# Method 1: Automatic closure (preferred)
gh pr create --title "Feature title (#123)" --body "Closes #123"
# GitHub automatically closes issue when PR is merged

# Method 2: Manual closure (if automatic failed)
gh issue close 123 --reason "completed" --comment "Resolved by PR #456"

# MANDATORY: Verify issue closure after PR merge
gh issue view 123 --json state
# Expected: {"state":"CLOSED"}
```

### 6. Version Completion
```bash
# Close completed version milestone and issues
# Version completion handled by RELEASE_PROCESS workflow
# Historical tracking through closed issues and git tags
```

## Label Strategy

### Epic Labels (Required)
Every issue MUST have exactly one epic label:
- `RR` - Repository Restructure Epic (red #FF6B6B)
- `SE` - [EPIC_SE_NAME] Epic (teal #4ECDC4)  
- `CAE` - Core API Enhancement Epic (blue #45B7D1)
- `TDD` - Test-Driven Development Epic (green #96CEB4)
- `BARE` - Minimal Dependencies Epic (purple #DDA0DD)
- `NFD` - New Functionality Development Epic (blue #0366d6)
- `AVRO` - AVRO Integration Epic (yellow #FFEAA7)

### Type Labels (Required)
Every issue MUST have exactly one type label:
- `enhancement` - New features/functionality
- `bug` - Something broken that needs fixing
- `documentation` - Documentation improvements
- `Refactor` - Code restructuring without behavior change

### Dual Labeling Rule
**MANDATORY**: All issues must have both epic + type labels for immediate identification and project filtering.

## Issue Lifecycle States
- **Backlog**: Issues created but not in project (lightweight capture)
- **Staged**: Issues selected for import, ready to be added to planned work
- **Planned**: Issues imported to project with full field configuration  
- **Active**: In Progress status in project
- **Complete**: Done status in project
- **Archived**: Removed from project when version complete

## Feature → Task Breakdown
- **Features**: High-level work items labeled as `feature` + epic (e.g., `feature,NFD`)
- **Tasks**: Implementation items broken from features, labeled as `task` + epic (e.g., `task,NFD`)
- **Timing**: Task breakdown happens during planning import, not at backlog creation

## Project Management Strategy

### Rolling Project with Version Cleanup
**Strategy**: Reuse existing "SPL1 Development Workflow" project with periodic cleanup
- ✅ **Continuous workflow** - No project switching overhead
- ✅ **Version cleanup** - Remove completed versions to prevent clutter  
- ✅ **Focus maintenance** - Keep only active + next planned version visible
- ✅ **Cross-epic coordination** - Epic labels enable filtering across versions

### Project Organization
- **Epic Labels** - Primary grouping mechanism (RR, SE, CAE, etc.)
- **Milestone Field** - Phase tracking (RR-1, SE-1, CAE-1, etc.) 
- **Status Field** - Workflow states (Backlog, In Progress, Done)
- **Version Field** - Version association for cleanup cycles

### Project Lifecycle
1. **New Version Planning** → Add issues to existing project
2. **Active Development** → Update status through workflow states  
3. **Version Completion** → Remove completed work from project
4. **Historical Tracking** → Preserved in git history + closed issues

### Phase-Based Planning
- **Milestones** = Epic phases (RR-1, CAE-1) lasting 1-3 weeks
- **Issues** = Specific tasks within phases (1-3 days)  
- **Versions** = Combination of related phases across multiple epics
- **Project** = Rolling workspace for active development

**Benefits**: Clean focused workspace, epic-based organization, natural version boundaries, preserved history.

## Milestone Management Rules

### MANDATORY Project Info Updates
When creating milestones, Claude MUST update operational project information:

1. **Version Configuration Updates**: Add new milestones to `claude/project/version-config.md` development phases
2. **Version Association**: Link current version to corresponding milestone in version-config.md
3. **Project Info Updates**: Update `claude/project/project-info.md` if milestone represents major architecture changes
4. **Audit Logging**: Log milestone creation and project info updates in current audit log

### Milestone Creation Process
```bash
# 1. Create milestone
gh api repos/:owner/:repo/milestones --method POST \
  --field title="[EPIC]-[VERSION]: [EPIC_NAME] - Phase [N]" \
  --field description="[Phase description]" \
  --field due_on="[YYYY-MM-DDTHH:MM:SSZ]"

# 2. Update version-config.md to include milestone in development phases
# 3. Associate current version with milestone
# 4. Update project-info.md if needed
# 5. Log updates in audit log
```

**Purpose**: Ensures project operational information stays synchronized with GitHub milestone planning and provides clear version-milestone traceability.

## Issue Closure Management Rules

### MANDATORY Issue Closure After PR Merge
When PRs are merged, Claude MUST ensure corresponding issues are closed:

1. **Primary Method**: Use "Closes #123" in PR body for automatic closure
2. **Verification Required**: After PR merge, verify issue closure with `gh issue view 123 --json state`
3. **Manual Closure**: If automatic closure fails, manually close with `gh issue close 123 --reason "completed"`
4. **Audit Logging**: Log issue closure verification in current audit log
5. **Branch Cleanup**: Delete issue branch after confirmed issue closure

### Issue Closure Process
```bash
# 1. Create PR with closing keyword
gh pr create --title "Feature title (#123)" --body "Closes #123"

# 2. After PR merge, verify issue closure
gh issue view 123 --json state | jq -r '.state'

# 3. If issue still open, close manually
if [ "$(gh issue view 123 --json state | jq -r '.state')" = "OPEN" ]; then
    gh issue close 123 --reason "completed" --comment "Resolved by merged PR"
fi

# 4. Clean up issue branch
git branch -d feature/issue-123

# 5. Log closure in audit log
```

**Purpose**: Ensures complete issue lifecycle management and prevents orphaned issues from accumulating in the backlog.

## Consolidated Mandatory Rules

### MANDATORY Workflow Requirements
Claude MUST follow these requirements when executing GitHub workflows:

#### 1. Dual Labeling Rule
- **Requirement**: All issues MUST have both epic + type labels
- **Examples**: `enhancement,SE` or `bug,CAE`
- **Purpose**: Immediate identification and project filtering

#### 2. Milestone Management
- **Creation**: Update `claude/project/version-config.md` development phases
- **Association**: Link current version to corresponding milestone
- **Project Info**: Update `claude/project/project-info.md` for major changes
- **Audit**: Log milestone creation in current audit log

#### 3. Issue Closure Verification
- **Primary**: Use "Closes #123" in PR body for automatic closure
- **Verification**: Run `gh issue view 123 --json state` after PR merge
- **Fallback**: Manual closure if automatic fails
- **Cleanup**: Delete issue branch after confirmed closure
- **Audit**: Log closure verification in audit log

#### 4. Cross-Workflow Integration
- **SESSION_START**: Initialize audit logging before GitHub operations
- **GIT_WORKFLOW**: Coordinate branch management with issue lifecycle
- **NEW_VERSION_PLANNING**: Use for systematic milestone creation
- **AUDIT_LOGGING**: Follow format requirements for all logging

### Mandatory Checklist
Before completing any GitHub workflow session:
- [ ] All issues have dual labels (epic + type)
- [ ] Milestones created are logged in version-config.md
- [ ] Issue closures are verified and logged
- [ ] Issue branches are cleaned up
- [ ] Audit logging is complete and properly formatted