# REPO_TODO_WORKFLOW

## ⚠️ REPOSITORY TODO LIST MANAGEMENT ⚠️

**MANDATORY TODO MANAGEMENT**: All repository todo list operations MUST follow this standardized workflow to ensure consistency and accountability.

**TRIGGER**: `todo sesame` or when repository todo list operations are needed

**PRIMARY TODO FILE**: `claude/project/todo.md`

## MANDATORY TODO OPERATIONS

### 1. Todo Status Indicators
**MANDATORY STATUS SYSTEM**:
- **✅ Completed**: Task finished successfully - MUST be removed from active list immediately
- **⏳ Remaining**: Task pending or in progress
- **🔄 IN PROGRESS**: Overall project/epic status indicator
- **📋 Topic**: Discussion topic or planning item

### 2. Todo Completion Rules
**MANDATORY COMPLETION PROCESS**:
1. **Mark as ✅**: Change status from ⏳ to ✅ when task completed
2. **IMMEDIATE REMOVAL REQUIRED**: Completed tasks MUST be removed from active list to maintain focus
3. **Historical Archive**: Move completed items to "Completed" section or remove entirely if no archival value
4. **Completion Tracking**: Todo completion follows standard item-triggered audit logging patterns

### 3. Todo Addition Rules
**MANDATORY ADDITION PROCESS**:
1. **Add to appropriate section**: Match project context or create new section
2. **Use ⏳ status**: New tasks default to remaining status
3. **Specific descriptions**: Clear, actionable task descriptions
4. **File path references**: Include exact file paths when relevant
5. **Addition Tracking**: Todo addition follows standard item-triggered audit logging patterns

### 4. Todo Update Rules
**MANDATORY UPDATE PROCESS**:
1. **Status changes**: Only valid transitions: ⏳ → ✅ or ⏳ → ⏳ (description updates)
2. **No backwards transitions**: Never ✅ → ⏳ (create new todo instead)
3. **Description updates**: Allowed for clarification, maintain original intent
4. **Audit logging**: Record all significant updates

## INTEGRATION WITH OTHER WORKFLOWS

### SESSION_START Integration
- **Present todo list**: Show current state for user selection
- **Recovery check**: Verify completed items from previous session match audit log
- **Priority identification**: Help user choose next work item

### SESSION_END Integration
- **Completion review**: Mark any completed tasks as ✅
- **Status verification**: Ensure all todos have appropriate status
- **Audit alignment**: Verify audit log matches todo completion status
- **MANDATORY TRANSIENT TODO TRANSFER**: All items from transient todo list MUST be added as first items in repository todo list to guarantee cross-session continuity

### Built-in TODO_MANAGEMENT Integration
- **Session todos**: Use built-in TodoWrite/TodoRead for session work tracking
- **Repository todos**: Use REPO_TODO_WORKFLOW for persistent cross-session items
- **Clear separation**: Session todos ephemeral, repository todos persistent

## TODO LIST STRUCTURE

### Required Sections
1. **Current Topics for Discussion**: High-level project themes
2. **Remaining Tasks**: Specific actionable items
3. **Completed Tasks** (when applicable): Historical record within project context

### File Format Requirements
```markdown
# Repository Todo List

## Current Topics for Discussion

### [Project Name]
- **Status**: 🔄 IN PROGRESS / ✅ COMPLETED
- **Context**: [Brief description]
- **Current Phase**: [Phase description]
- **Completed Tasks**:
  - ✅ [Task description] (`file/path/reference`)
  - ✅ [Task description] (`file/path/reference`)

- **Remaining Tasks**:
  - ⏳ [Task description]
  - ⏳ [Task description]

### [Next Project]
...
```

## CONFLICT RESOLUTION

### CLAUDE.md vs SESSION_END Conflict Resolution
**AUTHORITATIVE RULE**: This workflow provides definitive instruction:
- **CLAUDE.md**: "Remove completed items immediately" → **CONFIRMED**
- **SESSION_END.md**: "Mark completed tasks as completed status" → **ENHANCED**
- **Standard**: Mark as ✅ completed, then IMMEDIATELY remove from active repository todo list
- **Focus Maintenance**: Active list contains only pending work for clear prioritization

### Historical Context Preservation
- **Audit log**: Provides detailed operational history and completion accountability
- **Repository todo list**: Provides active work focus (pending items only)
- **Session todos**: Provide implementation-level task tracking
- **Clear Separation**: Audit log preserves history, todo list maintains current focus

## WORKFLOW EXECUTION STEPS

### Adding New Todo
1. Identify appropriate project section in persistent todo list
2. Add item with ⏳ status and clear description
3. Include file path references when relevant
4. Log addition in audit log
5. Present updated list to user if requested

### Completing Todo
1. Change status from ⏳ to ✅ briefly for confirmation
2. **IMMEDIATE REMOVAL**: Delete completed item from active todo list
3. Log completion in audit log with completion details
4. Verify completion aligns with session work performed
5. **Clean List Maintenance**: Ensure only pending work remains visible

### Transient Todo Transfer (SESSION_END)
1. Read all items from current transient todo list (TodoRead)
2. Add incomplete transient todos as ⏳ items at TOP of appropriate repository todo section
3. **Log completed transient todos** in audit log but DO NOT add to repository list
4. Use descriptive context from transient todos for repository todo descriptions
5. Log transfer operation in audit log
6. **Clean Transfer**: Only pending work transfers to repository list

### Project Completion
1. Complete all remaining ⏳ tasks (mark ✅ then remove)
2. Change project status from 🔄 IN PROGRESS to ✅ COMPLETED
3. **Archive Entire Section**: Remove completed project section from active list
4. **Audit Log Summary**: Record project completion with accomplishment summary
5. **Clean Slate**: Maintain active list with only current work

## SUCCESS METRICS

### Quality Indicators
- **Consistent status usage**: All todos have appropriate status indicators
- **Audit alignment**: Todo completions match audit log entries
- **Clear descriptions**: All todos are actionable and specific
- **File path compliance**: References include exact paths per CLAUDE.md requirements
- **Complete transient transfer**: No session todos lost between sessions

### Accountability Measures
- **Cross-session continuity**: Todo state preserved between sessions
- **Completion tracking**: Clear record of what was accomplished
- **Progress visibility**: Current state obvious to any session
- **Historical preservation**: Completed work remains visible for accountability

## AUTOMATION OPPORTUNITIES

### Future Enhancements
- **Auto-completion detection**: Compare audit log patterns to todo status
- **Status validation**: Automated checks for consistency
- **Progress reporting**: Generate completion summaries from todo status
- **Integration alerts**: Notify of todo/audit misalignment

---

*This workflow provides centralized, authoritative guidance for repository todo list management, ensuring consistency across all sessions and clear accountability for project progress.*

---

[← Back to Claude-Swift Home](../../README.md)