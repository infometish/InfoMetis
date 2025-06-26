# GitHub Project Views API Research Findings

## ✅ **Confirmed Project Fields & Values Working**
- All custom fields (Session Type, Decision Score, Context Switch Cost, Epic, Version) ✅
- All field values populated programmatically ✅
- Recommendation system functional ✅

## ❌ **Project Views Creation Limitation**

### **API Research Results:**
1. **ProjectV2View Type Exists**: Has fields like `filter`, `groupByFields`, `sortByFields`, `layout`
2. **No Create View Mutations Found**: Searched entire GraphQL schema - no `createProjectV2View` mutation
3. **No CLI Support**: `gh project` commands don't include view creation

### **Current Hypothesis:**
- **Views are likely web UI only** for now
- **API can read views** but not create them programmatically  
- **Similar to early GitHub Actions** - web UI configuration, API consumption

### **Alternative Approaches:**

#### **Option 1: Single View Optimization**
Use the existing single view with programmatic field configuration:
- ✅ **Sort by Decision Score** (highest priority first)
- ✅ **Filter by Version** (0.6.1 for current work)  
- ✅ **Group by Epic** (see cross-epic balance)
- ✅ **Filter by Session Type** (match available time)

#### **Option 2: Monitor GitHub Roadmap**
- GitHub Projects v2 is evolving rapidly
- View creation API likely planned for future releases
- Continue with current approach, enhance when API available

#### **Option 3: URL-Based View Switching**
- Create bookmark URLs with specific filters/groupings
- Document these in `/status/project-views.md`
- Quick switching between decision-making views

## **Current Recommendation:**

**Proceed with single view approach** - the programmatic field population makes it highly effective for decision-making even without multiple views.

**Advantage**: All the decision-making intelligence is in the field values, not the views. This means:
- Sort by Decision Score = instant priority ranking
- Filter by Version = focus on current work
- Epic field = immediate context identification  
- Session Type = match work to available time

**The single view is now optimally configured for "what should we do next" decisions!**

## **Future Enhancement Path:**
Monitor GitHub's roadmap for Project Views API and implement programmatic view creation when available.