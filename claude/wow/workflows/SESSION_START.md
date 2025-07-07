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
- Check timelog for complete SESSION_END workflow
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