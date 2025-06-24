# Decision-Making Framework

## Kanban Board Optimization for "What Next" Decisions

### **Primary Information Sources**
1. **GitHub Project**: SPL1 Development Workflow (https://github.com/orgs/SPlectrum/projects/1)
2. **Timelog**: `/logs/timelog.txt` (recent context and momentum)

### **Decision-Making Fields Added to Kanban**

**Session Type** (Single Select):
- `Deep Work` - Requires sustained focus, 2+ hours
- `Quick Win` - Can be completed in 30-60 minutes  
- `Planning` - Analysis, design, documentation review
- `Documentation` - Writing, updating docs, learning capture
- `Research` - Investigation, exploration, understanding codebase

**Context Switch Cost** (Single Select):
- `Low` - Similar to recent work, easy transition
- `Medium` - Different epic/technology but related
- `High` - Major shift in focus or technology stack

**Decision Score** (Number):
- Calculated priority: `(Epic Priority * Version Criticality * Session Fit) / Context Switch Cost`
- Higher numbers = better next action candidates

### **Decision Algorithm**

```javascript
function chooseNextAction(timeAvailable, recentContext, energyLevel) {
  // 1. Filter by session constraints
  availableItems = filterBySessionType(timeAvailable, energyLevel);
  
  // 2. Apply context switching preference
  preferredItems = rankByContextSwitchCost(availableItems, recentContext);
  
  // 3. Apply strategic priority
  rankedItems = sortByDecisionScore(preferredItems);
  
  // 4. Return top recommendation with rationale
  return {
    nextAction: rankedItems[0],
    reasoning: calculateReasoning(rankedItems[0]),
    alternatives: rankedItems.slice(1, 3)
  };
}
```

### **Kanban Columns for Version-Focused View**

**Backlog** - All items for current version (0.6.x)
**Ready** - Planned, unblocked, ready to start
**In Progress** - Currently active (limit: 1-2 items)
**Review** - PRs, testing, feedback needed
**Done** - Completed this version

### **Key Views/Filters**

1. **Current Version Dashboard** (Primary view)
   - Filter: Version = current (0.6.1, 0.6.2, etc.)
   - Group by: Status (columns above)
   - Sort by: Decision Score descending

2. **Epic Overview** 
   - Group by: Epic
   - Shows cross-epic balance

3. **Session Planning**
   - Filter: Status = Ready
   - Group by: Session Type
   - For quick session-type based decisions

### **Usage Pattern**

**Start of Session:**
1. Check timelog for recent context
2. Open kanban "Current Version Dashboard" view
3. Apply decision algorithm based on:
   - Available time
   - Energy level  
   - Recent context from timelog
4. Choose highest-scoring item that fits session constraints

**End of Session:**
1. Update item status in kanban
2. Log session_end in timelog
3. If context switch coming, update relevant Context Switch Cost fields

This framework provides single-tool decision making while preserving the strategic context from timelog momentum.

## ✅ CONFIGURATION COMPLETE

**All Project Fields Configured:**
- ✅ **Session Type**: Planning/Deep Work/Quick Win/Documentation/Research  
- ✅ **Decision Score**: 85 (analysis), 75 (infrastructure), 60 (implementation)
- ✅ **Context Switch Cost**: Low/Medium/High based on work similarity
- ✅ **Epic Field**: RR/SE/CAE/TDD/BARE/NFD/AVRO properly assigned
- ✅ **Version Field**: 0.6.1 (current analysis), 0.6.2+ (future implementation)

**Current 0.6.1 Priority Issues (Score 85):**
1. #10: RR - Repository structure analysis
2. #14: CAE - API consolidation analysis  
3. #16: TDD - Testing approach analysis
4. #21: AVRO - Schema architecture planning
5. #20: AVRO - Integration requirements research

**Infrastructure Complete (Score 75):**
- #9: GitHub Project setup ✅
- #25: Project automation system ✅ 

**Recommendation System Working:**
```bash
node status/project-automation.js recommend
# Returns prioritized list with Epic, Session Type, and Decision Score
```

## 🔄 OPTIMIZED WORKFLOW

### **Backlog → Planning → Execution Separation**

**1. Backlog Creation (Lightweight)**
```bash
gh issue create --title "Epic-Prefix: Feature description" \
  --label "enhancement,EPIC_NAME" \
  --body "Detailed description"
# ❌ NO project assignment
# ❌ NO version assignment  
# ❌ NO field configuration
# ✅ Just capture the idea
```

**2. Planning Session (Selective Import)**
```bash
node status/project-automation.js import --issues 27,28,29 --version 0.6.2
# ✅ Add to project
# ✅ Configure all decision-making fields
# ✅ Assign version and epic
# ✅ Ready for execution
```

**3. Daily Execution (Fast)**
```bash
node status/project-automation.js recommend
# ⚡ Only processes planned work in project
# 🎯 Fast performance 
# 📊 Focused recommendations
```

### **Project Lifecycle Management**

**Issue States:**
- **Backlog**: Issues created but not in project (lightweight)
- **Planned**: Issues imported to project with full configuration
- **Active**: In Progress status in project  
- **Complete**: Done status in project
- **Archived**: Removed from project when version complete

**Version Completion Cleanup:**
- **Remove issues from project** as soon as their assigned version is complete
- **Keeps project focused** on current and next version work only
- **Prevents project bloat** and maintains fast performance
- **Archive pattern**: Backlog → Planning → Execution → Archive

### **Performance Benefits**
- ⚡ **Fast daily recommendations** - only planned work processed
- 🎯 **Focused project view** - current work only, no historical clutter  
- 📊 **Better planning sessions** - explicit import decisions
- 🔄 **Scalable approach** - hundreds of backlog issues won't impact performance

### **Implementation Status**
- ✅ **Core automation working** - field configuration and recommendations
- ✅ **Workflow designed** - backlog separation identified  
- 📋 **Enhancement planned** - import/remove commands (#27)
- 🎯 **Timing**: Implement before next planning session

The project automation system is production-ready with clear optimization path!