# PLANNED_VS_UNPLANNED Work Classification

## Work Types

### Planned Work
- **Definition**: Issues that have been created and imported to GitHub Project
- **Lifecycle**: Backlog → Staged → Planned → Active → Complete → Archived
- **Tracking**: GitHub issues with epic labels, milestones, project fields
- **Context**: `#123 description` format in timelog
- **Purpose**: Major features, structured development, milestone tracking

### Unplanned Work  
- **Definition**: Work done without creating GitHub issues
- **Tracking**: Only in timelog with descriptive context
- **Context**: Direct description (e.g., "CLAUDE.md restructure discussion")
- **Purpose**: Quick fixes, discussions, optimizations, reactive work
- **Benefits**: No staging/planning overhead, immediate action

## Why This Approach Works

### Avoids Planning Overhead
- Creating issues requires staging and planning steps
- Unplanned work allows immediate action on small items
- Reduces bureaucratic drag for quick improvements

### Maintains Visibility
- Timelog captures ALL work (planned and unplanned)
- Version-specific timelog archives preserve complete history
- Can retrospectively analyze unplanned work patterns

### Enables Flexible Reporting
- Commit messages can reference timelog context
- Post-version analysis shows planned vs unplanned time distribution
- Learning capture can identify recurring unplanned work themes

## Usage Guidelines

### Create Issues For:
- Multi-step features requiring coordination
- Work spanning multiple sessions
- Epic-related development
- Bug fixes requiring TDD workflow
- Work requiring stakeholder communication

### Skip Issues For:
- Quick discussions and decisions
- Documentation updates
- Small optimizations
- Reactive fixes
- Workflow refinements
- Session-contained improvements

## Reporting From Timelog

### Commit Message Context
```bash
# Use timelog context for unplanned work commits
git commit -m "feat: CLAUDE.md restructure with modular workflow triggers

- Implemented uppercase keyword trigger system
- Created workflow registry for maintainability  
- Added timelog archive automation
- Updated README.md with new workflow references

Context from timelog: CLAUDE.md restructure discussion, 
modular workflow trigger system, timelog archive automation"
```

### Version Analysis
```bash
# After version archive, analyze work distribution
node scripts/analyze_timelog.js v0.6.2
# Shows: 60% planned work (#issues), 40% unplanned work (descriptions)
```

## Benefits

1. **Agility**: Immediate action on small items without overhead
2. **Completeness**: Full work tracking via timelog regardless of planning
3. **Flexibility**: Can promote unplanned themes to planned work later  
4. **Efficiency**: Right-sized process for different work types
5. **Analysis**: Version-specific archives enable retrospective insights