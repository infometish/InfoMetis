# Documentation Organization Strategy

## Core Principles

### **Concise Overview Approach**
- **Keep docs short and focused** - overview-level information only
- **Leverage Claude for details** - docs point to "Ask Claude about..." for deeper exploration
- **High-level visibility** - show what's important/expected, not exhaustive detail
- **Maintainable content** - less text to keep current and accurate

### **Progressive Entry Points**
- **Multiple learning paths** based on experience level
- **Clear prerequisites** - honest about what we assume you know
- **Practical focus** - get people productive quickly

## Proposed Directory Structure

### **`docs/getting-started/`** - Entry Points & Learning Paths
**Purpose**: Concise guides for different experience levels
- `expected-knowledge.md` - One-page checklist of assumptions
- `platform-overview.md` - High-level SPlectrum concepts (key points only)
- `first-steps.md` - Essential commands to get running
- `development-setup.md` - Minimal environment setup
- `beginner-path.md` - If missing prerequisites (bullet points)
- `standard-path.md` - Typical developer journey (outline only)
- `expert-path.md` - Architecture-focused quickstart (highlights)
- `common-workflows.md` - Daily tasks (commands & patterns)
- `when-stuck.md` - "Ask Claude about..." prompts

### **`docs/guides/`** - Development Guides
**Purpose**: Practical how-to documentation
- `how-to.md`
- `creating-new-apps.md`
- `implementing-new-api.md`
- `app-development.md`
- `release-and-install-process.md`
- `current-development-process.md`

### **`docs/architecture/`** - System Design
**Purpose**: Core platform architecture and design decisions
- `project-overview.md`
- `federated-monorepo-design.md`
- `container-unified-entity-strategy.md`
- `spl-data-layer.md`
- `schema-and-repo-notes.md`
- `container-registry-strategy.md`
- `se1-container-engine-architecture.md`

### **`docs/api/`** - API References
**Purpose**: Technical API documentation
- `execute-api-properties.md`
- `package-api-properties.md`
- `7zip-command-line-api.md`
- `spl-package-api-analysis.md`
- `api-status.md`

### **`docs/workflows/`** - Development Processes
**Purpose**: How we develop and work together
- `branching-strategy.md`
- `phase-based-development-strategy.md`
- `phase-based-implementation-guide.md`
- `tdd-workflow-architecture.md`
- `testing-frameworks.md`
- `operational-tdd-framework.md`
- `backlog-to-completion-workflow.md`
- `code-quality-patterns.md`

### **`docs/integration/`** - External Systems
**Purpose**: Integration with external tools and systems
- `avro-service-definitions-communication.md`
- `avro-schema-architecture.md`
- `avro-queue-folder-service-design.md`
- `bare-minimal-dependency-architecture.md`
- `qubes-os-overview.md`
- `qubes-splectrum-integration.md`
- `prince2-integration-approach.md`
- `itil-integration-approach.md`

### **`docs/management/`** - Project Management
**Purpose**: Planning, tracking, and project organization
- `spl1-epics-overview.md`
- `github-project-setup.md`
- `versioning-strategy.md`
- `decision-log.md`
- `lessons-learned.md`

### **`docs/specifications/`** - Technical Specifications
**Purpose**: Detailed technical specifications and standards
- `se-1-git-workflow-enforcement-spec.md`
- `audit-log-architecture.md`
- `audit-log-migration-plan.md`
- `claude-directory-specification.md`
- `subdirectory-claude-md-plan.md`

### **`docs/knowledge/`** - Institutional Knowledge & Insights
**Purpose**: Accumulated insights and institutional knowledge explaining the "why" behind decisions
- `platform-concepts.md` - Essential SPlectrum concepts explained simply
- `design-rationale.md` - Why we made key architectural choices
- `common-patterns.md` - Recurring development patterns we've discovered
- `lessons-learned.md` - What we've learned from experience (move from current location)
- `troubleshooting-guide.md` - Common issues and their solutions
- `terminology.md` - SPlectrum-specific terms and definitions
- `historical-context.md` - How we got here, evolution of decisions
- `technology-choices.md` - Why we chose specific technologies/approaches
- `development-tips.md` - Practical development insights
- `performance-insights.md` - What we've learned about performance
- `integration-gotchas.md` - Common integration pitfalls and solutions

### **`docs/reference/`** - Quick References
**Purpose**: Quick lookup information and utilities
- `prerequisites.md`
- `quick-reference.md`
- `node-dependency-audit.md`
- `test-app-development.md`
- `boot-app-functionality.md`

## Documentation Content Strategy

### **Overview-Level Content**
- **Key concepts only** - not exhaustive explanations
- **Essential commands** - core functionality, not every option
- **Important patterns** - highlight what matters most
- **Clear assumptions** - explicit about prerequisite knowledge

### **Claude Integration Points**
Each document should include:
- **"Ask Claude about..."** sections for deeper exploration
- **Specific prompts** for getting detailed help
- **References to CLAUDE.md workflows** for operational guidance

### **Knowledge Base Integration**
- **Getting Started** references knowledge base for deeper context
- **Knowledge base** captures "why" and accumulated wisdom
- **Cross-references** between getting-started and knowledge for learning progression

### **Example Document Structure**
```markdown
# Document Title

## Overview
Brief description of what this covers (2-3 sentences)

## Key Concepts
- Bullet point list of essential ideas
- Keep to 5-7 main points maximum

## Essential Commands/Patterns
```bash
# Core commands only
./spl_execute basic-example
```

## Next Steps
- Link to related docs
- **Ask Claude about**: "detailed configuration options for..."
- **Ask Claude about**: "troubleshooting when..."

## See Also
- Related documentation links
```

### **Migration Approach**
1. **Create subfolder structure** first
2. **Move files to appropriate subfolders** 
3. **Update README.md links** to reflect new structure
4. **Gradually refactor content** to overview-level approach
5. **Add Claude integration points** as content is reviewed

### **Benefits**
- **Faster onboarding** - people find what they need quickly
- **Lower maintenance** - less detailed content to keep current
- **Better discoverability** - clear organization and entry points  
- **Leverages AI** - Claude provides the deep detail on demand
- **Practical focus** - gets people productive rather than comprehensive

This strategy prioritizes **actionable overview** over **comprehensive reference**, making documentation more useful and maintainable while leveraging Claude for detailed guidance.