#!/usr/bin/env node

/**
 * Get Started Documentation Generator
 * VERSION_TRANSITION Step 6: Create onboarding-focused documentation from actual development experience
 */

const fs = require('fs');
const path = require('path');

class GetStartedGenerator {
    constructor() {
        this.analysisData = null;
        this.getStartedContent = {
            prerequisites: [],
            essentialWorkflows: [],
            quickstartSteps: [],
            commonPitfalls: [],
            toolsUsed: []
        };
    }

    async generateGetStartedDocs(strategicReportPath, metricsReportPath) {
        console.log('🚀 Starting get started documentation generation...\n');
        
        // Load analysis data
        await this.loadAnalysisData(strategicReportPath, metricsReportPath);
        
        // Extract onboarding insights
        this.extractPrerequisites();
        this.extractEssentialWorkflows();
        this.extractQuickstartSteps();
        this.extractCommonPitfalls();
        this.extractToolsUsed();
        
        // Generate documentation
        const getStartedDoc = this.generateGetStartedDocumentation();
        
        console.log('✅ Get started documentation complete!\n');
        return getStartedDoc;
    }

    async loadAnalysisData(strategicReportPath, metricsReportPath) {
        console.log('📊 Loading analysis data for onboarding insights...');
        
        try {
            const data = { workflows: [], domains: [], tools: [], sessions: [] };
            
            if (fs.existsSync(strategicReportPath)) {
                const strategicContent = fs.readFileSync(strategicReportPath, 'utf8');
                
                // Extract workflow data
                const workflowSection = strategicContent.match(/## Workflow Effectiveness Analysis([\s\S]*?)##/);
                if (workflowSection) {
                    const tableRows = workflowSection[1].match(/\| ([^|]+) \| (\d+) \| ([^|]+) \| (\d+) \| (\d+) \|/g);
                    if (tableRows) {
                        tableRows.forEach(row => {
                            const match = row.match(/\| ([^|]+) \| (\d+) \| ([^|]+) \| (\d+) \| (\d+) \|/);
                            if (match) {
                                data.workflows.push({
                                    name: match[1].trim(),
                                    instances: parseInt(match[2]),
                                    completionRate: match[3].trim(),
                                    contexts: parseInt(match[4]),
                                    files: parseInt(match[5])
                                });
                            }
                        });
                    }
                }
                
                // Extract domain data for prerequisites
                const domainSection = strategicContent.match(/## Knowledge Domain Analysis([\s\S]*?)##/);
                if (domainSection) {
                    const tableRows = domainSection[1].match(/\| ([^|]+) \| (\d+) \| (\d+) \| (\d+) \|/g);
                    if (tableRows) {
                        tableRows.forEach(row => {
                            const match = row.match(/\| ([^|]+) \| (\d+) \| (\d+) \| (\d+) \|/);
                            if (match) {
                                data.domains.push({
                                    domain: match[1].trim(),
                                    engagement: parseInt(match[2]),
                                    workflows: parseInt(match[3]),
                                    files: parseInt(match[4])
                                });
                            }
                        });
                    }
                }
                
                console.log('   ✅ Strategic analysis loaded for onboarding');
            }
            
            this.analysisData = data;
        } catch (error) {
            console.warn(`   ⚠️ Error loading analysis data: ${error.message}`);
        }
        console.log('');
    }

    extractPrerequisites() {
        console.log('📋 Extracting actual prerequisites from development data...');
        
        // Based on knowledge domains and tools actually used
        if (this.analysisData && this.analysisData.domains.length > 0) {
            const coreDomains = this.analysisData.domains
                .filter(domain => domain.engagement > 10) // High engagement domains
                .sort((a, b) => b.engagement - a.engagement);
                
            coreDomains.forEach(domain => {
                this.getStartedContent.prerequisites.push({
                    category: 'knowledge_domain',
                    requirement: domain.domain,
                    importance: domain.engagement > 20 ? 'essential' : 'important',
                    evidence: `Used in ${domain.workflows} workflows, ${domain.engagement} instances`,
                    description: this.getDomainDescription(domain.domain)
                });
            });
        }
        
        // Add essential tools based on actual usage
        this.getStartedContent.prerequisites.push({
            category: 'tool',
            requirement: 'Node.js v14+',
            importance: 'essential',
            evidence: 'Core runtime for all development activities',
            description: 'JavaScript runtime required for all SPlectrum operations'
        });
        
        this.getStartedContent.prerequisites.push({
            category: 'tool',
            requirement: 'Git',
            importance: 'essential',
            evidence: 'Version control and workflow management',
            description: 'Version control system used for all development workflows'
        });
        
        this.getStartedContent.prerequisites.push({
            category: 'tool',
            requirement: 'GitHub CLI (gh)',
            importance: 'important',
            evidence: 'Project automation and issue management',
            description: 'Command-line tool for GitHub integration and project management'
        });
        
        console.log(`   Identified ${this.getStartedContent.prerequisites.length} prerequisites`);
        console.log('');
    }

    getDomainDescription(domain) {
        const descriptions = {
            'session_management': 'Understanding development session workflows and audit logging',
            'issue_management': 'GitHub issue creation, tracking, and lifecycle management',
            'workflow_architecture': 'Systematic workflow design and execution patterns',
            'documentation_strategy': 'Documentation organization and maintenance approaches',
            'project_management': 'Project planning, epic management, and milestone tracking',
            'git_operations': 'Git workflows, branching strategies, and version control',
            'version_management': 'Version planning, transition workflows, and release processes'
        };
        return descriptions[domain] || `Knowledge area: ${domain}`;
    }

    extractEssentialWorkflows() {
        console.log('⚙️ Extracting essential workflows from usage patterns...');
        
        if (this.analysisData && this.analysisData.workflows.length > 0) {
            // Get most frequently used workflows
            const essentialWorkflows = this.analysisData.workflows
                .filter(workflow => workflow.instances >= 5) // Frequently used
                .sort((a, b) => b.instances - a.instances)
                .slice(0, 8); // Top 8 most essential
                
            essentialWorkflows.forEach(workflow => {
                this.getStartedContent.essentialWorkflows.push({
                    workflow: workflow.name,
                    frequency: workflow.instances,
                    importance: workflow.instances > 20 ? 'critical' : workflow.instances > 10 ? 'important' : 'useful',
                    description: this.getWorkflowDescription(workflow.name),
                    usage_pattern: `Used ${workflow.instances} times across development`
                });
            });
        } else {
            // Fallback essential workflows
            this.getStartedContent.essentialWorkflows.push({
                workflow: 'SESSION_START',
                frequency: 'high',
                importance: 'critical',
                description: 'Initialize development sessions with proper audit logging',
                usage_pattern: 'Required at beginning of each development session'
            });
        }
        
        console.log(`   Identified ${this.getStartedContent.essentialWorkflows.length} essential workflows`);
        console.log('');
    }

    getWorkflowDescription(workflowName) {
        const descriptions = {
            'SESSION_START': 'Initialize development sessions with proper audit logging and branch verification',
            'SESSION_END': 'Properly close development sessions with summary and cleanup',
            'DEVELOPMENT': 'Execute development tasks with systematic tracking and documentation',
            'GITHUB_WORKFLOW': 'Manage GitHub issues, PRs, and project automation',
            'ISSUE_CREATION': 'Create properly structured GitHub issues with templates and automation',
            'DOCUMENTATION': 'Create and maintain project documentation with consistency',
            'NEXT_ISSUE': 'Select and transition to next development work item',
            'VERSION_TRANSITION': 'Systematic version transition with knowledge management'
        };
        return descriptions[workflowName] || `Workflow: ${workflowName}`;
    }

    extractQuickstartSteps() {
        console.log('⚡ Creating quickstart steps based on successful patterns...');
        
        this.getStartedContent.quickstartSteps = [
            {
                step: 1,
                title: 'Environment Setup',
                action: 'Install prerequisites and clone repository',
                details: 'Ensure Node.js v14+, Git, and GitHub CLI are installed',
                success_criteria: 'Can run `node --version`, `git --version`, `gh --version`'
            },
            {
                step: 2,
                title: 'Repository Initialization',
                action: 'Navigate to spl1 directory and verify structure',
                details: 'Familiarize yourself with docs/, claude/, and modules/ organization',
                success_criteria: 'Can locate CLAUDE.md and understand folder structure'
            },
            {
                step: 3,
                title: 'First Session',
                action: 'Execute SESSION_START workflow',
                details: 'Use `start sesame` command to initialize development session',
                success_criteria: 'Audit logging starts and branch is verified'
            },
            {
                step: 4,
                title: 'Explore Workflows',
                action: 'Review available workflows in CLAUDE.md',
                details: 'Understand sesame commands and workflow trigger system',
                success_criteria: 'Can execute basic workflows like `next sesame`'
            },
            {
                step: 5,
                title: 'First Contribution',
                action: 'Start with documentation or simple development task',
                details: 'Use GitHub project automation to select appropriate first issue',
                success_criteria: 'Successfully complete a small development task'
            }
        ];
        
        console.log(`   Created ${this.getStartedContent.quickstartSteps.length} quickstart steps`);
        console.log('');
    }

    extractCommonPitfalls() {
        console.log('⚠️ Documenting common pitfalls from development experience...');
        
        // Based on lessons learned during development
        this.getStartedContent.commonPitfalls = [
            {
                pitfall: 'Incorrect audit log paths',
                problem: 'Using old `audit/` path instead of `claude/audit/`',
                solution: 'Always use `claude/audit/current/current.log` for current logging',
                prevention: 'Check CLAUDE.md for current audit architecture'
            },
            {
                pitfall: 'Version reference confusion',
                problem: 'Updating architectural examples when fixing version references',
                solution: 'Only update current platform docs in docs/guides/ and docs/specifications/',
                prevention: 'Understand thematic folder organization before version updates'
            },
            {
                pitfall: 'Session file management',
                problem: 'Thinking session files in current/ need archival',
                solution: 'Session files in current/ are normal operational state',
                prevention: 'Understand that archival happens during close_version workflow'
            },
            {
                pitfall: 'Workflow execution order',
                problem: 'Not following systematic step-by-step workflow completion',
                solution: 'Complete each workflow step fully before proceeding to next',
                prevention: 'Use todo list tracking and single-step completion pattern'
            }
        ];
        
        console.log(`   Documented ${this.getStartedContent.commonPitfalls.length} common pitfalls`);
        console.log('');
    }

    extractToolsUsed() {
        console.log('🔧 Cataloging tools used during development...');
        
        this.getStartedContent.toolsUsed = [
            {
                tool: 'Node.js',
                purpose: 'Core runtime and script execution',
                usage: 'Required for all development tools and automation',
                installation: 'System package manager or NodeSource'
            },
            {
                tool: 'Git',
                purpose: 'Version control and branch management',
                usage: 'All development workflows and version tracking',
                installation: 'System package manager'
            },
            {
                tool: 'GitHub CLI (gh)',
                purpose: 'Issue management and project automation',
                usage: 'Creating issues, managing PRs, project board automation',
                installation: 'GitHub CLI installer or package manager'
            },
            {
                tool: 'ripgrep (rg)',
                purpose: 'Fast code searching and analysis',
                usage: 'Preferred over grep for codebase analysis',
                installation: 'System package manager or cargo install'
            },
            {
                tool: 'Claude Code tools',
                purpose: 'Version transition automation and analysis',
                usage: 'Strategic analysis, repository maintenance, knowledge management',
                installation: 'Included in claude/tools/ directory'
            }
        ];
        
        console.log(`   Cataloged ${this.getStartedContent.toolsUsed.length} development tools`);
        console.log('');
    }

    generateGetStartedDocumentation() {
        const timestamp = new Date().toISOString();
        const version = this.detectVersion();
        
        let doc = `# Get Started with SPlectrum Development - ${version}\n\n`;
        doc += `**Generated**: ${timestamp}\n`;
        doc += `**Scope**: VERSION_TRANSITION Step 6 - Onboarding Documentation from Actual Development Experience\n\n`;
        
        doc += `## Quick Start Overview\n\n`;
        doc += `This guide provides practical onboarding for SPlectrum development based on actual development experience during version ${version}. It focuses on what you actually need to know to contribute effectively.\n\n`;
        
        // Prerequisites
        doc += `## Prerequisites\n\n`;
        doc += `Based on actual development requirements:\n\n`;
        
        const essentialPrereqs = this.getStartedContent.prerequisites.filter(p => p.importance === 'essential');
        const importantPrereqs = this.getStartedContent.prerequisites.filter(p => p.importance === 'important');
        
        if (essentialPrereqs.length > 0) {
            doc += `### Essential Requirements\n`;
            essentialPrereqs.forEach(prereq => {
                doc += `- **${prereq.requirement}**: ${prereq.description}\n`;
                doc += `  - *Evidence*: ${prereq.evidence}\n`;
            });
            doc += `\n`;
        }
        
        if (importantPrereqs.length > 0) {
            doc += `### Important Requirements\n`;
            importantPrereqs.forEach(prereq => {
                doc += `- **${prereq.requirement}**: ${prereq.description}\n`;
                doc += `  - *Evidence*: ${prereq.evidence}\n`;
            });
            doc += `\n`;
        }
        
        // Quickstart Steps
        doc += `## Quickstart Guide\n\n`;
        doc += `Follow these steps for fastest path to productive contribution:\n\n`;
        
        this.getStartedContent.quickstartSteps.forEach(step => {
            doc += `### Step ${step.step}: ${step.title}\n`;
            doc += `**Action**: ${step.action}\n`;
            doc += `**Details**: ${step.details}\n`;
            doc += `**Success Criteria**: ${step.success_criteria}\n\n`;
        });
        
        // Essential Workflows
        doc += `## Essential Workflows\n\n`;
        doc += `These workflows are most frequently used and critical for effective development:\n\n`;
        
        const criticalWorkflows = this.getStartedContent.essentialWorkflows.filter(w => w.importance === 'critical');
        const importantWorkflows = this.getStartedContent.essentialWorkflows.filter(w => w.importance === 'important');
        
        if (criticalWorkflows.length > 0) {
            doc += `### Critical Workflows (Must Know)\n`;
            criticalWorkflows.forEach(workflow => {
                doc += `- **${workflow.workflow}**: ${workflow.description}\n`;
                doc += `  - *Usage*: ${workflow.usage_pattern}\n`;
            });
            doc += `\n`;
        }
        
        if (importantWorkflows.length > 0) {
            doc += `### Important Workflows (Should Know)\n`;
            importantWorkflows.forEach(workflow => {
                doc += `- **${workflow.workflow}**: ${workflow.description}\n`;
                doc += `  - *Usage*: ${workflow.usage_pattern}\n`;
            });
            doc += `\n`;
        }
        
        // Tools
        doc += `## Development Tools\n\n`;
        doc += `Tools you'll actually use during development:\n\n`;
        
        this.getStartedContent.toolsUsed.forEach(tool => {
            doc += `### ${tool.tool}\n`;
            doc += `**Purpose**: ${tool.purpose}\n`;
            doc += `**Usage**: ${tool.usage}\n`;
            doc += `**Installation**: ${tool.installation}\n\n`;
        });
        
        // Common Pitfalls
        doc += `## Common Pitfalls & Solutions\n\n`;
        doc += `Learn from actual development challenges encountered:\n\n`;
        
        this.getStartedContent.commonPitfalls.forEach(pitfall => {
            doc += `### ${pitfall.pitfall}\n`;
            doc += `**Problem**: ${pitfall.problem}\n`;
            doc += `**Solution**: ${pitfall.solution}\n`;
            doc += `**Prevention**: ${pitfall.prevention}\n\n`;
        });
        
        // Next Steps
        doc += `## Next Steps\n\n`;
        doc += `### Immediate Actions\n`;
        doc += `1. **Complete Environment Setup**: Install all essential prerequisites\n`;
        doc += `2. **Execute First Session**: Run \`start sesame\` and explore basic workflows\n`;
        doc += `3. **Review Documentation**: Familiarize yourself with docs/guides/ and CLAUDE.md\n`;
        doc += `4. **Select First Issue**: Use \`next sesame\` to find appropriate starting work\n\n`;
        
        doc += `### Learning Path\n`;
        doc += `1. **Week 1**: Master SESSION_START, basic workflows, and documentation structure\n`;
        doc += `2. **Week 2**: Practice development workflows and GitHub integration\n`;
        doc += `3. **Week 3**: Understand version management and more advanced workflows\n`;
        doc += `4. **Ongoing**: Contribute to knowledge base improvement and workflow enhancement\n\n`;
        
        doc += `---\n\n`;
        doc += `*This get started guide was generated from actual development experience during version ${version} as part of VERSION_TRANSITION Step 6. It reflects real prerequisites and patterns rather than theoretical requirements.*`;
        
        return doc;
    }

    detectVersion() {
        // Try to detect version from package.json or default to current
        try {
            if (fs.existsSync('package.json')) {
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                return `v${pkg.version}`;
            }
        } catch (e) {
            // Continue to fallback
        }
        return 'v0.6.1'; // Current fallback
    }
}

// CLI execution
if (require.main === module) {
    const strategicReportPath = process.argv[2] || 'docs/reports/v0.6.1-strategic-analysis.md';
    const metricsReportPath = process.argv[3] || 'docs/reports/v0.6.1-metrics-report.md';
    
    const generator = new GetStartedGenerator();
    
    generator.generateGetStartedDocs(strategicReportPath, metricsReportPath)
        .then(documentation => {
            const version = generator.detectVersion();
            
            // Ensure get-started directory exists
            const getStartedDir = 'docs/get-started';
            if (!fs.existsSync(getStartedDir)) {
                fs.mkdirSync(getStartedDir, { recursive: true });
            }
            
            const outputPath = `${getStartedDir}/${version}-getting-started.md`;
            fs.writeFileSync(outputPath, documentation);
            
            console.log(`🚀 Get started documentation generated: ${outputPath}`);
            console.log(`\n✅ VERSION_TRANSITION Step 6 complete!`);
            
            // Summary
            console.log(`\n📊 Get Started Summary:`);
            console.log(`   Prerequisites: ${generator.getStartedContent.prerequisites.length}`);
            console.log(`   Essential workflows: ${generator.getStartedContent.essentialWorkflows.length}`);
            console.log(`   Quickstart steps: ${generator.getStartedContent.quickstartSteps.length}`);
            console.log(`   Common pitfalls: ${generator.getStartedContent.commonPitfalls.length}`);
            console.log(`   Development tools: ${generator.getStartedContent.toolsUsed.length}`);
        })
        .catch(error => {
            console.error('❌ Error during get started generation:', error);
            process.exit(1);
        });
}

module.exports = GetStartedGenerator;