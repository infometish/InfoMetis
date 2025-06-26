# WORKFLOW_RECOMMENDATION

## ⚠️ EXPERIMENTAL STATUS ⚠️

**Current Status**: Experimental - Insufficient data for fine-tuning
**Review Schedule**: Revisit periodically as timelog data accumulates
**Usage**: Use recommendations as suggestions, not absolute guidance

## Purpose

Workflow Recommendation System based on historical data. Analyzes timelog patterns to recommend optimal workflows for new tasks. Uses historical data to identify when structured workflows provide better outcomes than FREESTYLE approaches.

## Trigger Context

**WORKFLOW_RECOMMENDATION** / `recommend sesame` - When starting a new task and uncertain which workflow approach would be most effective.

## Analysis Framework

### Pattern Recognition Categories

#### 1. **Task Complexity Indicators**
- Multi-step implementations → `planning sesame` recommended
- Cross-epic coordination → `project sesame` for GitHub Projects integration  
- Version/release activities → `release sesame` workflow
- Git operations → `git sesame` for branching strategy
- Issue-based work → `github sesame` for proper project tracking

#### 2. **Context Switching Patterns**
```
# High context switch cost indicators:
- Multiple unrelated activities in short timespan
- Frequent workflow switches without completion
- Long FREESTYLE sessions without clear outcomes

# Low context switch cost indicators:  
- Sustained focus on single workflow
- Clear activity progressions within workflow
- Defined start/end boundaries
```

#### 3. **Success Pattern Analysis**
```
# Successful workflow patterns (from timelog):
SESSION_START → documentation → development → completion
FREESTYLE → analysis → planning → structured_workflow
GITHUB_WORKFLOW → issue_creation → development → closure

# Inefficient patterns to avoid:
FREESTYLE → endless_discussion → no_concrete_outcome
Multiple workflow switches → fragmented progress
```

## Recommendation Engine Logic

### Input Analysis
1. **Current Task Context**
   - Issue number present? → Consider `github sesame`
   - Multi-step description? → Consider `planning sesame`
   - Git/release keywords? → Consider `git sesame` or `release sesame`
   - Cross-repository work? → Consider `project sesame`

2. **Recent Session Patterns**
   - Last 10 timelog entries analysis
   - Workflow effectiveness assessment
   - Context switching frequency
   - Task completion rates

3. **Historical Success Patterns**
   - Similar task outcomes in past sessions
   - Time investment vs. completion patterns
   - Workflow transition success rates

### Recommendation Output

```
Based on timelog analysis:
- Task type: [multi-step implementation]
- Similar past tasks: [3 successful with planning sesame, 1 failed with FREESTYLE]
- Recommendation: Start with `planning sesame` workflow
- Confidence: High (75% success rate for similar tasks)
- Alternative: FREESTYLE if task scope becomes smaller than expected
```

## Implementation Workflow

### 1. **Quick Analysis** (30 seconds)
```bash
# Scan recent timelog for patterns
tail -20 /logs/timelog.txt | grep -E "(FREESTYLE|WORKFLOW)"
# Identify current task characteristics
# Make quick recommendation
```

### 2. **Deep Analysis** (2-3 minutes)
```bash
# Comprehensive timelog pattern analysis
# Cross-reference with issue/project context  
# Generate detailed recommendation with alternatives
# Document decision rationale
```

### 3. **Learning Integration**
```bash
# After task completion, analyze actual vs. predicted workflow effectiveness
# Update recommendation patterns
# Document lessons learned for future analysis
```

## Timelog Integration

### Pattern Tracking Format
```
##→TIMESTAMP | WORKFLOW_RECOMMENDATION | recommendation: [workflow] for [task_type] (confidence: [level])
##→TIMESTAMP | [RECOMMENDED_WORKFLOW] | [activity]: [description]
##→TIMESTAMP | WORKFLOW_RECOMMENDATION | outcome_analysis: [workflow] was [effective/ineffective] for [task_type]
```

### Success Metrics
- **Workflow Accuracy**: % of recommendations that led to successful task completion
- **Time Efficiency**: Average time reduction when using recommended vs. ad-hoc workflow selection
- **Context Switch Reduction**: Fewer workflow changes needed when starting with optimal workflow

## Decision Criteria Matrix

| Task Characteristics | Recommended Workflow | Confidence Factors |
|---------------------|---------------------|-------------------|
| Issue #123 work | `github sesame` | Issue exists, clear scope |
| Multi-file changes | `git sesame` | Branching strategy needed |
| Epic coordination | `project sesame` | Cross-project impact |
| Documentation heavy | FREESTYLE | Creative/writing work |
| Analysis/research | FREESTYLE | Exploratory nature |
| Release preparation | `release sesame` | Version/deployment work |
| Workflow improvements | FREESTYLE → structured | Meta-work, often evolves |

## Learning Patterns

### Continuous Improvement
1. **Weekly Pattern Review**: Analyze workflow selection accuracy
2. **Monthly Optimization**: Update recommendation criteria based on outcomes
3. **Quarterly Strategy**: Assess overall workflow effectiveness trends

### Pattern Documentation
- Document new successful workflow combinations
- Identify anti-patterns that consistently fail
- Update recommendation engine with learned patterns

## Integration Points

### With Existing Workflows
- **SESSION_START**: Include quick workflow analysis for major tasks
- **PLANNED_VS_UNPLANNED**: Use analysis to decide whether to create issues
- **PROJECT_AUTOMATION**: Leverage project data for workflow recommendations

### With Decision Making
- Complement human intuition with data-driven insights
- Provide confidence levels to support decision making
- Enable quick pivots when initial workflow choice proves suboptimal

## Future Enhancements

### Scheduled Tweaking Process

When performing periodic tweaking, execute two analysis phases:

#### **Phase 1: Workflow Choice Quality Analysis**
Analyze historical timelog to identify suboptimal workflow choices:
- **FREESTYLE Assessment**: Review all FREESTYLE sessions to determine if structured workflows would have been more effective
- **Structure Overuse**: Identify cases where structured workflows added unnecessary overhead
- **Context Switch Analysis**: Find patterns where workflow changes disrupted productivity
- **Success Pattern Identification**: Document workflow combinations that consistently produce good outcomes

#### **Phase 2: Recommendation Quality Assessment**
Validate recommendation engine accuracy against actual outcomes:
- **Recommendation vs Reality**: Compare engine recommendations to actual workflow choices made
- **Outcome Correlation**: Assess whether recommended workflows led to better or worse outcomes
- **False Positive Detection**: Identify recommendations that led to poor outcomes (exclude from training data)
- **Confidence Calibration**: Adjust confidence levels based on actual success rates
- **Data Quality Filtering**: Mark and exclude poor-quality timelog data from future recommendations

### Advanced Analytics
- **Machine Learning**: Pattern recognition improvement over time
- **Predictive Modeling**: Forecast task completion time by workflow
- **Cross-Session Learning**: Long-term pattern recognition across multiple sessions
- **Data Quality Scoring**: Rate timelog entries for training data reliability

### Automation Integration
- **Auto-trigger**: Suggest workflows based on task description analysis
- **Smart Transitions**: Recommend workflow changes when current approach stalls
- **Outcome Prediction**: Estimate task completion likelihood by workflow choice
- **Bad Data Exclusion**: Automatically filter out low-quality patterns from recommendations

---

*This workflow transforms timelog data from passive recording to active decision support, enabling more intelligent and efficient workflow selection.*