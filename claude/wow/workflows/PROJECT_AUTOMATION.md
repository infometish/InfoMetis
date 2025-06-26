# PROJECT_AUTOMATION

## Overview
Automated GitHub Projects v2 management using GraphQL API for decision-making field population and next-action recommendations.

## Automation Script
**Location**: `status/project-automation.js`
**Purpose**: Programmatic project management without manual overhead

## Core Commands

### Recommendation System
```bash
# Get next action recommendations based on decision scores
node status/project-automation.js recommend
```
**Output**: Top 5 prioritized tasks with epic, session type, and decision scores

### Field Configuration
```bash
# Configure all project fields automatically  
node status/project-automation.js configure
```
**Purpose**: Bulk populate decision-making fields (Epic, Session Type, Decision Score, Context Switch Cost)

### Project Information
```bash
# View project structure and field configuration
node status/project-automation.js info
```
**Purpose**: Inspect project fields and current state

## Decision Algorithm

### Priority Scoring
- **Analysis/Planning (0.6.1)**: Score 85 (high priority)
- **Infrastructure/Tools**: Score 75 (enables other work)
- **Implementation (0.6.2+)**: Score 60 (future focus)

### Session Types
- **Planning**: Requirements analysis, architecture design
- **Deep Work**: Implementation, complex problem solving
- **Quick Win**: Small tasks, bug fixes

### Context Switch Cost
- **Low**: Similar work to current context
- **Medium**: Different epic or work type
- **High**: Complete context change

## Integration Workflows

### Daily Planning
1. **Get Recommendations**: `node status/project-automation.js recommend`
2. **Select Task**: Choose from top-ranked planning items (Score 85)
3. **Focus**: Work on highest-priority current version (0.6.1) items

### Version Planning  
1. **Import Issues**: Add selected backlog items to project
2. **Configure Fields**: Run `configure` command for automated setup
3. **Planning Focus**: Complete all 0.6.1 analysis before 0.6.2 implementation

### Epic Coordination
- **Cross-Epic Balance**: Visualize work distribution across RR, SE, CAE, TDD, BARE, NFD, AVRO
- **Dependency Tracking**: Identify blocking relationships between epics
- **Strategic Alignment**: Ensure container strategy (SE) supports other epics

## Usage Patterns

### Start of Session
```bash
# Check current recommendations
node status/project-automation.js recommend
```

### Planning Baseline Completion
- Focus on Version 0.6.1 items (all Score 85)
- Complete analysis tasks before implementation
- Maintain epic diversity for strategic coverage

### Version Transition
- Complete current version planning
- Import next version items to project
- Reconfigure fields for new priorities

## Integration with CLAUDE.md

### Trigger Usage
```markdown
**PROJECT_AUTOMATION** → See [workflows/PROJECT_AUTOMATION.md](./workflows/PROJECT_AUTOMATION.md)
```

### Session Integration
- **SESSION_START**: Check recommendations for session planning
- **GITHUB_WORKFLOW**: Use for issue lifecycle and project management
- **Recommendation-Based**: Let automation guide next action selection

## Benefits
- **Eliminates Manual Project Management**: Automated field population
- **Data-Driven Decisions**: Score-based prioritization
- **Strategic Focus**: Version-based planning alignment
- **Cross-Epic Coordination**: Visual workflow management
- **Context-Aware**: Session type and switch cost optimization