# VERSION_PLANNING Sub-Workflow

**Note:** This is a sub-workflow called by the main VERSION workflow router. Renamed from NEW_VERSION_PLANNING for consistency.

## ⚠️ MANDATORY NEW VERSION PLANNING ⚠️

**MANDATORY NEW VERSION PLANNING**: After VERSION_TRANSITION workflow completion, Claude MUST execute this systematic planning workflow to establish scope, priorities, and work organization for the next version.

**Trigger**: Called via VERSION workflow router

**Input**: Clean knowledge base and repository from VERSION_TRANSITION
**Output**: Fully planned and organized next version with defined scope and work breakdown

## MANDATORY PLANNING SEQUENCE:

### 1. Project Management Setup
- **Archive Previous Project**: Close the previous version's GitHub Project
- **Create New Project**: Establish new GitHub Project for next version
  - Pattern: `spl1 v{version}` (e.g., "spl1 v0.6.3")
  - Configure project boards and automation rules
  - Set up appropriate project views (by status, assignee, milestone)
- **Project Integration**: Link project to repository and configure settings

### 2. Epic Selection and Prioritization
- **Review Available Epics**: Analyze all epics from issue backlog
  - SE (Setup/External) epics - installation, deployment, external integrations
  - CAE (Core API Enhancement) epics - core functionality improvements
  - IDE (Integration/Development Environment) epics - development tooling
  - Other domain-specific epics as identified
- **Select Version Epics**: Choose which epics are in scope for this version
  - Consider version type (major/minor/patch)
  - Assess epic dependencies and logical groupings
  - Balance scope against available development capacity
- **Prioritize Epic Execution**: Establish order of epic development
  - Dependencies between epics
  - Risk factors and complexity considerations
  - Strategic value and user impact

### 3. Milestone Creation and Assignment
- **Create Epic-Phase Milestones**: Establish milestones for selected epics
  - Pattern: `[EPIC]-[VERSION]: [EPIC_NAME] - Phase [N]`
  - Examples:
    - `SE-1: External Install - Phase 1`
    - `CAE-1: Core API - Phase 1`
    - `IDE-1: Development Environment - Phase 1`
- **Milestone Scope Definition**: Define what constitutes completion for each milestone
- **Milestone Sequencing**: Establish logical order and dependencies between milestones
- **Timeline Estimation**: Provide rough timeline estimates for milestone completion

### 4. Planned Work Assessment and Gap Analysis
- **Review Existing Planned Work**: Analyze issues currently without milestones
  - Identify issues that align with selected epics
  - Assess if existing planned work covers version scope adequately
- **Gap Identification**: Determine missing work items needed for version
  - Missing components or features required for epic completion
  - Supporting infrastructure or tooling needs
  - Documentation and testing requirements
- **Work Scope Adjustment**: Balance planned work against version capacity
  - Move excess work back to backlog if over-scoped
  - Add critical missing work items to planned scope

### 5. Issue Decomposition and Effort Sizing
- **Parent Issue Analysis**: Review complex issues needing breakdown
  - Identify issues that are too large for single implementation cycles
  - Assess issues requiring multiple knowledge domains or components
- **Child Issue Creation**: Break down parent issues into implementable tasks
  - Each child issue should be completable in single work session
  - Clear acceptance criteria and scope definition
  - Proper parent-child linking for traceability
- **Effort Assessment**: Evaluate development effort through granular breakdown
  - Identify high-complexity areas requiring additional planning
  - Balance work distribution across different knowledge domains
  - Ensure realistic scope for version timeline

## Project Management Integration

### GitHub Project Configuration
```
Project Structure:
- Status: Backlog, Ready, In Progress, In Review, Done
- Epic: [Epic tags for filtering]
- Milestone: [Phase milestones]
- Assignee: [Team member assignments]
```

### Milestone Management Strategy
- **Phase-Based Development**: Break epics into manageable phases
- **Cross-Epic Coordination**: Ensure milestones support dependencies between epics
- **Progress Tracking**: Configure milestone progress indicators and completion metrics

### Issue Organization Patterns
- **Epic Hierarchy**: Parent epics → Child implementation issues
- **Milestone Assignment**: All implementation issues assigned to specific milestones
- **Label Management**: Consistent labeling for work type, complexity, and domain

## Work Breakdown Methodology

### Issue Decomposition Criteria
1. **Single Session Completable**: Each child issue finishable in one development session
2. **Clear Acceptance Criteria**: Unambiguous definition of "done"
3. **Minimal Dependencies**: Reduce inter-issue dependencies where possible
4. **Domain Focused**: Each issue primarily within single knowledge domain

### Effort Sizing Approach
- **Complexity Assessment**: Technical complexity and knowledge domain breadth
- **Dependency Analysis**: External dependencies and coordination requirements
- **Risk Evaluation**: Technical risks and unknown factors
- **Resource Requirements**: Specialized knowledge or tools needed

### Scope Validation
- **Version Capacity**: Realistic assessment of development capacity for version timeline
- **Epic Balance**: Ensure no single epic dominates version scope disproportionately
- **Quality Standards**: Include testing, documentation, and review requirements in scope

## Strategic Planning Integration

### Version Type Considerations
- **Major Version**: Multiple epics, significant architectural changes, longer timeline
- **Minor Version**: 1-2 epics, feature additions, moderate timeline
- **Patch Version**: Single epic or critical fixes, minimal timeline

### Epic Coordination Strategy
- **Sequential Epics**: Epics that must be completed in specific order
- **Parallel Epics**: Epics that can be developed simultaneously
- **Supporting Epics**: Infrastructure epics that enable other epic development

### Risk Management Planning
- **Technical Risks**: Identify high-risk areas requiring additional planning or research
- **Dependency Risks**: External dependencies that could impact version timeline
- **Scope Risks**: Areas where scope might expand during development

## Success Criteria

### Project Organization
- [ ] Previous version project archived and closed
- [ ] New version project created with appropriate configuration
- [ ] Project boards configured for effective work tracking
- [ ] Team access and permissions properly configured

### Epic and Milestone Definition
- [ ] Version epics selected based on strategic priorities and capacity
- [ ] Epic execution order defined with clear rationale
- [ ] All milestones created with clear scope and completion criteria
- [ ] Milestone dependencies and sequencing established

### Work Planning Completeness
- [ ] All planned work aligned with version epics and milestones
- [ ] Gap analysis completed and missing work items identified
- [ ] Work scope balanced against realistic development capacity
- [ ] Issue decomposition completed for complex parent issues

### Development Readiness
- [ ] All implementation issues have clear acceptance criteria
- [ ] Work items appropriately sized for single-session completion
- [ ] Dependencies between issues minimized and documented
- [ ] Version scope validated against timeline and resource constraints

## Integration with Version Lifecycle

### Pre-Planning Dependencies
- Requires completed VERSION_TRANSITION workflow
- Clean repository and knowledge base
- Updated documentation and onboarding materials

### Post-Planning Outcomes
- Ready-to-execute version scope with organized work breakdown
- Configured project management infrastructure
- Clear development priorities and sequencing

### Development Phase Preparation
- Development can begin immediately with clear work priorities
- Project tracking provides visibility into version progress
- Issue breakdown supports systematic development approach

## Automation Opportunities

### Project Setup Automation
- Automated project creation with standard configuration
- Template-based milestone creation for common epic patterns
- Automated issue migration from previous version planning

### Work Analysis Automation
- Automated gap analysis comparing planned work to epic requirements
- Issue complexity analysis based on content and labels
- Scope validation against historical development velocity

### Planning Validation
- Automated dependency analysis between issues and milestones
- Timeline feasibility analysis based on work breakdown
- Epic balance validation ensuring appropriate scope distribution

## Future Evolution

### Enhanced Planning Analytics
- Historical epic completion time analysis for better estimation
- Work breakdown pattern analysis for improved decomposition
- Cross-version learning integration for planning improvement

### Collaborative Planning Tools
- Stakeholder input integration for epic prioritization
- Team capacity planning and work assignment optimization
- Risk assessment integration with planning decisions

---

*This workflow ensures systematic and comprehensive planning for each new version, establishing clear scope, organized work breakdown, and effective project management infrastructure for successful version development.*