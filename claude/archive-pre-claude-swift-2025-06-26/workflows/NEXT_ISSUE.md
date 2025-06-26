# NEXT_ISSUE

## Overview
Automated workflow for selecting the next GitHub issue to work on, combining recommendation engine with contextual decision factors.

## Workflow Steps

### 1. Get Automated Recommendations
```bash
node status/project-automation.js recommend
```
**Output**: Top 5 prioritized issues with decision scores

### 2. Apply Context Filters

#### Version Focus
- **Current Version (0.6.1)**: Planning/analysis tasks (Score 85)
- **Future Versions**: Implementation tasks (Score 60-75)
- **Priority**: Complete current version before moving to next

#### Epic Consideration
- **Strategic Balance**: Avoid working only on one epic
- **Dependencies**: Consider cross-epic blocking relationships
- **Container Pioneer**: SE epic has strategic importance for RR epic

#### Session Context
- **Available Time**: Match issue complexity to time available
- **Current Focus**: Consider context switch costs
- **Energy Level**: Match session type to current energy

### 3. Selection Criteria

#### High Priority (Work Immediately)
- Score 85 + Version 0.6.1 + Planning session type
- No blocking dependencies
- Low context switch cost from current work

#### Medium Priority (Good Options)
- Score 75-85 + Strategic value
- Enables future work
- Medium context switch cost acceptable

#### Low Priority (Future Work)
- Score 60-75 + Implementation focus
- Version 0.6.2+ work
- High context switch cost

### 4. Decision Documentation

When selecting an issue, document:
- **Issue Number**: `#XX`
- **Epic**: Which epic it belongs to
- **Rationale**: Why this issue was selected
- **Context**: Current focus and decision factors

## Decision Framework

### Quick Selection (< 2 minutes)
1. Run `recommend` command
2. Pick first item with Score 85 + Version 0.6.1
3. Start work immediately

### Thoughtful Selection (5-10 minutes)
1. Run `recommend` command
2. Review top 5 recommendations
3. Consider current context and epic balance
4. Select based on strategic value and fit
5. Document selection rationale

### Strategic Planning (15+ minutes)
1. Review all Version 0.6.1 items
2. Plan epic progression and dependencies
3. Select items that build toward implementation readiness
4. Consider cross-epic coordination needs

## Integration Patterns

### Session Start Integration
```markdown
**SESSION_START** → **NEXT_ISSUE** → Begin work
```

### Mid-Session Transitions
```markdown
Complete current issue → **NEXT_ISSUE** → Continue with next item
```

### Epic Completion
```markdown
Finish epic phase → **NEXT_ISSUE** → Move to different epic for balance
```

## Automation Enhancements

### Current Automation
- Decision score calculation
- Epic and version assignment
- Session type classification
- Context switch cost assessment

### Future Enhancements
- Personal preference weighting
- Time-based filtering
- Dependency graph analysis
- Epic balance optimization

## Usage Examples

### Example 1: Planning Session Start
```bash
# Get recommendations
node status/project-automation.js recommend

# Output shows 5 Score-85 planning items
# Select #10 (RR-1: Repository analysis) for strategic foundation
# Document: "Selected for strategic foundation - enables other epics"
```

### Example 2: Epic Balance Decision
```bash
# Just completed SE-1 work, need epic diversity
# Recommendations show multiple Score-85 items
# Select #14 (CAE-1: API analysis) for different perspective
# Document: "Epic diversification after SE completion"
```

### Example 3: Time-Constrained Session
```bash
# Only 30 minutes available
# Select highest-score item with "Quick Win" or "Planning" session type
# Avoid "Deep Work" items that need longer focus periods
```

## Success Metrics

### Effective Selection
- Consistent progress across all epics
- Version 0.6.1 completion before 0.6.2 start
- Strategic foundation work completed early
- Dependencies resolved before dependent work

### Workflow Efficiency
- < 2 minutes for routine selections
- Clear selection rationale documented
- No analysis paralysis
- Smooth context transitions

## Trigger Pattern

```markdown
**NEXT_ISSUE** → See [workflows/NEXT_ISSUE.md](./workflows/NEXT_ISSUE.md)
```

Use when:
- Starting new session
- Completing current issue
- Needing direction on what to work on next
- Planning upcoming work priorities