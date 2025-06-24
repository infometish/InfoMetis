# Docs Folder Structure and Thematic Organization

## Overview

The `docs/` folder is organized thematically to separate different types of documentation. This organization is critical for maintenance operations like version reference updates, where some folders contain current platform documentation that needs updating, while others contain architectural examples that should remain unchanged.

## Folder Themes and Update Guidelines

### ✅ Current Platform Documentation (Update Version References)

These folders contain documentation about the **current state** of the SPlectrum platform and should have version references updated to match the current platform version:

#### `docs/guides/`
- **Theme**: Current development processes and workflows
- **Content**: Active development guides, current procedures
- **Version Updates**: YES - references to current platform version
- **Examples**: `current-development-process.md`, development workflows

#### `docs/management/`  
- **Theme**: Current project management and organizational state
- **Content**: Decision logs, versioning strategy, project setup
- **Version Updates**: YES - current project version references
- **Examples**: `decision-log.md`, `versioning-strategy.md`, `github-project-setup.md`

#### `docs/specifications/`
- **Theme**: Current system specifications and technical details
- **Content**: Current audit logging, migration plans, system specs
- **Version Updates**: YES - current system version references
- **Examples**: `audit-log-architecture.md`, `audit-log-migration-plan.md`

#### `docs/workflows/`
- **Theme**: Current workflow definitions and processes
- **Content**: Active workflow strategies, current development approaches
- **Version Updates**: SELECTIVE - current platform references only, not methodology examples
- **Examples**: `phase-based-development-strategy.md` (current platform refs only)

#### `docs/reports/`
- **Theme**: Generated reports for current version
- **Content**: Version-specific analysis, metrics, assessments
- **Version Updates**: YES - should reflect current version consistently
- **Examples**: `v0.6.1-*.md` files

### ❌ Example/Reference Documentation (DO NOT Update)

These folders contain architectural examples, integration scenarios, and external references that should maintain their example version numbers:

#### `docs/architecture/`
- **Theme**: Architectural design patterns and examples
- **Content**: Design strategies, example implementations, architectural concepts
- **Version Updates**: NO - contains example versions like `v1.2.3`, `v2.1.0` for illustration
- **Rationale**: Architectural examples use hypothetical versions to demonstrate concepts
- **Examples**: `container-registry-strategy.md`, `federated-monorepo-design.md`

#### `docs/integration/`
- **Theme**: Integration scenarios and external system examples
- **Content**: Integration patterns, external service examples, communication protocols
- **Version Updates**: NO - contains example versions for integration scenarios
- **Rationale**: Integration examples show how different versions might interact
- **Examples**: `avro-service-definitions-communication.md`, `qubes-splectrum-integration.md`

#### `docs/reference/`
- **Theme**: External tool requirements and reference materials
- **Content**: Prerequisites, external dependencies, reference information
- **Version Updates**: NO - contains external tool versions (Node.js, etc.)
- **Rationale**: External tool versions are independent of platform version
- **Examples**: `prerequisites.md` (Node.js 14.0.0+, etc.)

## Version Reference Update Guidelines

### Automated Version Updates
When running version reference updates (e.g., via `claude/tools/version-readiness-validator.js`):

1. **Include These Folders**:
   - `docs/guides/` - all files
   - `docs/management/` - all files  
   - `docs/specifications/` - all files
   - `docs/reports/` - all files
   - `docs/workflows/` - selective (current platform references only)

2. **Exclude These Folders**:
   - `docs/architecture/` - architectural examples
   - `docs/integration/` - integration scenarios
   - `docs/reference/` - external tool references

### Manual Review Required
- **`docs/workflows/`**: Requires human judgment to distinguish between:
  - Current platform version references (update)
  - Methodology examples with sample versions (keep unchanged)

## Implementation Notes

### Tool Configuration
Version validation and update tools should implement folder-based filtering:

```javascript
const PLATFORM_DOCS_FOLDERS = [
    'docs/guides/',
    'docs/management/', 
    'docs/specifications/',
    'docs/reports/'
];

const EXAMPLE_DOCS_FOLDERS = [
    'docs/architecture/',
    'docs/integration/',
    'docs/reference/'
];
```

### Validation Logic
- **Platform folders**: Flag ALL version inconsistencies
- **Example folders**: Skip version validation entirely
- **Workflow folder**: Special handling for mixed content

## Maintenance Benefits

This thematic organization enables:

1. **Accurate Version Updates**: Only current platform documentation gets updated
2. **Preserved Examples**: Architectural illustrations maintain their example versions
3. **Clear Separation**: Reduces confusion about which versions are current vs. examples
4. **Automated Processing**: Tools can safely process entire folder categories
5. **Consistent Documentation**: Platform state clearly separated from design examples

---

*This document guides version reference maintenance and helps distinguish between current platform documentation that needs updating versus architectural examples that should remain unchanged.*