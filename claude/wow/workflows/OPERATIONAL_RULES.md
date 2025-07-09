# OPERATIONAL_RULES

## Critical Collaboration Rules (Foundational Governance)

**MANDATORY OPERATIONAL OPTIMIZATION**: Claude MUST optimize operational documentation for collaborative execution patterns where users provide strategic direction and Claude executes tactical implementation.

**MANDATORY COLLABORATIVE DECISION-MAKING**: All significant decisions and actions MUST be discussed through dialogue - asking questions, providing options, and confirming direction before execution.

**Purpose**: These foundational rules govern how human-AI collaboration operates across all workflows and ensure strategic control remains with the user while optimizing execution for AI capabilities.

## MUST Rules (Non-Negotiable Requirements)

### Critical Step-by-Step Execution Pattern
**MANDATORY WORKFLOW PATTERN**: All work MUST follow single-step completion with choice points.

#### 1. Single-Step Completion
- Each step is a complete, meaningful achievement
- Mark step as DONE immediately upon completion
- NO automatic progression to "next step" of same task

#### 2. Choice Point After Every Step
- After completing ANY step, PAUSE and present options:
  - Continue with related next step
  - Switch to different priority item
  - Address urgent issues
  - End session

#### 3. Item Granularity
- ALL work items MUST be single completable steps
- ❌ "Implement user authentication" 
- ✅ "Create GitHub issue for auth prototype"
- ✅ "Research authentication library options"
- ✅ "Write login flow example"

#### 4. Progress Recognition
- Celebrate each completed step as meaningful progress
- **AUTOMATIC**: Audit logging triggered when repository todo items are completed - all required fields naturally available at completion point
- **SINGLE SYSTEM**: Use repository todo list only for all work tracking

**Purpose**: Prevents tunnel vision, enables dynamic re-prioritization, provides clear progress tracking, and ensures collaborative decision-making at every step.

### Universal Methodology
- **Discuss, Think, Plan, Start**: For all significant work, follow this methodology - initiate discussions, request planning time, create planning documents, then implement
- **Ask, Don't Assume**: Always confirm understanding before taking action - collaboration requires confirmation, not assumption

### File and Path Management  
- **File Path Specification**: All file references MUST specify exact file paths (e.g., `claude/project/audit/current/current.log` NOT "log in timelog")
- **Always return to repo root** after any subdirectory operations

### Audit and Documentation
- **Audit Format Enforcement**: Before ANY audit logging, verify correct format: `TIMESTAMP|WORKFLOW|STEP_TYPE|CONTEXT|FILE_PATH|DESCRIPTION`
- **Audit tracking REQUIRED** - Update current audit log at every activity transition, issue switch, and session boundary
- **Document learnings REQUIRED** - At session end, capture "What have I learned?" in appropriate docs/ files

### Version Control and Project Management
- **Default Branch State**: Repository MUST default to `unplanned` branch at all times
- **Branch Transition Protocol**: Complete work cycle before leaving ANY branch (commit → push → PR → merge → switch)
- **Stage all files before commit** - Work packages are atomic, use `git add .`
- **Assign issues to milestones** - All issues must be assigned to appropriate epic phase milestone

### Documentation Standards
**MANDATORY DOCUMENTATION RULES**:
1. **File Location**: All documentation MUST be created in `docs/` directory or appropriate subdirectory
2. **Homepage Back Links**: All documentation files MUST include back link to README.md at TOP of file
3. **Back Link Format**: `[← Back Home](../README.md)` (adjust path as needed)
4. **No External Documentation**: NEVER create documentation files outside `docs/` hierarchy
5. **README.md Content Organization**: README.md contents MUST reflect docs/ folder contents FIRST, followed by claude/ folder contents of interest to users

**AUTOMATIC CORRECTION**: When documentation files are found outside `docs/`, Claude MUST:
1. Move files to appropriate `docs/` subdirectory
2. Update all references to new locations
3. Fix homepage back links to be at top of files

## SHOULD Rules (Strong Recommendations)
- **Create issues for significant work** - When discussion leads to implementation decisions, create GitHub issue before starting work to enable proper tracking and documentation
- **Close issues on completion** - Mark issues complete when work is finished, with judgment required on completion criteria
- **Use named arguments** - `spl/app/run -f script.js -a args` NOT `spl/app/run script.js args`
- **Correct command syntax** - `./spl_execute <install-folder> <app-name> <command>` (e.g., `./spl_execute spl boot usr/apps_to_release`)
- **Test batch files first** with `spl/app/exec -f` before generating usr/ commands
- **Follow existing code patterns** - Mimic style, libraries, and conventions in codebase
- **Documentation housekeeping** - When features completed, REMOVE planning/scaffolding docs entirely
- **Decision logging** - Log strategic/architectural decisions in `docs/decision-log.md` when they meet decision criteria (strategic changes, technical architecture, workflow changes, technology adoption, epic modifications)

## PREFER Rules (Better Choices When Options Exist)
- **PREFER editing existing files** over creating new ones
- **PREFER rg (ripgrep)** over grep for searching
- **PREFER Task tool** for unknown codebase exploration
- **PREFER direct tools** (Read, Glob) for specific known files

## AVOID Rules (Generally Don't Do)
- **AVOID in-code defaults** (`|| "value"`) - causes hidden bugs
- **AVOID creating unnecessary documentation** - only create when explicitly requested
- **AVOID mixing concerns** - Script vs Batch: `scripts/` for multi-language, `batches/` for SPL

## CONTEXTUAL Rules (Situation-Dependent Guidelines)
- **Module locations**: Check app's `spl.js` - Global (`/modules/`) vs install (`/spl/modules/`)
- **Debug mode**: Use `./spl_execute spl app-name -d command` when troubleshooting
- **Path issues**: Use `spl.context(input, "cwd")` for install root resolution
- **Test help**: All commands support `-h` or `--help` for guidance