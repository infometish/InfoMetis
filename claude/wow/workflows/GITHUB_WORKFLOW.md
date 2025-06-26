# GITHUB_WORKFLOW

## Primary Workflow
Backlog → Project → Planning → Implementation

## Seven-Epic Structure
- **RR**: Repository Restructure (federated monorepo design)
- **SE**: SPlectrum Engines (external install workflows)  
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

### 2. Planning Session Import (When Ready to Work)
```bash
# Import selected issues to project with full configuration
node status/project-automation.js import --issues 27,28,29 --version 0.6.2
# Configures all decision-making fields automatically
```

### 3. Daily Execution (Fast Recommendations)
```bash
# Get recommendations from planned work only
node status/project-automation.js recommend
# Only processes items in project - fast performance
```

### 4. Version Completion Cleanup
```bash
# Remove completed version items from project
node status/project-automation.js remove --version 0.6.1
# Keeps project focused on current work only
```

## Label Strategy

### Epic Labels (Required)
Every issue MUST have exactly one epic label:
- `RR` - Repository Restructure Epic (red #FF6B6B)
- `SE` - SPlectrum Engines Epic (teal #4ECDC4)  
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