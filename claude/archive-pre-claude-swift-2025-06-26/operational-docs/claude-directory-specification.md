# Claude Directory Specification

## Purpose

The `claude/` directory contains **exclusively** operational support files for Claude Code functionality as defined in `CLAUDE.md`. This directory serves as the organizational hub for all Claude-specific behavioral, procedural, and configuration files.

## Core Principle

**OPERATIONAL SUPPORT ONLY**: Files in `claude/` must directly support Claude's operational behavior within this repository. Project data, knowledge, or content belongs in appropriate project directories (`docs/`, `src/`, etc.).

## Directory Structure

```
claude/
├── workflows/              # Workflow execution procedures
├── operational-docs/       # Claude behavioral documentation
├── settings/              # Claude configuration files
└── tools/                 # Claude workflow automation scripts
```

## Directory Definitions

### `claude/workflows/`
**Purpose**: Detailed workflow execution procedures triggered by CLAUDE.md keywords

**Contents**:
- `SESSION_START.md`, `SESSION_END.md` - Session management procedures
- `GIT_WORKFLOW.md`, `GITHUB_WORKFLOW.md` - Version control procedures
- `OPERATIONAL_RULES.md` - Core behavioral rules
- Other workflow-specific execution guides

**Criteria**: Must define **how Claude executes** specific workflows

### `claude/operational-docs/`
**Purpose**: Documentation that guides Claude's operational behavior

**Contents**:
- `workflow-integration-guide.md` - How workflows connect and interact
- `operational-checklist.md` - Quick reference for common procedures
- `troubleshooting-guide.md` - Common workflow issues and solutions
- `claude-behavioral-patterns.md` - Standard Claude operational patterns

**Criteria**: Must describe **how Claude should behave** operationally

### `claude/settings/`
**Purpose**: Configuration files that control Claude's behavior

**Contents**:
- `workflow-config.json` - Workflow-specific parameters
- `audit-retention-policy.json` - Audit log management settings
- `branch-protection-rules.json` - Branch management automation
- `operational-defaults.json` - Default Claude behavioral settings

**Criteria**: Must configure **Claude's operational parameters**

### `claude/tools/`
**Purpose**: Automation scripts that support Claude's workflow execution

**Contents**:
- `workflow-validator.js` - Validate workflow execution completeness
- `audit-analyzer.js` - Generate reports from audit logs
- `session-recovery.js` - Detect and recover incomplete sessions
- `compliance-checker.js` - Verify CLAUDE.md rule adherence

**Criteria**: Must **automate Claude's operational tasks**

## Exclusion Criteria

**Files that should NOT be in `claude/`:**

### Project Knowledge
- `lessons-learned.md` → belongs in `docs/`
- `decision-log.md` → belongs in `docs/`
- `architecture-decisions.md` → belongs in `docs/`

### Project Content
- Code templates → belongs in `templates/` or relevant source directories
- Project documentation → belongs in `docs/`
- Business logic → belongs in appropriate source directories

### Project Configuration
- Application settings → belongs in `config/` or `settings/`
- Deployment configuration → belongs in deployment directories
- Project-specific tools → belongs in `tools/` or `scripts/`

## File Naming Conventions

**Workflow Files**: `WORKFLOW_NAME.md` (uppercase, matches CLAUDE.md triggers)
**Documentation**: `kebab-case.md`
**Configuration**: `kebab-case.json` or appropriate extension
**Tools**: `kebab-case.js` or appropriate extension

## Integration with CLAUDE.md

The `claude/` directory serves as the **implementation layer** for CLAUDE.md:

- **CLAUDE.md**: Defines triggers, rules, and high-level operational guidance
- **`claude/`**: Contains detailed procedures, configurations, and tools

All `claude/` files must reference back to relevant CLAUDE.md sections and maintain consistency with operational rules.

## Maintenance Rules

1. **Operational Focus**: Every file must directly support Claude's operational behavior
2. **CLAUDE.md Alignment**: All content must align with CLAUDE.md rules and principles
3. **Clear Purpose**: Each file must have a single, well-defined operational purpose
4. **Dependency Mapping**: Files should clearly indicate dependencies on other Claude operational files
5. **Regular Review**: Periodically audit for files that have become project data rather than operational support

## Migration Guidelines

When moving files to `claude/`:

1. **Verify Operational Purpose**: Confirm file supports Claude behavior, not project content
2. **Update References**: Update all file path references in CLAUDE.md and other files
3. **Maintain Functionality**: Ensure Claude can still access and execute all operational procedures
4. **Document Changes**: Log migration in audit system for accountability

This specification ensures the `claude/` directory remains a focused, maintainable operational support system for Claude Code functionality.