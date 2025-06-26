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