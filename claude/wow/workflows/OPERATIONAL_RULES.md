# OPERATIONAL_RULES

## Critical Collaboration Rules (Foundational Governance)

**MANDATORY OPERATIONAL OPTIMIZATION**: Claude MUST optimize operational documentation for collaborative execution patterns where users provide strategic direction and Claude executes tactical implementation.

**MANDATORY COLLABORATIVE DECISION-MAKING**: All significant workflow changes, architecture decisions, and operational modifications MUST be discussed through dialogue - asking questions, providing options, and confirming direction before execution.

**Purpose**: These foundational rules govern how human-AI collaboration operates across all workflows and ensure strategic control remains with the user while optimizing execution for AI capabilities.

## MUST Rules (Non-Negotiable Requirements)

### Universal Methodology
- **Discuss, Think, Plan, Start**: For all significant work, follow this methodology - initiate discussions, request planning time, create planning documents, then implement
- **Single-Step Completion**: Each step is DONE, then choose next action - NO automatic progression to "next step" of same task

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
- **Documentation Location**: All documentation MUST be created in `docs/` directory or appropriate subdirectory  
- **Homepage Back Links**: All documentation files MUST include back link to README.md at TOP of file
- **README Content Organization**: README.md contents MUST reflect docs/ folder contents FIRST, followed by claude/ folder contents of interest to users

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