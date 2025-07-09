[← Back to Claude-Swift Home](../../../README.md)

# Issue Structure and Prioritization

**Purpose**: Standardized issue structure to enable smart prioritization and dependency management for `next sesame` workflow recommendations.

## Issue Template Structure

### **Core Issue Template:**
```markdown
## Description
[Clear description of what needs to be done]

## Priority: [HIGH/MEDIUM/LOW]
**Justification:** [Why this priority level]

## Dependencies
**Blocks:** [List of issues this blocks]
**Blocked by:** [List of issues that must be done first]
**Related:** [Issues that should be considered together]

## Effort: [S/M/L/XL]
**Estimate:** [Brief justification for effort level]

## Test Criteria
**How to verify completion:**
- [ ] [Specific test/validation step]
- [ ] [Another verification step]
- [ ] [Final acceptance criteria]

## Work Area: [Epic Label]
**Context:** [Brief note about which work area this affects]
```

## Categorization Standards

### **Priority Levels:**
- **HIGH**: Critical for version completion, blocks other work, or addresses urgent issues
- **MEDIUM**: Important for version goals, moderate impact on other work
- **LOW**: Nice to have, minimal impact if deferred, background improvements

### **Effort Estimates:**
- **S (Small)**: 1-2 hours, single focused task
- **M (Medium)**: Half day to full day, moderate complexity
- **L (Large)**: 2-3 days, complex task or multiple components
- **XL (Extra Large)**: Week+, major feature or significant refactoring

### **Dependency Types:**
- **Blocks**: Issues that cannot start until this is complete
- **Blocked by**: Issues that must be completed before this can start
- **Related**: Issues that should be considered together but not strict dependencies

## Smart Prioritization Logic

### **`next sesame` Priority Matrix:**
1. **HIGH priority + No blockers** = Top candidates
2. **Blocks many other issues** = High impact work
3. **Small effort + Medium/High priority** = Quick wins  
4. **All dependencies satisfied** = Ready to start

### **Scoring Algorithm:**
```
Score = (Priority Weight × Impact Factor × Readiness) / Effort Factor

Where:
- Priority Weight: HIGH=3, MEDIUM=2, LOW=1
- Impact Factor: Number of issues this blocks + 1
- Readiness: 1 if no blockers, 0.5 if partial blockers, 0 if fully blocked
- Effort Factor: S=1, M=2, L=3, XL=4
```

### **Anti-Patterns to Avoid:**
- **Blocked by unresolved dependencies** = Skip for now
- **Large effort without clear test criteria** = Needs refinement
- **Low priority blocking nothing** = Defer
- **Missing dependency information** = Needs clarification

## Recommendation Logic

### **Smart Recommendation Process:**
1. **Filter Available Issues**: Remove blocked issues and those missing critical information
2. **Calculate Scores**: Apply scoring algorithm to remaining issues
3. **Rank by Score**: Sort issues by calculated priority score
4. **Validate Choice**: Ensure top issue has clear test criteria and realistic scope
5. **Provide Context**: Explain why this issue was recommended

### **Recommendation Output Format:**
```
Recommended Issue: [Issue Title]
Score: [Calculated score]
Reasoning: [Why this issue was chosen]
  - Priority: [Level and justification]
  - Impact: [What this enables/blocks]
  - Effort: [Estimated complexity]
  - Readiness: [Dependency status]
  
Next Steps:
- [Specific action items to begin work]
- [Key considerations or context]
```

## Implementation Guidelines

### **Issue Creation:**
- Use template structure for all new issues
- Provide clear justification for priority and effort estimates
- Identify dependencies during initial issue creation
- Write specific, testable acceptance criteria

### **Issue Updates:**
- Update dependency status as work progresses
- Adjust priority/effort estimates based on learning
- Mark dependencies as resolved when work completes
- Keep test criteria current and specific

### **Workflow Integration:**
- `version sesame` uses this structure for milestone planning
- `next sesame` uses this data for smart recommendations
- `planning sesame` validates and refines issue structure
- Issue completion triggers dependency updates

## Learning and Iteration

### **Feedback Loop:**
- Track actual effort vs. estimates to improve estimation
- Monitor dependency accuracy to refine identification
- Assess recommendation quality to enhance scoring algorithm
- Capture lessons learned to improve template structure

### **Continuous Improvement:**
- Regular review of categorization effectiveness
- Algorithm adjustments based on recommendation success
- Template refinements based on usage patterns
- Integration improvements based on workflow experience

---

*This structure enables data-driven issue prioritization while maintaining practical simplicity for daily development workflow.*