# SESSION_START Workflow

## ⚠️ MANDATORY SESSION INITIALIZATION ⚠️

**MANDATORY SESSION INITIALIZATION**: When any new Claude session begins, Claude MUST execute this system check and initialization sequence.

**TRIGGER**: Any new Claude session initiation

**MANDATORY SYSTEM CHECK:**
1. **SCAN ALL MANDATORY RULES**: Review CLAUDE.md and workflow files for all rules marked "MANDATORY"
2. **VERIFY COMPLIANCE**: Check current repository state against each MANDATORY rule
3. **EXECUTE REQUIRED WORKFLOWS**: Run any workflows needed to achieve compliance
4. **CONFIRM CLEAN STATE**: Ensure all MANDATORY requirements satisfied before proceeding

**SESSION INITIALIZATION:**
1. **PREVIOUS SESSION RECOVERY**: Complete any incomplete SESSION_END workflows detected
2. **PRESENT TODO LIST**: Show complete repository todo list and ask for user selection
3. **SESSION OUTCOME DOCUMENTATION**: Present session summary if previous session had high-value outcomes

## SYSTEM CHECK PROCEDURE

**MANDATORY Rule Scanning:**
- Search CLAUDE.md for all \"**MANDATORY\" labeled rules
- Search workflow files for MANDATORY requirements
- Verify current state compliance with each rule
- Execute workflows automatically to resolve any violations

**Common MANDATORY Rules:**
- Branch Policy: Clean repository state or completed PR cycle
- Workflow Logging: Proper timelog format and accountability
- File Path Specification: All references must specify exact paths
- Step-by-Step Execution: Single-step completion with choice points

## SESSION RECOVERY

**Previous Session Verification:**
- Check current audit log for complete SESSION_END workflow
- Complete any incomplete workflows from previous session
- Resolve any outstanding compliance violations

## UNCOMMITTED WORK CHECK

**MANDATORY Uncommitted Work Assessment:**
1. **Check Git Status**: Run `git status` to identify any uncommitted changes
2. **Evaluate Significance**: Determine if changes represent meaningful work
3. **Apply Insignificant Changes Rule**: Changes are insignificant if current audit log contains no work entries for this session
4. **Handle Appropriately**: Commit meaningful work or discard insignificant changes

**Insignificant Changes Criteria:**
- No work-related audit log entries in current session
- Only minor formatting, whitespace, or documentation updates
- No functional code changes or feature additions
- No bug fixes or configuration changes

**Insignificant Changes Actions:**
- May be discarded without commit
- Should be handled via `git checkout .` or `git reset --hard`
- No SESSION_END workflow required for insignificant changes

**Significant Changes Actions:**
- MUST be committed following proper workflow
- Requires SESSION_END workflow if switching contexts
- Should follow branch management rules from CLAUDE.md

## INCOMPLETE WORKFLOW DETECTION

### **Previous Session Check**
At the start of each session, Claude MUST:
1. Read the current audit log to check the last entry
2. If last entry is `SESSION_END | workflow_complete:` with no subsequent activities, previous session ended cleanly
3. If last entry shows incomplete SESSION_END (workflow_start logged but no workflow_complete), complete the missing steps:
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

### **Connection to SESSION_END**
- SESSION_START complements SESSION_END for complete session boundaries
- Time tracking bookends enable session duration analysis
- Learning capture builds on work accomplished since session start

### **Connection to PLANNED_VS_UNPLANNED**
- Initialize session with clear planned vs unplanned work classification
- Set expectations for session scope and outcomes
- Align session goals with project planning framework

### **Connection to GIT_WORKFLOW**
- SESSION_START uses GIT_WORKFLOW patterns for git operations
- Implements the MANDATORY 13-step sequence to prevent sync issues
- Includes branch synchronization that eliminates drift problems
- Maintains separation of concerns: session management vs detailed git implementation

### **Connection to GITHUB_WORKFLOW**
- Verify any issues assigned for session work are properly configured
- Check that current milestone and epic assignments are accurate
- Prepare GitHub integration for session activities

## SUCCESS METRICS

### **Session Initialization Indicators**
- Clear session goals established from todo list
- Previous session recovery completed successfully
- Repository state verified as clean and compliant
- Session boundaries clearly marked for analysis

### **Quality Indicators**
- All audit log entries properly formatted
- No orphaned todos or incomplete task tracking from previous session
- Relevant documentation reflects current state
- Clear starting point established for session work

## ARCHIVAL CONSIDERATIONS

### **Session Continuity**
- Session patterns help identify productive initialization workflows
- Learning accumulation guides session preparation
- Time distribution analysis improves session planning
- Session outcome tracking validates preparation approaches

### **Development Process Improvement**
- Before version releases, review accumulated session initialization data
- Incorporate insights into development workflow documentation
- Archive significant session preparation outcomes with version history
- Use session data to improve development processes

---

*This workflow ensures systematic session initialization that preserves knowledge, maintains data integrity, and enables continuous improvement of development processes.*