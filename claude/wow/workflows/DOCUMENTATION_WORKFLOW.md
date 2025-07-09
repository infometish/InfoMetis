[← Back to Claude-Swift Home](../../README.md)

# DOCUMENTATION_WORKFLOW

## ⚠️ MANDATORY DOCUMENTATION MANAGEMENT ⚠️

**MANDATORY DOCUMENTATION WORKFLOW**: All documentation creation, modification, and maintenance MUST follow this standardized workflow to ensure WoW compliance and consistency.

**TRIGGER**: `docs sesame` or when any documentation operations are needed

**SCOPE**: All `.md` files in repository (excluding root CLAUDE.md and README.md)

## Documentation Procedures

**Note**: All documentation governance rules (file location, back links, naming conventions) are defined in OPERATIONAL_RULES.md. This workflow focuses on procedural implementation of those standards.

### File Creation Procedures
**Implementation of OPERATIONAL_RULES documentation standards:**
- Create files in appropriate `docs/` subdirectories per governance rules
- Add required back links per governance format requirements
- Follow naming conventions defined in governance rules

### Back Link Implementation
**Automated back link formatting:**
- Apply governance-required back link format to all new documentation
- Calculate correct path depth based on file location
- Ensure compliance with governance spacing requirements

### File Naming Implementation
**Procedural implementation of governance naming rules:**
- Apply lowercase-with-hyphens pattern per governance standards
- Ensure descriptive names following governance requirements
- Implement governance-required hyphen word separation
- **Version neutral**: Avoid version numbers in filenames

### 4. Content Structure Rules
**MANDATORY STRUCTURE**:
```markdown
[← Back to Claude-Swift Home](../../README.md)

# Document Title

## Overview/Introduction
[Required first section after title]

[Document content...]

---

*Optional footer notes*
```

## DOCUMENTATION LIFECYCLE WORKFLOW

### Creating New Documentation

1. **Location Verification**
   ```bash
   # Verify target directory exists
   ls docs/[target-directory]/
   ```

2. **File Creation with Template**
   - Start with back link at top
   - Add appropriate title
   - Include overview section
   - Follow content structure rules

3. **Content Development**
   - Write clear, actionable content
   - Include file path references where relevant
   - Follow existing documentation style
   - **Tone**: Not too celebratory, to the point, not beyond necessary

4. **Compliance Validation**
   - Verify file location in `docs/` hierarchy
   - Confirm back link at top with correct path
   - Check naming conventions
   - Validate content structure

5. **Reference Integration**
   - Add to README.md documentation index
   - Update any workflow files that reference it
   - Cross-reference with related documents

### Modifying Existing Documentation

1. **Pre-Edit Compliance Check**
   - Verify current compliance status
   - Note any existing violations

2. **Content Modification**
   - Make required changes
   - Maintain existing structure and format
   - Preserve back links and references

3. **Post-Edit Validation**
   - Ensure compliance maintained
   - Verify all references still valid
   - Check back link functionality

### Removing Superseded Documentation

**MANDATORY DOCUMENTATION LIFECYCLE RULE**: Documentation that has been superseded by completed development MUST be removed to prevent confusion and documentation debt.

1. **Superseded Content Identification**
   - Preliminary/draft documentation replaced by final implementation
   - Experimental approaches abandoned during development  
   - Architecture proposals superseded by actual implementation
   - Process documentation replaced by refined workflows

2. **Preliminary Content Lifecycle**
   - **Development Phase**: `docs/preliminary/` folder acceptable for drafts and experiments
   - **Content Graduation**: Valuable preliminary content moves to permanent folders
   - **Production Transition**: `docs/preliminary/` folder removed entirely when project stabilizes
   - **Template Deployment**: Clean documentation structure without preliminary content

3. **Preservation Rule**
   - **Historical information**: Preserved ONLY in reports (release notes, development insights)
   - **Working documentation**: Removed when superseded
   - **Decision records**: Kept if they document WHY decisions were made
   - **Learning artifacts**: Captured in knowledge base, originals removed

## Release Documentation Rules

### MANDATORY Release Documentation Scope
**docs/reports/ directory is reserved for major and minor version releases only:**

- **Major Releases** (X.0.0): Comprehensive reports, strategic analysis, development insights
- **Minor Releases** (X.Y.0): Feature reports, milestone analysis, enhancement documentation  
- **Patch Releases** (X.Y.Z): Release notes ONLY in template/ directory, NO docs/reports/ content

### Patch Release Documentation Policy
**Patch releases follow streamlined documentation:**
- **Release notes**: Created in `template/PROJECT-NAME-vX.Y.Z-RELEASE-NOTES.md`
- **Template deployment**: Release notes included in template for deployment packages
- **No formal reports**: Patch releases do not generate docs/reports/ documentation
- **Audit tracking**: Changes tracked in audit logs and version control only

### Version Documentation Matrix
| Release Type | docs/reports/ | template/ | Audit Logs |
|--------------|---------------|-----------|------------|
| Major (X.0.0) | ✅ Comprehensive | ✅ Release notes | ✅ Full archive |
| Minor (X.Y.0) | ✅ Feature reports | ✅ Release notes | ✅ Full archive |
| Patch (X.Y.Z) | ❌ No reports | ✅ Release notes only | ✅ Current tracking |

**Purpose**: Prevents documentation bloat while ensuring appropriate historical preservation for significant releases.

3. **Removal Process**
   ```bash
   # Remove superseded files
   rm docs/preliminary/superseded-file.md
   
   # Update all references
   grep -r "superseded-file.md" docs/ --include="*.md"
   ```

4. **Reference Cleanup**
   - Remove references from README.md documentation index
   - Update any workflow files that referenced removed content
   - Update cross-references in other documents

### Moving/Relocating Documentation

1. **Impact Analysis**
   - Identify all references to file
   - Map new path requirements
   - Plan reference updates

2. **File Relocation**
   ```bash
   mv docs/old-location/file.md docs/new-location/file.md
   ```

3. **Back Link Updates**
   - Recalculate relative path to README.md
   - Update back link with new path

4. **Reference Updates**
   - Update README.md documentation index
   - Update all workflow references
   - Update cross-references in other docs

5. **Validation**
   - Test all updated links
   - Verify compliance with new location

## COMPLIANCE CHECKING

### Automated Compliance Checks
```bash
# Find files outside docs/ (excluding CLAUDE.md, README.md)
find . -name "*.md" -not -path "./docs/*" -not -name "CLAUDE.md" -not -name "README.md"

# Check for missing back links
grep -L "Back to Claude-Swift Home" docs/**/*.md

# Verify back link positioning (should be line 1)
for file in docs/**/*.md; do
  if [ "$(head -1 "$file" | grep -c 'Back to Claude-Swift Home')" -eq 0 ]; then
    echo "Missing top back link: $file"
  fi
done
```

### Manual Compliance Verification
- [ ] All documentation in `docs/` hierarchy
- [ ] Back links at top of all files
- [ ] Correct relative paths for back links
- [ ] Consistent naming conventions
- [ ] Proper content structure
- [ ] README.md index updated

## INTEGRATION WITH OTHER WORKFLOWS

### SESSION_START Integration
- **Documentation compliance check**: Verify documentation structure
- **Report violations**: Alert to any non-compliant files
- **Provide correction guidance**: Suggest fixes for violations

### SESSION_END Integration
- **Documentation review**: Check if new docs created during session
- **Compliance validation**: Ensure all new/modified docs are compliant
- **Index updates**: Verify README.md reflects documentation changes

### Built-in TODO_MANAGEMENT Integration
- **Documentation todos**: Track documentation-related tasks
- **Compliance todos**: Track compliance fixes needed
- **Clear separation**: Documentation tasks vs implementation tasks

## DOCUMENTATION TYPES AND STANDARDS

### Deployment Guides (`docs/deployment/`)
**Purpose**: Step-by-step operational procedures
**Standards**: 
- Include prerequisites
- Provide example commands
- Document rollback procedures
- Include validation steps

### Architecture Documents (`docs/preliminary/` or `docs/architecture/`)
**Purpose**: System design and architectural decisions
**Standards**:
- Include diagrams where helpful
- Document decision rationale
- Cross-reference related documents
- Keep version-neutral

### Process Documents (`docs/processes/`)
**Purpose**: Development and operational processes
**Standards**:
- Step-by-step procedures
- Clear role definitions
- Integration points documented
- Success criteria defined

### API Documentation (`docs/api/`)
**Purpose**: Interface and integration documentation
**Standards**:
- Complete parameter documentation
- Usage examples
- Error condition handling
- Version compatibility notes

## ERROR HANDLING AND CORRECTION

### Common Violations and Fixes

**File Outside docs/ Directory**:
1. Move file to appropriate `docs/` subdirectory
2. Update back link relative path
3. Update all references in README.md and workflows
4. Test all links

**Missing Back Link**:
1. Add back link as first line of file
2. Calculate correct relative path
3. Add blank line after back link

**Back Link at Bottom**:
1. Move back link to first line
2. Remove from bottom
3. Ensure proper spacing

**Broken References**:
1. Identify all broken links
2. Update with correct paths
3. Verify functionality
4. Update documentation index

## AUTOMATION OPPORTUNITIES

### Future Enhancements
- **Pre-commit hooks**: Automatic compliance checking
- **Link validation**: Automated reference verification
- **Index generation**: Auto-update README.md documentation section
- **Template creation**: Automated new document scaffolding

## SUCCESS METRICS

### Quality Indicators
- **100% docs/ compliance**: All documentation in proper directory
- **100% back link compliance**: All files have correct top back links
- **Zero broken references**: All documentation links functional
- **Consistent structure**: All documents follow standard format

### Maintenance Indicators
- **Up-to-date index**: README.md reflects all documentation
- **Cross-reference accuracy**: Related documents properly linked
- **Naming consistency**: All files follow naming conventions
- **Content freshness**: Documentation matches current implementation

## WORKFLOW EXECUTION STEPS

### New Document Creation
1. Determine appropriate `docs/` subdirectory
2. Create file with proper back link and structure
3. Write content following type-specific standards
4. Add to README.md documentation index
5. Validate compliance and test links

### Document Maintenance
1. Identify documents needing updates
2. Make content changes while preserving structure
3. Update modification dates if relevant
4. Verify all references remain valid
5. Update cross-references as needed

### Compliance Remediation
1. Run automated compliance checks
2. Identify all violations systematically
3. Fix violations following standard procedures
4. Validate fixes with compliance re-check
5. Update processes to prevent recurrence

---

*This workflow ensures consistent, navigable, and maintainable documentation across the entire claude-swift template system.*