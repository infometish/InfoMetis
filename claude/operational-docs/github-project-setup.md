# GitHub Project Setup Documentation

## Overview

This document describes the complete setup of the "SPL1 Development Workflow" GitHub Project, enabling visual workflow management with explicit epic and version tracking for the seven-epic phase-based development strategy.

## Project Details

**Project Information:**
- **Name**: SPL1 Development Workflow
- **Type**: GitHub Projects v2 (Organization-level)
- **Owner**: SPlectrum Organization
- **URL**: https://github.com/orgs/SPlectrum/projects/1
- **Project ID**: `PVT_kwDODBTINM4A7jPM`
- **Repository Link**: Linked to SPlectrum/spl1

## Authentication Requirements

**Required GitHub CLI Scopes:**
- `project` - Create and manage projects
- `read:project` - Read project data
- `repo` - Repository access
- `read:org` - Organization access

**Setup Commands:**
```bash
# Logout and re-authenticate with proper scopes
gh auth logout
gh auth login
# Or refresh existing authentication
gh auth refresh -h github.com -s project,read:project
```

## Project Creation Steps

### 1. Create Organization Project
```bash
gh project create --title "SPL1 Development Workflow" --owner "SPlectrum"
```

### 2. Import All Repository Issues
```bash
# Get all issues
gh issue list --limit 100 --json number,url

# Add each issue to project
gh project item-add 1 --owner "SPlectrum" --url https://github.com/SPlectrum/spl1/issues/{number}
```

### 3. Link Project to Repository
- Navigate to repository → Projects tab
- Link the organization project to the repository via web interface

## Custom Fields Configuration

### Epic Field (Single Select Dropdown)
**Field ID**: `PVTSSF_lADODBTINM4A7jPMzgv0L3A`

```bash
gh api graphql -f query='
mutation {
  createProjectV2Field(input: {
    projectId: "PVT_kwDODBTINM4A7jPM"
    dataType: SINGLE_SELECT
    name: "Epic"
    singleSelectOptions: [
      {name: "RR", color: RED, description: "Repository Restructure"}
      {name: "SE", color: BLUE, description: "SPlectrum Engines"} 
      {name: "CAE", color: GREEN, description: "Core API Enhancement"}
      {name: "TDD", color: PURPLE, description: "TDD Implementation"}
      {name: "BARE", color: PINK, description: "Migration to Bare"}
      {name: "NFD", color: ORANGE, description: "New Functionality Development"}
      {name: "AVRO", color: YELLOW, description: "AVRO Integration"}
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField {
        id
        name
      }
    }
  }
}'
```

### Phase Field (Text)
**Field ID**: `PVTF_lADODBTINM4A7jPMzgv0L3s`

```bash
gh api graphql -f query='
mutation {
  createProjectV2Field(input: {
    projectId: "PVT_kwDODBTINM4A7jPM"
    dataType: TEXT
    name: "Phase"
  }) {
    projectV2Field {
      ... on ProjectV2Field {
        id
        name
      }
    }
  }
}'
```

### Version Field (Text)
**Field ID**: `PVTF_lADODBTINM4A7jPMzgv0L7U`

```bash
gh api graphql -f query='
mutation {
  createProjectV2Field(input: {
    projectId: "PVT_kwDODBTINM4A7jPM"
    dataType: TEXT
    name: "Version"
  }) {
    projectV2Field {
      ... on ProjectV2Field {
        id
        name
      }
    }
  }
}'
```

### Priority Field (Single Select Dropdown)
**Field ID**: `PVTSSF_lADODBTINM4A7jPMzgv0L8A`

```bash
gh api graphql -f query='
mutation {
  createProjectV2Field(input: {
    projectId: "PVT_kwDODBTINM4A7jPM"
    dataType: SINGLE_SELECT
    name: "Priority"
    singleSelectOptions: [
      {name: "High", color: RED, description: "Urgent work"}
      {name: "Medium", color: YELLOW, description: "Normal priority"}
      {name: "Low", color: GREEN, description: "Nice to have"}
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField {
        id
        name
      }
    }
  }
}'
```

## Epic Structure

**Seven-Epic Framework:**
- **RR**: Repository Restructure (federated monorepo design)
- **SE**: SPlectrum Engines (external install workflows)  
- **CAE**: Core API Enhancement (unified streaming APIs)
- **TDD**: TDD Implementation (comprehensive test-driven workflow)
- **BARE**: Migration to Bare (minimal dependency architecture)
- **NFD**: New Functionality Development (cross-epic supporting tools)
- **AVRO**: AVRO Integration (schema-based data architecture)

## Workflow Benefits

### Before: Milestone-Implied Epic Linking
- Issues linked to epics via milestone names (e.g., "RR-1: Repository Restructure - Phase 1")
- Limited cross-phase epic visibility
- Planning coupled with issue creation

### After: Explicit Epic Linking
- **Create issues** → No milestone required initially
- **Triage in Project** → Assign Epic, Phase, Version, Priority via custom fields
- **Plan dynamically** → Filter by Epic, group by Version, prioritize visually
- **Epic-level visibility** → All epic work visible regardless of phase
- **Version planning** → Group phases from different epics into versions

## Project Views Recommendations

**Suggested Views to Create:**
1. **Backlog View**: Unassigned issues awaiting triage
2. **Epic Views**: Group by Epic field for epic-level planning
3. **Version Views**: Group by Version field for release planning
4. **Sprint View**: Current development milestone
5. **Priority View**: Group by Priority for urgency management

## Maintenance Commands

### Add New Issues to Project
```bash
gh project item-add 1 --owner "SPlectrum" --url https://github.com/SPlectrum/spl1/issues/{number}
```

### List Project Items
```bash
gh project item-list 1 --owner "SPlectrum"
```

### View Project Details
```bash
gh project view 1 --owner "SPlectrum" --format json
```

## Integration with Development Workflow

### Issue Creation Workflow
1. Create issue with basic title/description (no milestone required)
2. Issue automatically appears in Project backlog
3. Triage in Project: assign Epic, Phase, Priority, Version
4. When ready for development: assign milestone based on Epic+Phase

### Epic-Level Planning
- Filter by Epic field to see all work for specific epic
- Use Phase field to track progression within epic
- Use Version field to group phases across epics for releases

### Version Planning
- Group related phases from different epics using Version field
- Example: "Version 0.6.1" might include RR-1, CAE-1, TDD-1 phases

## Key Learnings & Best Practices

### Organization vs User-Level Projects
**Learning**: Organization-level projects provide much better integration than user-level projects for team repositories.
- ❌ **User projects**: Don't integrate well with organization repositories
- ✅ **Organization projects**: Natural integration with repository workflows
- **Best Practice**: Always create projects under the organization that owns the repository

### Explicit vs Implicit Epic Linking
**Learning**: Custom fields for epics are more flexible than milestone-implied epic linking.
- **Benefits**: Dynamic planning, cross-phase epic visibility, flexible issue triage
- **Workflow**: Decouples issue creation from planning, making project the central planning hub
- **Impact**: Enables "create first, plan later" workflow vs "must plan during creation"

### GitHub CLI vs GraphQL API
**Learning**: GitHub CLI doesn't support all Projects v2 features; GraphQL API required for advanced configuration.
- **CLI Limitations**: Cannot create custom fields, limited project management
- **GraphQL Required**: Custom field creation, advanced automation setup
- **Technical Notes**: Use predefined colors (RED, BLUE, etc.) not hex codes; correct union selection syntax

## Troubleshooting

### Authentication Issues
- Ensure `project` scope is granted: `gh auth status`
- Refresh authentication: `gh auth refresh -h github.com -s project,read:project`
- **Required Scopes**: `project`, `read:project`, `repo`, `read:org`

### Custom Field Creation Issues
- Use predefined colors (RED, BLUE, GREEN, etc.) not hex codes
- Use correct GraphQL selection syntax for field types
- Verify project ID is correct: `gh project view 1 --owner "SPlectrum" --format json`

### Issue Import Issues
- Verify repository access: `gh issue list`
- Check organization permissions for project access
- Ensure project is linked to repository via web interface

## Related Documentation

- [Phase-Based Development Strategy](./phase-based-development-strategy.md)
- [Federated Monorepo Design](./federated-monorepo-design.md)
- [CLAUDE.md Operational Rules](../CLAUDE.md)

---

**Last Updated**: 2025-06-15T16:23:52Z  
**Issue Reference**: #9 - Setup GitHub Project for Visual Workflow Management