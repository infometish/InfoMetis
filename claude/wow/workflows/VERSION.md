[← Back to Claude-Swift Home](../../../README.md)

# VERSION Workflow

## Purpose
Main version management workflow that consolidates all version-related operations with intelligent state detection and user-guided routing.

## Trigger Keywords
- `version sesame`
- `VERSION`

## Overview
This workflow acts as an intelligent router that:
1. Analyzes current version state and project configuration
2. Detects version management context and readiness
3. Presents appropriate version management options to the user
4. Routes to specialized sub-workflows based on user choice
5. Enforces version management rules and best practices

## Critical Version Management Rules

### 1. Version Scope Control (MANDATORY)
**Issue List = Backlog + Completed Work:**
- ALL issues (open + closed) represent complete project history
- Issues and milestones are NEVER removed - only closed when completed
- Provides permanent historical tracking across all versions

**Milestones = Version Phases:**
- Milestones define phases within specific versions
- **Pattern**: `[EPIC]-[VERSION]: [EPIC_NAME] - Phase [N]`
- **Examples**: `SE-1: External Install - Phase 1`, `CAE-1: Core API - Phase 1`
- Milestones contain only work planned for that specific version

**Project = Current Version Only:**
- GitHub Project contains ONLY current version work
- Issues without milestones = future version candidates
- Clean project scope enables accurate progress tracking

### 2. Version Transition Protocol (MANDATORY)
**Before starting new version:**
- Close current project
- Create new project for next version
- Assign appropriate milestones to next-version issues
- Maintain clean separation between version scopes

**Version completion triggers:**
- Comprehensive release report
- Report includes: completed issues, milestone phases, epic progress
- Provides full accountability for version deliverables

### 3. Task Creation Process (MANDATORY)
**Backlog to Completion Workflow:**
- **Backlog (Unplanned)**: High-level issues without milestones
- **Planned Work - Task Creation**: Parent issues assigned milestones, decomposed into child issues
- **Planned Work - Implementation**: Child issues executed following single-step rule
- **Completion**: Parent closed when all children complete

**Task Creation Rules:**
- **Mandatory Decomposition**: Parent issues MUST be broken into child issues before implementation
- **Parent-Child Linking**: Child issues MUST reference parent for traceability
- **Issue Count Increase Expected**: Task creation increases issue count - this is healthy decomposition
- **Milestone Inheritance**: Child issues inherit milestone from parent

## Workflow Steps

### 1. Project Configuration Detection
**Read Project Configuration:**
- Load `claude/project/version-config.md` for project-specific version settings
- Load `claude/project/project-info.md` for general project information
- Extract version strategy, current version, and project identity

**Validate Configuration:**
- Verify project hooks exist and are properly formatted
- Check current version state and numbering consistency
- Validate milestone and project alignment

### 2. Version State Analysis
**Current Version Assessment:**
- Analyze open/closed issues in current milestones
- Check GitHub project status and completion
- Evaluate release readiness based on milestone completion
- Assess planning vs implementation state

**Classification Logic:**
```
No current version setup → VERSION_PLANNING candidate
Active milestones with open issues → Development in progress
All milestones complete, no release → RELEASE_PROCESS candidate
Recent release, planning needed → VERSION_PLANNING candidate
Mid-transition state → VERSION_TRANSITION candidate
```

### 3. User Option Presentation
Based on version state detection, present relevant options:

**For New Project (no version setup):**
```
Detected: Project with no version management structure

Version Management Options:
1. Initialize Version Management - Set up version structure and planning
2. Skip Version Management - Continue with ad-hoc development
3. Cancel - Exit without changes

Choose option [1-3]:
```

**For Active Development:**
```
Detected: Active development in progress (Version X.Y.Z)
- Open Issues: N across M milestones
- Completion: X% of current version milestones

Version Management Options:
1. Plan Next Version - Create planning for upcoming version
2. Execute Version Transition - Move to next development phase
3. Create Release - Complete current version (if ready)
4. Review Version Status - Show detailed version progress
5. Cancel - Exit without changes

Choose option [1-5]:
```

**For Release-Ready State:**
```
Detected: Version ready for release (All milestones complete)
- Current Version: X.Y.Z
- Completed Issues: N
- Release Artifacts: [Status]

Version Management Options:
1. Create Release - Execute full release process
2. Review Release Readiness - Validate release criteria
3. Plan Next Version - Begin next version planning
4. Cancel - Exit without changes

Choose option [1-4]:
```

### 4. Sub-Workflow Routing
Route to appropriate specialized workflow based on user selection:

**Initialize/Plan Version:** → `VERSION_PLANNING` sub-workflow
**Execute Transition:** → `VERSION_TRANSITION` sub-workflow
**Create Release:** → `RELEASE_PROCESS` sub-workflow
**Review Status:** → Generate comprehensive version status report

### 5. Post-Workflow Integration
After sub-workflow completion:
- Update project configuration with new version state
- Verify version management rules compliance
- Generate summary of changes made
- Provide guidance for next steps

## Project Configuration Integration

### Required Project Configuration
**claude/project/version-config.md:**
- PROJECT_NAME, CURRENT_VERSION, VERSION_PATTERN
- RELEASE_TYPE, ARTIFACT_CONFIGURATION
- BUILD_COMMANDS, TEST_COMMANDS

**claude/project/project-info.md:**
- Project identity and description
- Repository configuration
- Development team information

### Configuration Validation
- Verify all required configuration files exist before workflow execution
- Validate configuration format and required fields
- Provide clear error messages for missing or invalid configuration
- Guide user to create missing configuration when needed

## Error Handling

### Missing Project Configuration
- Detect missing or invalid project configuration files
- Guide user through configuration creation process
- Provide templates for required configuration files
- Validate configuration before proceeding

### Version State Conflicts
- Detect conflicting version states (e.g., multiple active versions)
- Present resolution options to user
- Guide through cleanup processes
- Ensure version management rule compliance

### Sub-Workflow Failures
- Monitor sub-workflow execution status
- Capture and report error conditions
- Provide rollback guidance where applicable
- Log failures for troubleshooting

## Integration Points

### With Sub-Workflows
- **VERSION_PLANNING** - Version and milestone planning
- **VERSION_TRANSITION** - Phase transitions and project updates
- **RELEASE_PROCESS** - Complete release execution

### With Project Management
- **GitHub Projects** - Current version work tracking
- **Issues and Milestones** - Work organization and completion
- **Release Management** - Artifact creation and distribution

### With Development Workflows
- **PLANNED_VS_UNPLANNED** - Work classification and routing
- **NEXT_ISSUE** - Issue selection within version context
- **GITHUB_WORKFLOW** - Project and milestone management

## Success Criteria
- Accurate version state detection and analysis
- Appropriate option presentation based on current state
- Successful sub-workflow routing and execution
- Version management rules compliance maintained
- Project hooks properly updated and maintained
- Clear user guidance for next steps

## Expected Outputs
- Comprehensive version state analysis
- User-selected version management path
- Successful sub-workflow execution
- Updated project configuration hooks
- Version management compliance validation
- Strategic guidance for continued development

---

*WoW Workflow - Version management orchestrator executed by Claude instances running claude-swift*