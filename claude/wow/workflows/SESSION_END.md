# SESSION_END Workflow

## ⚠️ MANDATORY SESSION TERMINATION ⚠️

**MANDATORY SESSION TERMINATION**: When any Claude session ends, Claude MUST execute this system check and termination sequence.

**TRIGGER**: End of any Claude session or when user indicates session completion

**MANDATORY SYSTEM CHECK:**
1. **SCAN ALL MANDATORY RULES**: Review CLAUDE.md and workflow files for all rules marked "MANDATORY"
2. **VERIFY SESSION COMPLIANCE**: Ensure all MANDATORY rules were followed during session
3. **EXECUTE REQUIRED WORKFLOWS**: Run any workflows needed to resolve violations
4. **CONFIRM CLEAN HANDOFF**: Ensure repository meets all MANDATORY requirements for session end

**SESSION TERMINATION:**
1. **COMPLETE OUTSTANDING TODOS**: Follow REPO_TODO_WORKFLOW for todo completion and transient todo transfer - See [REPO_TODO_WORKFLOW.md](./REPO_TODO_WORKFLOW.md)
2. **CAPTURE SESSION LEARNINGS**: Document insights in appropriate files
3. **MANDATORY: EXECUTE GIT_WORKFLOW**: MUST handle all git operations with proper branching policy - commit all changes, create PR, merge to main

## SYSTEM CHECK PROCEDURE

**MANDATORY Rule Verification:**
- Search CLAUDE.md for all \"**MANDATORY\" labeled rules
- Search workflow files for MANDATORY requirements  
- Verify session activities complied with each rule
- Execute required workflows to resolve any violations

**Common Compliance Checks:**
- Branch Policy: Repository in clean state for handoff
- Workflow Logging: All session activities properly documented
- Todo Management: All created todos have appropriate status
- Step-by-Step Pattern: Work followed single-step completion rules

## SESSION COMPLETION CHECKLIST

### **1. System Compliance Verification**
- Complete MANDATORY system check procedure above
- Resolve any violations before session termination

### **2. Todo and Learning Management**
- Follow REPO_TODO_WORKFLOW for todo completion and transient todo transfer
- Document session learnings in appropriate docs/ files

### **3. Git Operations and Clean Handoff**
**UPDATED: Optimal audit log workflow to prevent merge conflicts:**

1. **Rename current.log** → `session_TIMESTAMP.log` (don't create fresh yet)
2. **Complete git workflow with renamed log:**
   - Stage all changes: `git add .` (includes properly named archive)
   - Commit with comprehensive session summary
   - Push to remote: `git push origin unplanned`
   - Create PR: `gh pr create` with detailed description
   - Merge PR: `gh pr merge --squash`
   - Switch to main and sync: `git checkout main && git pull origin main`
   - Switch back to unplanned: `git checkout unplanned && git merge main`
   - Push updated unplanned: `git push origin unplanned`
3. **Create fresh current.log** with clean marker as final step: `echo "##APPEND_MARKER_UNIQUE##" > claude/project/audit/current/current.log`
4. **Log SESSION_END completion** in fresh audit log per audit governance

**Note**: This implements the complete OPERATIONAL_RULES "Branch Transition Protocol" ensuring clean session handoff with all changes integrated to main and branches synchronized.

**Why this sequence prevents merge conflicts**: By renaming (not rotating) the audit log before git operations and creating the fresh log only after all git work completes, we avoid divergent audit log states between branches that cause merge conflicts.

## SESSION OUTCOME DOCUMENTATION

### **High-Value Sessions**
For sessions with significant outcomes, consider creating brief session summary:
- Major architectural decisions made
- Key documents created or updated
- Issues created with strategic importance
- Learnings that impact future development approach

### **Learning Capture Categories**
- **Technical Learnings**: Architecture, implementation patterns, tool usage
- **Process Learnings**: Workflow improvements, efficiency gains
- **Strategic Learnings**: Long-term vision insights, planning approaches
- **Tool Learnings**: Better ways to use development tools or AI capabilities
- **Knowledge Gaps**: Prerequisites or concepts new team members would need
- **Onboarding Insights**: What understanding is required before working on specific components

## INCOMPLETE WORKFLOW DETECTION

### **Session Start Workflow Check**
At the start of each session, Claude MUST:
1. Read the timelog to check the last entry
2. If last entry is `SESSION_END | session_end:` with no subsequent activities, previous session ended cleanly
3. If last entry shows incomplete SESSION_END (session_end logged but activities after), complete the missing steps:
   - Check TodoRead for incomplete todos from previous session
   - Follow REPO_TODO_WORKFLOW for todo completion and transfer procedures
   - Capture any obvious learnings from previous session's work
   - Stage and commit any uncommitted changes with session summary

### **Recovery Actions**
When detecting incomplete SESSION_END:
```
Previous session had incomplete SESSION_END workflow. Completing missing steps:
- [List specific recovery actions taken]
- Session continuity restored
```

## INTEGRATION WITH OTHER WORKFLOWS

### **Connection to SESSION_START**
- SESSION_END complements SESSION_START for complete session boundaries
- Time tracking bookends enable session duration analysis
- Learning capture builds on work accomplished since session start

### **Connection to PLANNED_VS_UNPLANNED**
- Review session work classification accuracy
- Document effectiveness of planning decisions
- Note any unplanned work that should have been planned

### **Connection to GIT_WORKFLOW**
- SESSION_END uses GIT_WORKFLOW patterns for git operations
- Implements the MANDATORY 13-step sequence to prevent sync issues
- Includes post-PR synchronization that eliminates branch drift problems
- Maintains separation of concerns: session management vs detailed git implementation

### **Connection to GITHUB_WORKFLOW**
- Ensure any issues created during session are properly configured
- Check that issues have appropriate labels, milestones, and epic assignments
- Verify any PRs created have proper context and documentation

## SUCCESS METRICS

### **Session Effectiveness Indicators**
- Clear accomplishments documented in timelog
- Learning insights captured for future reference
- Outstanding work properly tracked in todos or issues
- Session boundaries clearly marked for analysis

### **Quality Indicators**
- All timelog entries properly formatted
- No orphaned todos or incomplete task tracking
- Relevant documentation updated with session insights
- Clear handoff state for future sessions

## ARCHIVAL CONSIDERATIONS

### **Long-term Session Data**
- Session patterns help identify productive workflows
- Learning accumulation guides platform evolution
- Time distribution analysis improves planning accuracy
- Session outcome tracking validates development approaches

### **Release Preparation**
- Before version releases, review accumulated session learnings
- Incorporate insights into release documentation
- Archive significant session outcomes with version history
- Use session data to improve development processes

---

*This workflow ensures systematic session termination that preserves knowledge, maintains data integrity, and enables continuous improvement of development processes.*