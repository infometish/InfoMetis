# AUDIT_LOGGING Workflow

## Overview

The AUDIT_LOGGING workflow defines mandatory rules and procedures for maintaining the operational audit log in `claude/project/audit/current/current.log`. This workflow ensures consistent, trackable logging of all workflow activities and session management.

## Core Principles

### 1. Unique Append Marker
**MANDATORY**: All audit log entries MUST be appended before the unique marker `##APPEND_MARKER_UNIQUE##`

```
✅ CORRECT FORMAT:
2025-06-21T19:29:05Z|WORKFLOW_NAME|step|context|file.txt|Description of activity
##APPEND_MARKER_UNIQUE##

❌ INCORRECT - includes line numbers:
    23→2025-06-21T19:29:05Z|WORKFLOW_NAME|step|context|file.txt|Description
    24→##APPEND_MARKER_UNIQUE##
```

### 2. Clean Marker Management
- Marker MUST always appear as clean text: `##APPEND_MARKER_UNIQUE##`
- NO line numbers, NO prefixes, NO suffixes
- Marker serves as insertion point for new entries

## Audit Log Entry Format

### Standard Entry Structure
```
TIMESTAMP|WORKFLOW|STEP_TYPE|CONTEXT|FILE_PATH|DESCRIPTION
```

**Components:**
- **TIMESTAMP**: ISO format with timezone (e.g., `2025-06-21T19:29:05Z`)
- **WORKFLOW**: Workflow name (e.g., `SESSION_START`, `METRICS_ANALYSIS`)
- **STEP_TYPE**: Activity type (`workflow_start`, `step`, `workflow_complete`, `complete`, `final`, `item_complete`)
- **CONTEXT**: Activity category or domain
- **FILE_PATH**: Relevant file path (optional, use `||` if none)
- **DESCRIPTION**: Clear description of activity performed

## Workflow Logging Patterns

### 1. Workflow Start
```
2025-06-21T19:29:05Z|WORKFLOW_NAME|workflow_start|context|file_path|Starting workflow description
```

### 2. Workflow Steps  
```
2025-06-21T19:29:05Z|WORKFLOW_NAME|step|context|file_path|Step description and outcome
```

### 3. Workflow Completion
```
2025-06-21T19:29:05Z|WORKFLOW_NAME|workflow_complete|context|file_path|Completion summary
```

### 4. Item Start/Complete Logging (PRIMARY PATTERN)
**ITEM-TRIGGERED AUDIT LOGGING**: The primary logging pattern for tracking work completion on discrete work items:

```
# Item complete (multiple entries reflecting workflows used)
2025-06-21T19:29:05Z|WORKFLOW_NAME|item_complete|context|file_path|Specific workflow activity completed
2025-06-21T19:29:05Z|ANOTHER_WORKFLOW|item_complete|context|file_path|Another workflow activity completed
2025-06-21T19:29:05Z|WORK_ITEM|item_complete|work_completion|relevant_file|Completed: Description of work item
```

**Pattern:**
- **Work execution**: Execute the work completely without logging interruption
- **Completion tracking**: After work is done, log multiple `item_complete` entries reflecting each workflow used during completion
- **Final completion entry**: Summary entry for the overall work item
- **Timestamp grouping**: All completion entries use same timestamp for grouped tracking
- **Decoupled from repository todo list** - applies to any discrete work item
- **No start logging**: Focus on outcomes, not process initiation

### 5. New File Creation (MANDATORY)
**MANDATORY FILE CREATION LOGGING**: When ANY new file is created during workflow execution, Claude MUST log the file creation activity:

```
2025-06-21T19:29:05Z|WORKFLOW_NAME|file_created|context|path/to/new/file.ext|Created new file: filename.ext - purpose description
```

**Requirements:**
- **FILE_PATH**: MUST contain the complete path to the newly created file
- **DESCRIPTION**: MUST include filename and brief purpose description
- **TIMING**: Log entry MUST be created immediately after file creation
- **CONTEXT**: Should reflect the domain or purpose of the file creation

**Examples:**
```
2025-06-21T19:29:05Z|DOCUMENTATION_WORKFLOW|file_created|documentation|docs/api/authentication.md|Created new file: authentication.md - API authentication guide
2025-06-21T19:29:05Z|FEATURE_IMPLEMENTATION|file_created|testing|tests/unit/user-service.test.js|Created new file: user-service.test.js - unit tests for user service
2025-06-21T19:29:05Z|PROJECT_SETUP|file_created|configuration|config/database.json|Created new file: database.json - database configuration settings
```

**Purpose**: Provides complete audit trail of all new files created during workflows, enabling tracking of project evolution and supporting accountability for file system changes.

## Appending Procedure

### 1. Read Current Log
```javascript
// Always read current state first
const logContent = fs.readFileSync('claude/audit/current/current.log', 'utf8');
```

### 2. Locate Append Position
```javascript
// Find the unique marker
const markerIndex = logContent.indexOf('##APPEND_MARKER_UNIQUE##');
```

### 3. Insert New Entry
```javascript
// Insert new entry before marker
const newEntry = '2025-06-21T19:29:05Z|WORKFLOW|step|context|file|Description\n';
const updatedContent = logContent.replace(
    '##APPEND_MARKER_UNIQUE##',
    newEntry + '##APPEND_MARKER_UNIQUE##'
);
```

### 4. Write Updated Log
```javascript
fs.writeFileSync('claude/audit/current/current.log', updatedContent);
```

## Common Anti-Patterns to Avoid

### ❌ Line Number Contamination
```
WRONG: 23→2025-06-21T19:29:05Z|WORKFLOW|step|context||Description
WRONG:     24→##APPEND_MARKER_UNIQUE##
```

### ❌ Marker Corruption  
```
WRONG: ##APPEND_MARKER_UNIQUE##s
WRONG:     25→##APPEND_MARKER_UNIQUE##
WRONG: ##APPEND_MARKER_UNIQUE## (with extra content)
```

### ❌ Missing Marker Management
```
WRONG: Appending without ensuring clean marker state
WRONG: Leaving broken or duplicated markers
```

## Integration with Edit Tool

### Proper Edit Tool Usage
When using the Edit tool to append audit entries:

1. **Always specify the exact marker text**:
   ```
   old_string: ##APPEND_MARKER_UNIQUE##
   new_string: NEW_ENTRY\n##APPEND_MARKER_UNIQUE##
   ```

2. **Handle line number contamination**:
   ```
   // If marker appears with line numbers, clean it first
   old_string: 23→##APPEND_MARKER_UNIQUE##
   new_string: ##APPEND_MARKER_UNIQUE##
   ```

3. **Verify clean state after edit**:
   - Check that marker appears without line numbers
   - Ensure proper newline formatting

## Session Management Integration

### SESSION_START Logging
```
2025-06-21T19:29:05Z|SESSION_START|workflow_start|session_management|claude/project/audit/current/current.log|Starting new session - workflow initialization
2025-06-21T19:29:05Z|SESSION_START|step|branch_management|unplanned|Verified on unplanned branch as required
2025-06-21T19:29:05Z|SESSION_START|workflow_complete|session_management|claude/project/audit/current/current.log|SESSION_START complete - session initialized, ready for work
```

### SESSION_END Archival
Before session end, current log may be archived:
```bash
# Archive current log with timestamp
cp claude/project/audit/current/current.log claude/project/audit/current/session_$(date -u +"%Y-%m-%dT%H-%M-%S").log

# Reset current log with clean marker
echo "##APPEND_MARKER_UNIQUE##" > claude/project/audit/current/current.log
```

## Quality Assurance

### Audit Log Validation
Regular validation should check:
- [ ] Unique marker exists and is clean
- [ ] All entries follow proper format
- [ ] No line number contamination
- [ ] Proper timestamp formatting
- [ ] Complete workflow lifecycle logging

### Automated Checks
```bash
# Check for clean marker
grep -c "^##APPEND_MARKER_UNIQUE##$" claude/project/audit/current/current.log

# Verify no line number contamination  
grep -c "→##APPEND_MARKER_UNIQUE##" claude/project/audit/current/current.log

# Should return 0 (no contamination found)
```

## Error Recovery

### Corrupted Marker Recovery
If marker becomes corrupted:
```bash
# 1. Read current log
# 2. Remove all corrupted marker instances
# 3. Append clean marker at end
# 4. Verify integrity
```

### Missing Entries Recovery
If workflow steps are missing from audit:
```bash
# Add retrospective entries with clear indication:
2025-06-21T19:29:05Z|RECOVERY|step|audit_repair||Retrospective entry: workflow X completed previously
```

## Success Criteria

### Audit Log Integrity
- [ ] Unique marker maintained in clean state
- [ ] All workflow activities properly logged
- [ ] Consistent entry formatting across all workflows
- [ ] No line number contamination in marker

### Operational Reliability
- [ ] Append operations work consistently
- [ ] Session boundaries clearly marked
- [ ] Workflow lifecycles completely tracked
- [ ] Integration with all workflow types functional

This workflow ensures reliable, consistent audit logging that supports operational accountability and process improvement across all SPlectrum development activities.