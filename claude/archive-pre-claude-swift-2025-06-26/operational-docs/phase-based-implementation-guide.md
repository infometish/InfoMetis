# Phase-Based Development Implementation Guide

## Overview

Practical step-by-step guide for implementing the phase-based development strategy in day-to-day work. This guide shows how to break roadmap items into phases, create GitHub milestones and issues, and compose versions.

## Step 1: Phase Decomposition

### Breaking Roadmap Items into Phases

**Criteria for Good Phases**:
- **Deliverable-focused** - Clear, testable outcome that adds value
- **Time-bounded** - 1-3 weeks of focused work maximum
- **Well-interfaced** - Clean integration points with other work
- **Independence** - Can be worked on without blocking other phases

**Phase Naming Convention**:
`[Roadmap Item] Phase [Number]: [Specific Deliverable]`

**Examples**:
- Repository Restructure Phase 1: Boot/Release area reorganization
- TDD Implementation Phase 1: Basic test workflow for critical areas
- AVRO Integration Phase 1: Schema design and planning

### Phase Documentation Template

For each phase, create a brief specification:

```markdown
## [Roadmap Item] Phase [N]: [Deliverable]

**Goal**: One sentence describing what this phase accomplishes

**Scope**: 
- What is included in this phase
- What is explicitly excluded (for later phases)

**Success Criteria**:
- Measurable outcomes that define completion
- Tests or validation steps required

**Dependencies**:
- Other phases or work that must complete first
- External dependencies or decisions needed

**Integration Points**:
- How this phase connects with other concurrent work
- What interfaces or contracts this phase establishes

**Estimated Effort**: [1-3 weeks]
```

## Step 2: GitHub Milestone Creation

### Creating Milestones for Phases

**Milestone Naming**: Use the same convention as phase names
**Timeline**: Set realistic due dates based on estimated effort and dependencies

```bash
# Create milestone via GitHub CLI
gh api repos/:owner/:repo/milestones --method POST \
  --field title="Repository Restructure Phase 1: Boot/Release area reorganization" \
  --field description="Reorganize boot app structure, enhance release routines, update documentation" \
  --field due_on="2024-07-31T23:59:59Z"

# Or via web interface:
# Navigate to Issues → Milestones → New milestone
```

**Milestone Description Template**:
```
Goal: [One sentence goal from phase spec]

Scope:
- [Key deliverables]
- [What's excluded]

Success Criteria:
- [Measurable outcomes]

Integration: Works with [related phases from other roadmap items]
```

## Step 3: Issue Creation Within Phases

### Breaking Phases into Issues

**Issue Sizing**: Each issue should represent 1-3 days of work maximum
**Issue Types**: Use labels to categorize work type

**Common Issue Types**:
- `planning` - Design, analysis, specification work
- `enhancement` - New feature implementation
- `refactor` - Code restructuring or improvement
- `documentation` - Documentation creation or updates
- `testing` - Test creation, framework setup

**Issue Naming Convention**:
`[Action Verb]: [Specific Task] (Phase [N])`

**Examples**:
- `Plan: Design single-concern folder structure (Phase 1)`
- `Implement: Migrate boot app directory structure (Phase 1)`
- `Update: Boot area documentation for new structure (Phase 1)`

### Issue Creation Process

```bash
# Create issue and assign to milestone
gh issue create \
  --title "Plan: Design single-concern folder structure (Phase 1)" \
  --body "$(cat <<'EOF'
Design the folder structure for single-concern organization of the repository.

**Tasks:**
- [ ] Analyze current structure and identify concerns
- [ ] Design target folder organization
- [ ] Plan migration approach
- [ ] Document structure decisions

**Acceptance Criteria:**
- Clear folder structure documented
- Migration approach defined
- Integration points with other phases identified

**Related:** Part of Repository Restructure Phase 1
EOF
)" \
  --milestone "Repository Restructure Phase 1: Boot/Release area reorganization" \
  --label "planning,enhancement"
```

### Issue Template

```markdown
## Issue Description
Brief description of what this issue accomplishes.

**Tasks:**
- [ ] Specific task 1
- [ ] Specific task 2
- [ ] Specific task 3

**Acceptance Criteria:**
- Measurable outcome 1
- Measurable outcome 2
- Required validation steps

**Integration Notes:**
- How this connects with other issues in the phase
- Dependencies on other work
- What this enables for subsequent work

**Related:** Part of [Phase Name]
```

## Step 4: Version Composition Planning

### Combining Phases into Versions

**Version Planning Principles**:
- Combine phases that naturally work together
- Ensure coherent theme or capability delivery
- Maintain manageable scope (4-8 weeks total)
- Minimize cross-phase dependencies

**Version Composition Process**:

1. **Identify Completed Phases**: Which phases are ready or nearly ready for integration?

2. **Find Natural Groupings**: Which phases work well together?
   - Shared technology areas
   - Related functional domains
   - Natural workflow sequences

3. **Validate Scope**: Is the combined work manageable?
   - Total effort estimation
   - Integration complexity
   - Testing requirements

4. **Plan Integration**: How will the phases combine?
   - Integration testing approach
   - Documentation updates needed
   - Release preparation steps

### Version Planning Template

```markdown
## Version [X.Y.Z]: "[Theme Name]"

**Included Phases:**
- [Roadmap Item] Phase [N]: [Deliverable] (Status: [Complete/In Progress])
- [Roadmap Item] Phase [N]: [Deliverable] (Status: [Complete/In Progress])

**Rationale:**
Why these phases work well together and what coherent capability they deliver.

**Integration Plan:**
- [ ] Integration testing approach
- [ ] Documentation updates required
- [ ] Release preparation steps
- [ ] Rollback plan if needed

**Success Criteria:**
- How we'll know this version is successful
- Key metrics or validation steps

**Timeline:** [Estimated completion date]
```

## Step 5: Daily Workflow Integration

### Working with Issue Branches

**Standard Daily Flow**:

```bash
# 1. Check current issue status
gh issue list --milestone "Current Phase" --assignee @me

# 2. Start work on specific issue
git checkout -b feature/issue-123
# (Issue number automatically included in branch name)

# 3. Work in small commits referencing issue
git commit -m "feat: implement folder structure design (#123)"
git commit -m "docs: add structure documentation (#123)"

# 4. Create PR when issue complete
gh pr create \
  --title "Plan: Design single-concern folder structure (#123)" \
  --body "Closes #123"

# 5. After merge, move to next issue
git checkout main && git pull
git branch -d feature/issue-123
```

### TDD Bug Workflow Integration

```bash
# Bug reported via GitHub issue
gh issue create \
  --title "Bug: console/log crashes on null arguments" \
  --label "bug" \
  --body "Reproduction steps and expected behavior"

# Immediately start bug fix with TDD
git checkout -b bugfix/issue-456

# Write failing test first (Red)
git commit -m "test: add failing test for null arg handling (#456)"

# Implement minimal fix (Green)
git commit -m "fix: handle null arguments in console/log (#456)"

# Refactor if needed
git commit -m "refactor: improve null checking logic (#456)"

# Create PR for same-day merge
gh pr create \
  --title "Fix: console/log null argument handling (#456)" \
  --body "Closes #456"
```

## Step 6: Progress Tracking and Adaptation

### Regular Review Cycle

**Weekly Phase Review**:
- Review progress on current milestone issues
- Identify blockers or scope adjustments needed
- Plan upcoming issue priorities

**Phase Completion Review**:
- Validate phase success criteria met
- Document lessons learned
- Update estimates for future phases

**Version Planning Review**:
- Assess phase completion status
- Adjust version composition if needed
- Plan integration approach

### Adaptation Triggers

**When to Adjust Phases**:
- Effort estimates significantly off (>50% variance)
- Unexpected dependencies discovered
- Integration challenges emerge
- External requirements change

**When to Adjust Version Composition**:
- Phase delays affect version timeline
- Integration complexity higher than expected
- New opportunities for better phase combinations
- External release pressures

### Learning Capture

After each phase and version completion, update:
- `docs/current-development-process.md` with key learnings
- Phase decomposition guidelines based on experience
- Version composition patterns that worked well
- Effort estimation improvements

## Templates and Checklists

### Phase Planning Checklist
- [ ] Clear, testable deliverable defined
- [ ] Time estimate within 1-3 weeks
- [ ] Dependencies identified and manageable
- [ ] Integration points documented
- [ ] Success criteria specific and measurable

### Issue Creation Checklist
- [ ] Task fits within 1-3 days
- [ ] Clear acceptance criteria defined
- [ ] Assigned to appropriate milestone
- [ ] Labeled with work type
- [ ] Dependencies noted

### Version Composition Checklist
- [ ] Phases have coherent theme
- [ ] Total scope manageable (4-8 weeks)
- [ ] Integration approach planned
- [ ] Success metrics defined
- [ ] Documentation updates identified

### Daily Work Checklist
- [ ] Working on highest priority issue
- [ ] Branch name includes issue number
- [ ] Commits reference issue in message
- [ ] Progress visible in issue comments
- [ ] PR created when issue complete

This implementation guide provides the practical tools needed to execute the phase-based development strategy effectively while maintaining quality and learning cycles.