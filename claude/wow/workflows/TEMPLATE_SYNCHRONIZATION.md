[← Back to Claude-Swift Home](../../../README.md)

# TEMPLATE_SYNCHRONIZATION Sub-Workflow

## Overview

Shared template synchronization workflow for claude-swift. Used by multiple workflows that need to keep template/ folder synchronized with main repository state.

**Used By**: 
- VERSION_TRANSITION (Step 3: Repository Maintenance)
- RELEASE_PROCESS (Publish workflow)
- Any workflow requiring template synchronization

## Synchronization Recipe

### 1. Archive Current Template State
```bash
# Create archive of current template
mkdir -p template/archive
mv template/* template/archive/ 2>/dev/null || echo "Archive created"
```

**Purpose**: Preserve current template state for comparison and rollback if needed.

### 2. Blind Copy Current Repository State  
```bash
# Copy current claude/ directory and CLAUDE.md to template
cp -r claude/ template/
cp CLAUDE.md template/
```

**Purpose**: Synchronize template with latest repository state using simple, reliable blind copy.

### 3. Reset Project-Specific Files to Generic Template Format
```bash
# Compare template/claude/project/ against template/archive/claude/project/
# Reset project-specific configuration files to template placeholders
```

**Files to Reset**:
- `template/claude/project/version-config.md` → Generic template placeholders
- `template/claude/project/project-info.md` → Generic template placeholders
- `template/claude/project/audit/current/current.log` → Empty state with marker only

**Reset Pattern**:
- Replace project-specific values with `[placeholder]` format
- Remove completed project-specific content
- Preserve template structure and workflow framework

### 4. Remove Project-Specific Files Not Needed in Template
```bash
# Remove claude-swift specific files that shouldn't be in template
rm -f template/claude/project/docs/v*.md  # Version-specific reports
rm -rf template/claude/project/audit/v*/  # Version audit archives
rm -f template/claude/project/workflows/PROJECT_*  # Project-specific workflows (keep hook pattern docs)
```

**Cleanup Scope**:
- Version-specific documentation and reports
- Historical audit archives
- Project-specific workflow implementations
- Any claude-swift contamination

### 5. Template Validation
```bash
# Validate template structure and content
# - Check for remaining claude-swift specific content
# - Verify template placeholder format
# - Confirm workflow framework completeness
```

**Quality Gates**:
- No claude-swift specific content remains
- All placeholders properly formatted
- Complete workflow framework preserved
- Template ready for deployment

## Integration Points

### As Sub-Workflow
This can be called from other workflows:

```bash
# Call template synchronization
echo "YYYY-MM-DDTHH:MM:SSZ|PARENT_WORKFLOW|step|template_sync_start||Starting template synchronization sub-workflow" >> claude/project/audit/current/current.log

# Execute TEMPLATE_SYNCHRONIZATION steps 1-5

echo "YYYY-MM-DDTHH:MM:SSZ|PARENT_WORKFLOW|step|template_sync_complete||Template synchronization sub-workflow complete" >> claude/project/audit/current/current.log
```

### As Project Hook
Individual projects can implement `PROJECT_*` hooks that call this shared workflow:

```bash
# In PROJECT_VERSION_TRANSITION.md or PROJECT_RELEASE_PROCESS.md
# Call shared TEMPLATE_SYNCHRONIZATION workflow
# Add any project-specific template customizations
```

## Recipe Benefits

### **Simplicity**
- **Blind copy approach** eliminates complex file comparison logic
- **Archive-first strategy** provides safety net and reference point
- **Systematic steps** are easy to understand and maintain

### **Reliability** 
- **No missed files** - complete directory copy ensures nothing is overlooked
- **Atomic operation** - each step is complete before proceeding
- **Rollback capability** - archive enables recovery if needed

### **Maintainability**
- **Clear separation** between sync mechanics and project-specific customization
- **Reusable pattern** across multiple workflows
- **Documented process** enables consistent execution

### **Template Quality**
- **Complete synchronization** ensures template reflects current repository state
- **Generic reset** maintains template deployability
- **Validation steps** ensure template purity and quality

## Workflow Logging

```bash
# Standard logging pattern for template synchronization
TIMESTAMP|PARENT_WORKFLOW|step|template_archive||Created template archive in template/archive/
TIMESTAMP|PARENT_WORKFLOW|step|template_copy||Copied claude/ and CLAUDE.md to template/ 
TIMESTAMP|PARENT_WORKFLOW|step|template_reset||Reset project files to generic template format
TIMESTAMP|PARENT_WORKFLOW|step|template_cleanup||Removed project-specific files from template
TIMESTAMP|PARENT_WORKFLOW|step|template_validation||Validated template structure and content
```

## Success Criteria

- [ ] Current template state archived in `template/archive/`
- [ ] Repository state copied to `template/` (claude/ + CLAUDE.md)
- [ ] Project configuration files reset to generic template format
- [ ] Project-specific files removed from template
- [ ] Template validated for purity and deployability
- [ ] Template ready for deployment to new projects

---

*Shared Sub-Workflow - Template synchronization recipe for claude-swift*