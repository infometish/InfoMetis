#!/usr/bin/env node

/**
 * Knowledge Base Synchronization Engine
 * VERSION_TRANSITION Step 2: Analyzes audit metrics and generates documentation update recommendations
 */

const fs = require('fs');
const path = require('path');

class KnowledgeSyncEngine {
    constructor() {
        this.metricsData = null;
        this.documentationGaps = [];
        this.updateRecommendations = [];
        this.onboardingUpdates = [];
        this.existingDocs = new Map();
    }

    loadMetricsReport(version) {
        try {
            const reportPath = path.join(__dirname, '..', '..', 'docs', 'reports', `v${version}-metrics-report.md`);
            const content = fs.readFileSync(reportPath, 'utf8');
            
            // Parse metrics from the report
            this.metricsData = this.parseMetricsReport(content);
            console.log(`✅ Loaded metrics for version ${version}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load metrics report: ${error.message}`);
            return false;
        }
    }

    parseMetricsReport(content) {
        const metrics = {
            sessions: 0,
            workflows: 0,
            knowledgeDomains: new Map(),
            newFiles: [],
            modifiedFiles: new Map(),
            systemAreas: new Map()
        };

        // Extract summary statistics
        const summaryMatch = content.match(/Total Sessions.*?(\d+)/);
        if (summaryMatch) metrics.sessions = parseInt(summaryMatch[1]);

        const workflowMatch = content.match(/Total Workflows.*?(\d+)/);
        if (workflowMatch) metrics.workflows = parseInt(workflowMatch[1]);

        // Extract knowledge domains
        const domainSection = content.match(/## Top 15 Knowledge Domains[\s\S]*?(?=##|$)/);
        if (domainSection) {
            const domainLines = domainSection[0].match(/^([a-zA-Z_]+)\s+│.*?(\d+)$/gm);
            if (domainLines) {
                domainLines.forEach(line => {
                    const match = line.match(/^([a-zA-Z_]+)\s+│.*?(\d+)$/);
                    if (match) {
                        metrics.knowledgeDomains.set(match[1], parseInt(match[2]));
                    }
                });
            }
        }

        // Extract new files
        const newFilesSection = content.match(/### New Files Created[\s\S]*?(?=###|##|$)/);
        if (newFilesSection) {
            const fileMatches = newFilesSection[0].match(/- \*\*(.*?)\*\*/g);
            if (fileMatches) {
                metrics.newFiles = fileMatches.map(match => match.replace(/- \*\*(.*?)\*\*/, '$1'));
            }
        }

        // Extract modified files
        const modifiedSection = content.match(/### Most Modified Files[\s\S]*?(?=###|##|$)/);
        if (modifiedSection) {
            const tableLines = modifiedSection[0].match(/^\| ([^|]+) \| (\d+) \| ([^|]+) \|$/gm);
            if (tableLines) {
                tableLines.forEach(line => {
                    const match = line.match(/^\| ([^|]+) \| (\d+) \| ([^|]+) \|$/);
                    if (match) {
                        metrics.modifiedFiles.set(match[1].trim(), {
                            count: parseInt(match[2]),
                            systemArea: match[3].trim()
                        });
                    }
                });
            }
        }

        return metrics;
    }

    scanExistingDocumentation() {
        const docDirectories = [
            'docs/getting-started',
            'docs/guides', 
            'docs/architecture',
            'docs/api',
            'docs/workflows',
            'docs/integration',
            'docs/management',
            'docs/specifications',
            'docs/knowledge',
            'docs/reference',
            'claude/workflows',
            'claude/operational-docs'
        ];

        console.log('📚 Scanning existing documentation...');

        docDirectories.forEach(dir => {
            const fullPath = path.join(__dirname, '..', '..', dir);
            if (fs.existsSync(fullPath)) {
                const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.md'));
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    try {
                        const content = fs.readFileSync(path.join(fullPath, file), 'utf8');
                        this.existingDocs.set(filePath, {
                            content,
                            lastModified: fs.statSync(path.join(fullPath, file)).mtime,
                            wordCount: content.split(/\s+/).length
                        });
                    } catch (error) {
                        console.warn(`⚠️  Could not read ${filePath}: ${error.message}`);
                    }
                });
            }
        });

        console.log(`📖 Found ${this.existingDocs.size} documentation files`);
    }

    analyzeDocumentationGaps() {
        console.log('🔍 Analyzing documentation gaps...');

        // Check for missing workflow documentation
        this.metricsData.knowledgeDomains.forEach((count, domain) => {
            const workflowFile = `claude/workflows/${domain.toUpperCase()}.md`;
            const guideFile = `docs/guides/${domain.replace(/_/g, '-')}-guide.md`;
            
            if (count > 10) { // High-activity domains
                if (!this.existingDocs.has(workflowFile) && !this.existingDocs.has(guideFile)) {
                    this.documentationGaps.push({
                        type: 'missing_workflow_docs',
                        domain: domain,
                        activity: count,
                        recommendation: `Create documentation for high-activity domain '${domain}' (${count} interactions)`
                    });
                }
            }
        });

        // Check for undocumented new files
        this.metricsData.newFiles.forEach(file => {
            const isDocumented = Array.from(this.existingDocs.keys()).some(docFile => {
                const content = this.existingDocs.get(docFile).content;
                return content.includes(file) || content.includes(path.basename(file));
            });

            if (!isDocumented) {
                this.documentationGaps.push({
                    type: 'undocumented_new_file',
                    file: file,
                    recommendation: `Add documentation reference for new file '${file}'`
                });
            }
        });

        // Check for missing architecture documentation
        this.metricsData.systemAreas.forEach((count, area) => {
            const archFile = `docs/architecture/${area.replace(/_/g, '-')}-architecture.md`;
            if (count > 5 && !this.existingDocs.has(archFile)) {
                this.documentationGaps.push({
                    type: 'missing_architecture_docs',
                    systemArea: area,
                    activity: count,
                    recommendation: `Create architecture documentation for system area '${area}' (${count} modifications)`
                });
            }
        });

        console.log(`📋 Identified ${this.documentationGaps.length} documentation gaps`);
    }

    generateUpdateRecommendations() {
        console.log('💡 Generating update recommendations...');

        // High-activity files need documentation updates
        this.metricsData.modifiedFiles.forEach((data, file) => {
            if (data.count > 2) {
                this.updateRecommendations.push({
                    type: 'high_activity_file',
                    file: file,
                    modifications: data.count,
                    systemArea: data.systemArea,
                    action: 'update_usage_documentation',
                    recommendation: `Update documentation for frequently modified file '${file}' (${data.count} modifications)`
                });
            }
        });

        // Knowledge domain priorities for documentation
        const topDomains = Array.from(this.metricsData.knowledgeDomains.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        topDomains.forEach(([domain, count]) => {
            this.updateRecommendations.push({
                type: 'knowledge_domain_priority',
                domain: domain,
                activity: count,
                action: 'enhance_domain_documentation',
                recommendation: `Prioritize documentation updates for domain '${domain}' (${count} interactions)`
            });
        });

        console.log(`📝 Generated ${this.updateRecommendations.length} update recommendations`);
    }

    generateOnboardingUpdates() {
        console.log('🎯 Analyzing onboarding improvements...');

        // Tool usage patterns for prerequisites
        const toolFiles = Array.from(this.metricsData.modifiedFiles.keys())
            .filter(file => file.includes('tools/') || file.includes('.js'));

        if (toolFiles.length > 0) {
            this.onboardingUpdates.push({
                type: 'tool_prerequisites',
                tools: toolFiles,
                recommendation: 'Update getting-started prerequisites to include development tools usage'
            });
        }

        // Workflow frequency for common patterns
        const topDomains = Array.from(this.metricsData.knowledgeDomains.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        this.onboardingUpdates.push({
            type: 'common_workflows',
            domains: topDomains,
            recommendation: 'Update onboarding flow to emphasize most common workflow patterns'
        });

        // System area focus
        if (this.metricsData.systemAreas.size > 0) {
            const primaryAreas = Array.from(this.metricsData.systemAreas.entries());
            this.onboardingUpdates.push({
                type: 'system_focus',
                areas: primaryAreas,
                recommendation: 'Update architecture overview to reflect actual system area usage patterns'
            });
        }

        console.log(`🚀 Generated ${this.onboardingUpdates.length} onboarding improvements`);
    }

    generateReport(version) {
        const reportContent = `# Knowledge Base Synchronization Report - v${version}

## Executive Summary

**Documentation Analysis Results:**
- **Existing Documentation Files**: ${this.existingDocs.size}
- **Documentation Gaps Identified**: ${this.documentationGaps.length}
- **Update Recommendations**: ${this.updateRecommendations.length}
- **Onboarding Improvements**: ${this.onboardingUpdates.length}

## Documentation Gaps Analysis

${this.documentationGaps.map((gap, index) => `
### ${index + 1}. ${gap.type.replace(/_/g, ' ').toUpperCase()}
**Recommendation**: ${gap.recommendation}
${gap.domain ? `**Domain**: ${gap.domain} (${gap.activity} interactions)` : ''}
${gap.file ? `**File**: ${gap.file}` : ''}
${gap.systemArea ? `**System Area**: ${gap.systemArea} (${gap.activity} modifications)` : ''}
`).join('')}

## Update Recommendations

${this.updateRecommendations.map((rec, index) => `
### ${index + 1}. ${rec.type.replace(/_/g, ' ').toUpperCase()}
**Action**: ${rec.action}
**Recommendation**: ${rec.recommendation}
${rec.file ? `**File**: ${rec.file} (${rec.modifications} modifications)` : ''}
${rec.domain ? `**Domain**: ${rec.domain} (${rec.activity} interactions)` : ''}
`).join('')}

## Onboarding Enhancement Recommendations

${this.onboardingUpdates.map((update, index) => `
### ${index + 1}. ${update.type.replace(/_/g, ' ').toUpperCase()}
**Recommendation**: ${update.recommendation}
${update.tools ? `**Tools Identified**: ${update.tools.join(', ')}` : ''}
${update.domains ? `**Top Domains**: ${update.domains.map(([d, c]) => `${d}(${c})`).join(', ')}` : ''}
${update.areas ? `**System Areas**: ${update.areas.map(([a, c]) => `${a}(${c})`).join(', ')}` : ''}
`).join('')}

## Implementation Priority

### High Priority (Immediate Action)
${this.documentationGaps.filter(g => g.activity > 20 || g.type === 'undocumented_new_file').map(g => `- ${g.recommendation}`).join('\n')}

### Medium Priority (Next Version)
${this.updateRecommendations.filter(r => r.activity > 15 || r.modifications > 3).map(r => `- ${r.recommendation}`).join('\n')}

### Low Priority (Future Versions)
${this.onboardingUpdates.map(u => `- ${u.recommendation}`).join('\n')}

## Next Steps

1. **Review High Priority Items**: Address critical documentation gaps identified
2. **Update Architecture Documentation**: Based on actual system area usage
3. **Enhance Onboarding Materials**: Incorporate real usage patterns
4. **Validate Cross-References**: Ensure all new files are properly referenced
5. **Test Documentation Flow**: Verify updated onboarding experience

---
*Generated by Knowledge Base Synchronization Engine v1.0*
*Source: v${version} audit metrics analysis*
`;

        return reportContent;
    }

    async execute(version) {
        console.log(`🔄 Starting Knowledge Base Synchronization for v${version}...`);

        // Step 1: Load metrics data
        if (!this.loadMetricsReport(version)) {
            return false;
        }

        // Step 2: Scan existing documentation
        this.scanExistingDocumentation();

        // Step 3: Analyze gaps
        this.analyzeDocumentationGaps();

        // Step 4: Generate recommendations
        this.generateUpdateRecommendations();

        // Step 5: Generate onboarding updates
        this.generateOnboardingUpdates();

        // Step 6: Generate report
        const report = this.generateReport(version);
        const reportPath = path.join(__dirname, '..', '..', 'docs', 'reports', `v${version}-knowledge-sync.md`);
        
        try {
            fs.writeFileSync(reportPath, report);
            console.log(`📊 Knowledge sync report saved: ${reportPath}`);
            
            console.log('\n✅ Knowledge Base Synchronization Analysis Complete!');
            console.log(`📋 Gaps: ${this.documentationGaps.length} | 📝 Updates: ${this.updateRecommendations.length} | 🚀 Onboarding: ${this.onboardingUpdates.length}`);
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to save report: ${error.message}`);
            return false;
        }
    }
}

// Main execution
async function main() {
    const version = process.argv[2] || '0.6.1';
    const engine = new KnowledgeSyncEngine();
    
    const success = await engine.execute(version);
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = KnowledgeSyncEngine;