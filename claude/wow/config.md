# WoW System Configuration

## Overview

This file defines the claude-swift Ways of Working (WoW) system configuration. These settings are template architecture decisions that remain consistent across all projects using claude-swift.

## Directory Structure Configuration

### **Audit System**
- **AUDIT_BASE_PATH**: `claude/project/audit`
- **CURRENT_AUDIT_PATH**: `claude/project/audit/current`
- **VERSION_AUDIT_PATTERN**: `claude/project/audit/v{version}`
- **CONSOLIDATED_LOG_PATTERN**: `audit_v{version}.log`
- **CURRENT_LOG_FILE**: `current.log`
- **SESSION_LOG_PATTERN**: `session_{timestamp}.log`

### **Documentation Paths**
- **PROJECT_DOCS_PATH**: `claude/project/docs`
- **PROJECT_WORKFLOWS_PATH**: `claude/project/workflows`
- **WOW_WORKFLOWS_PATH**: `claude/wow/workflows`
- **WOW_AUTOMATION_PATH**: `claude/wow/automation`
- **USER_DOCS_PATH**: `docs`

### **Configuration Files**
- **PROJECT_INFO**: `claude/project/project-info.md`
- **VERSION_CONFIG**: `claude/project/version-config.md`
- **PROJECT_KEYWORDS**: `claude/project/KEYWORD_REGISTRY.md`
- **WOW_KEYWORDS**: `claude/wow/KEYWORD_REGISTRY.md`
- **PROJECT_TODO**: `claude/project/todo.md`

### **Template Structure**
- **TEMPLATE_BASE_PATH**: `template`
- **TEMPLATE_CLAUDE_PATH**: `template/claude`
- **TEMPLATE_DOCS_PATH**: `template/docs`

## Workflow System Configuration

### **Audit Log Format**
- **FORMAT**: `TIMESTAMP|WORKFLOW|STEP_TYPE|CONTEXT|FILE_PATH|DESCRIPTION`
- **TIMESTAMP_FORMAT**: ISO 8601 with Z suffix (e.g., `2025-06-26T10:16:22Z`)
- **FIELD_SEPARATOR**: `|` (pipe character)
- **EMPTY_FIELD**: `||` (double pipe for empty values)
- **APPEND_MARKER**: `##APPEND_MARKER_UNIQUE##`

### **Version Management**
- **VERSION_PATTERN**: `semantic (major.minor.patch)`
- **ARCHIVE_PATTERN**: `v{major}.{minor}.{patch}`
- **RELEASE_ARTIFACT_PATTERN**: `{project-name}-v{version}-RELEASE-NOTES.md`

### **Branch Management**
- **DEFAULT_BRANCH**: `unplanned`
- **INTEGRATION_BRANCH**: `main`
- **ISSUE_BRANCH_PATTERN**: `feature/issue-{number}` or `bugfix/issue-{number}`

## Automation Configuration

### **Script Locations**
- **AUTOMATION_SCRIPTS**: `claude/wow/automation/`
- **PROJECT_SCRIPTS**: `claude/project/scripts/` (if needed)

### **Report Output Locations**
- **OPERATIONAL_REPORTS**: `claude/project/docs/`
- **USER_FACING_REPORTS**: `docs/reports/`
- **STRATEGIC_ANALYSIS**: `claude/project/docs/`

### **Tool Requirements**
- **GIT_REQUIRED**: `true`
- **GITHUB_CLI_REQUIRED**: `true` 
- **NODE_MIN_VERSION**: `14.0.0`
- **SHELL_ENVIRONMENT**: `bash-compatible`

## Integration Points

### **External Dependencies**
- **CLAUDE_CODE_CLI**: Required runtime environment
- **GITHUB_REPOSITORY**: Required for issue tracking and release management
- **FILE_SYSTEM**: Cross-platform compatibility (Windows/WSL, macOS, Linux)

### **Template Deployment**
- **DEPLOYMENT_PATTERN**: `sidecar` (adjacent to target projects)
- **CONTENT_SEPARATION**: Project docs (tracked) vs WoW machinery (configurable)
- **ROLLBACK_MECHANISM**: CLAUDE.md replacement + session restart

---

*WoW System Configuration - Template architecture decisions for claude-swift*