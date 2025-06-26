# KEYWORD_REGISTRY

This file maintains the complete registry of uppercase workflow trigger keywords used in the CLAUDE.md system.

## Custom Workflow Keywords

| Keyword | File | Purpose | Trigger Context | Sesame Alias |
|---------|------|---------|-----------------|--------------|
| **SESSION_START** | `SESSION_START.md` | Time tracking & session initiation | Every new Claude session | `start sesame` |
| **SESSION_END** | `SESSION_END.md` | Session termination & learning capture | End of Claude session | `finish sesame` |
| **GITHUB_WORKFLOW** | `GITHUB_WORKFLOW.md` | Project management & issue lifecycle | GitHub operations, project planning | `github sesame` |
| **GIT_WORKFLOW** | `GIT_WORKFLOW.md` | Branching, commits, releases | Git operations, version releases | `git sesame` |
| **OPERATIONAL_RULES** | `OPERATIONAL_RULES.md` | Development rules framework | Development decisions, coding standards | `rules sesame` |
| **ESSENTIAL_COMMANDS** | `ESSENTIAL_COMMANDS.md` | Core platform execution commands | Platform operations | `commands sesame` |
| **RELEASE_PROCESS** | `RELEASE_PROCESS.md` | Complete release workflow with log archiving | Creating platform releases, version closure | `release sesame` |
| **PLANNED_VS_UNPLANNED** | `PLANNED_VS_UNPLANNED.md` | Work classification strategy | Deciding whether to create issues | `planning sesame` |
| **PROJECT_AUTOMATION** | `PROJECT_AUTOMATION.md` | GraphQL project management automation | GitHub Projects field population, recommendations | `project sesame` |
| **NEXT_ISSUE** | `NEXT_ISSUE.md` | Automated next issue selection workflow | Determining which GitHub issue to work on next | `next sesame` |
| **WORKFLOW_RECOMMENDATION** | `WORKFLOW_RECOMMENDATION.md` | Workflow recommendation system based on historical data | When uncertain which workflow approach to use | `recommend sesame` |
| **VERSION_TRANSITION** | `VERSION_TRANSITION.md` | Mandatory post-release knowledge processing and next version preparation | After RELEASE_PROCESS completion | `transition sesame` |
| **REPO_TODO_WORKFLOW** | `REPO_TODO_WORKFLOW.md` | Repository todo list management and cross-session continuity | Todo operations, status updates, completion tracking | `todo sesame` |
| **NEW_VERSION_PLANNING** | `NEW_VERSION_PLANNING.md` | Next version planning and roadmap development | Version planning, feature prioritization | `version planning sesame` |
| **DOCUMENTATION_WORKFLOW** | `DOCUMENTATION_WORKFLOW.md` | Documentation standards and compliance management | Documentation creation, maintenance, compliance | `docs sesame` |
| **AUDIT_LOGGING** | `AUDIT_LOGGING.md` | Audit log management rules and procedures | Workflow logging, marker management | *No sesame alias* |

## Built-in Claude Code Keywords

These represent my automatic behaviors and built-in workflows:

| Keyword | Built-in Behavior | Trigger Context |
|---------|------------------|-----------------|
| **TODO_MANAGEMENT** | Automatic TodoWrite/TodoRead usage for task tracking | Complex multi-step tasks, planning |
| **TOOL_SELECTION** | Strategic tool choice (Task vs Read/Grep/Glob) | Codebase exploration vs specific file access |
| **SEARCH_STRATEGY** | Parallel search operations, context-aware searching | Finding files, functions, or patterns |
| **ERROR_HANDLING** | Retry logic, fallback strategies, error analysis | Tool failures, unexpected results |
| **CONCURRENCY** | Batch multiple tool calls in single response | Information gathering, parallel operations |
| **CODE_ANALYSIS** | Read-first approach, pattern recognition, convention following | Understanding codebases, making changes |
| **COMMIT_WORKFLOW** | git status + diff + log before commits, staging all files | Git operations, pre-commit checks |
| **RESPONSE_CONCISENESS** | Minimize output tokens, direct answers | All communication |

## Context-Specific Keywords (Future)

Potential additional workflow triggers:

| Context | Potential Keywords | Purpose |
|---------|-------------------|---------|
| Debugging | DEBUG_WORKFLOW | Systematic debugging approach |
| Testing | TESTING_WORKFLOW | Test creation and execution |
| Documentation | DOCS_WORKFLOW | Documentation standards |
| Learning | LEARNING_CAPTURE | End-of-session learning documentation |

## Sesame Alias System

The **sesame suffix** provides user-friendly triggers for workflow keywords:

- **Pattern**: `[descriptive_word] sesame` → `WORKFLOW_KEYWORD`
- **Magic word**: "sesame" (reference to "Open Sesame" - opens workflow execution)
- **Usage**: Users type friendly aliases, system maps to technical keywords
- **Timelog**: Always records technical keywords for consistency

### Sesame Alias Mapping

```
start sesame     → SESSION_START
finish sesame    → SESSION_END  
git sesame       → GIT_WORKFLOW
github sesame    → GITHUB_WORKFLOW
rules sesame     → OPERATIONAL_RULES
commands sesame  → ESSENTIAL_COMMANDS
release sesame   → RELEASE_PROCESS
planning sesame  → PLANNED_VS_UNPLANNED
project sesame   → PROJECT_AUTOMATION
next sesame      → NEXT_ISSUE
recommend sesame → WORKFLOW_RECOMMENDATION
todo sesame      → REPO_TODO_WORKFLOW
```

## Registry Maintenance Rules

1. **Add new keywords here FIRST** before creating workflow files
2. **Update this registry** when modifying existing workflows
3. **Check for conflicts** - ensure keywords are unique and clear
4. **Follow naming convention**: NOUN_VERB or CONTEXT_ACTION format
5. **Keep alphabetical order** within each section for easy scanning
6. **Add sesame alias** for all new workflow keywords using descriptive, memorable words

## Usage Pattern

```markdown
**KEYWORD_NAME** → See [workflows/FILENAME.md](./workflows/FILENAME.md)
```

Example:
```markdown
**SESSION_START** → See [workflows/SESSION_START.md](./workflows/SESSION_START.md)
```