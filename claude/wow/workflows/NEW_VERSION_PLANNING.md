# VERSION_PLANNING Sub-Workflow

**Note:** This is a sub-workflow called by the main VERSION workflow router. Renamed from NEW_VERSION_PLANNING for consistency.

## ⚠️ MANDATORY NEW VERSION PLANNING ⚠️

**MANDATORY NEW VERSION PLANNING**: After VERSION_TRANSITION workflow completion, Claude MUST execute this systematic planning workflow to establish scope, priorities, and work organization for the next version.

**Trigger**: Called via VERSION workflow router

**Input**: Clean knowledge base and repository from VERSION_TRANSITION
**Output**: Organized next version with epic scope, milestones, and labeled issues for development

## MANDATORY PLANNING SEQUENCE:

### 1. Version Planning Setup
- **Project Information Retrieval**: Use project hook to get current project context
  - Query `claude/project/version-config.md` for TARGET_VERSION
  - Extract project name and version strategy from project configuration
  - Validate project readiness for new version planning
- **Epic Abbreviation Review**: Verify project epic definitions and abbreviations
  - Review project epic registry (e.g., `claude/project/KEYWORD_REGISTRY.md`)
  - Ensure epic abbreviations are defined (up to 4 characters)
  - Confirm epic labels exist in repository (create if missing)

### 2. Epic Selection and Prioritization
- **Review Available Epics**: Analyze all epics from issue backlog based on project-specific epic definitions
  - Review current issue distribution across epics
  - Assess epic maturity and readiness for development
  - Consider project-specific epic priorities and dependencies
- **Select Version Epics**: Choose which epics are in scope for this version
  - Consider version type (major/minor/patch)
  - Assess epic dependencies and logical groupings
  - Balance scope against available development capacity
- **Prioritize Epic Execution**: Establish order of epic development
  - Dependencies between epics
  - Risk factors and complexity considerations
  - Strategic value and user impact

### 3. Version Milestone Creation
- **Create Version Milestone**: Establish single milestone for target version
  - Pattern: `v{TARGET_VERSION}` (e.g., `v1.1.0`)
  - Use version from project hook query in Step 1
  - Description: Brief version scope summary with epic areas included
- **Issue Assignment**: Assign all selected version issues to version milestone
- **Epic Organization**: Use epic prefixes in issue titles for clear categorization
  - Pattern: `[EPIC_ABBREV] Issue Title`
  - Examples: `[TMPL] Clean up template structure`, `[DEPL] Create deployment scripts`

### 4. Version Labeling and Organization
- **Create Version Label**: Establish version label for filtering and tracking
  - Pattern: `v{TARGET_VERSION}` (matches milestone name)
  - Description: Version scope description from project hook
  - Apply to all issues planned for the version
- **Epic Label Verification**: Ensure epic labels are applied appropriately
  - Maintain epic labels for cross-version epic tracking
  - Use for filtering epic work across multiple versions
- **Issue Organization**: Structure issues for efficient development workflow
  - Version filtering: `gh issue list --milestone "v1.1.0"`
  - Epic filtering: `gh issue list --label "TMPL"`
  - Combined filtering: `gh issue list --milestone "v1.1.0" --label "TMPL"`

### 5. Work Scope Validation and Refinement
- **Version Scope Assessment**: Validate planned work against version capacity
  - Review selected issues for realistic completion timeline
  - Identify any issues requiring decomposition into smaller tasks
  - Assess dependencies between selected issues
- **Gap Analysis**: Determine if additional work items are needed
  - Missing components or features required for version completion
  - Supporting infrastructure, testing, or documentation needs
  - Integration points between epic areas
- **Scope Adjustment**: Finalize version scope based on analysis
  - Move excess work back to backlog if over-scoped
  - Add critical missing work items to version scope
  - Document any deferred work for future versions

## Simplified Organization Strategy

### Milestone-as-Version Approach
- **Single Version Milestone**: One milestone per version (e.g., `v1.1.0`)
  - Contains all issues planned for that version across all epics
  - Provides clear version scope and progress tracking
  - Aligns with release planning and version completion

### Epic Information in Titles
- **Epic Prefixes**: Use `[EPIC_ABBREV]` format in issue titles
  - Examples: `[TMPL] Template cleanup`, `[DEPL] Deployment scripts`
  - Provides immediate epic identification without complex label hierarchies
  - Maintains epic context while simplifying organization

### Label Strategy
- **Epic Labels**: Maintain for cross-version epic tracking and filtering
- **Version Labels**: Match milestone names for dual filtering capability
- **Minimal Overhead**: Focus on essential categorization only

### Filtering Patterns
- **Version Work**: `gh issue list --milestone "v1.1.0"`
- **Epic Work**: `gh issue list --label "TMPL"`
- **Version + Epic**: `gh issue list --milestone "v1.1.0" --label "TMPL"`
- **Dependencies**: Track in issue descriptions and comments

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

### Version Planning Setup
- [ ] Project information retrieved via project hook (`claude/project/version-config.md`)
- [ ] Target version number extracted and validated
- [ ] Epic abbreviations verified and labels confirmed

### Version Organization
- [ ] Version epics selected based on strategic priorities and capacity
- [ ] Single version milestone created with target version number
- [ ] Epic execution order defined with clear rationale
- [ ] All selected issues assigned to version milestone

### Work Planning Completeness
- [ ] All planned work aligned with selected version epics
- [ ] Gap analysis completed and missing work items identified
- [ ] Work scope balanced against realistic development capacity
- [ ] Issue titles updated with epic prefixes for clear categorization

### Development Readiness
- [ ] All implementation issues have clear acceptance criteria
- [ ] Work items appropriately sized for single-session completion
- [ ] Dependencies between issues documented in descriptions/comments
- [ ] Version scope validated against timeline and resource constraints
- [ ] Version label created and applied to all planned issues
- [ ] Filtering commands tested and documented for development workflow

## Integration with Version Lifecycle

### Pre-Planning Dependencies
- Requires completed VERSION_TRANSITION workflow
- Clean repository and knowledge base
- Updated documentation and onboarding materials
- Project hook available for version information queries

### Post-Planning Outcomes
- Ready-to-execute version scope with organized work breakdown
- Label-based issue organization for efficient filtering
- Clear development priorities and sequencing
- Version tracking through labels and milestones

### Development Phase Preparation
- Development can begin immediately with clear work priorities
- Label filtering provides visibility into version progress
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