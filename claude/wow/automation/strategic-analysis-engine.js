#!/usr/bin/env node

/**
 * Strategic Analysis Engine
 * VERSION_TRANSITION Step 4: Comprehensive strategic analysis and metrics generation
 */

const fs = require('fs');
const path = require('path');

class StrategicAnalysisEngine {
    constructor() {
        // Core metrics
        this.sessions = [];
        this.workflows = new Map();
        this.workTypes = new Map();
        this.knowledgeDomains = new Map();
        
        // Strategic analysis data
        this.componentInteractions = new Map();
        this.systemAreas = new Map();
        this.processPatterns = {
            successful: [],
            problematic: [],
            efficient: [],
            timeConsuming: []
        };
        this.developmentPatterns = {
            productiveSessions: [],
            workflowSequences: new Map(),
            timeDistribution: new Map()
        };
        this.strategicInsights = {
            achievements: [],
            challenges: [],
            opportunities: [],
            recommendations: []
        };
    }

    async analyzeAuditLogs(logFilePath) {
        console.log('🔍 Starting strategic analysis of audit logs...\n');
        
        if (!fs.existsSync(logFilePath)) {
            throw new Error(`Audit log file not found: ${logFilePath}`);
        }

        const logContent = fs.readFileSync(logFilePath, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());

        // Parse all audit entries
        const entries = this.parseAuditEntries(lines);
        console.log(`📊 Parsed ${entries.length} audit entries\n`);

        // Core metrics analysis
        this.analyzeWorkflows(entries);
        this.analyzeSessions(entries);
        this.analyzeKnowledgeDomains(entries);

        // Strategic analysis
        this.analyzeComponentInteractions(entries);
        this.analyzeSystemAreaEngagement(entries);
        this.analyzeProcessPatterns(entries);
        this.analyzeDevelopmentPatterns(entries);
        this.generateStrategicInsights();

        console.log('✅ Strategic analysis complete!\n');
        return this.generateStrategicReport();
    }

    parseAuditEntries(lines) {
        return lines.map(line => {
            const parts = line.split('|');
            if (parts.length < 5) return null;

            return {
                timestamp: new Date(parts[0]),
                workflow: parts[1],
                step: parts[2],
                context: parts[3] || '',
                files: parts[4] || '',
                description: parts[5] || '',
                raw: line
            };
        }).filter(entry => entry !== null);
    }

    analyzeWorkflows(entries) {
        console.log('📈 Analyzing workflow patterns...');
        
        entries.forEach(entry => {
            const workflow = entry.workflow;
            if (!this.workflows.has(workflow)) {
                this.workflows.set(workflow, {
                    count: 0,
                    steps: new Set(),
                    contexts: new Set(),
                    files: new Set(),
                    durations: [],
                    completions: 0,
                    starts: 0
                });
            }

            const workflowData = this.workflows.get(workflow);
            workflowData.count++;
            workflowData.steps.add(entry.step);
            workflowData.contexts.add(entry.context);
            
            if (entry.files) {
                entry.files.split(',').forEach(file => {
                    workflowData.files.add(file.trim());
                });
            }

            if (entry.step === 'workflow_start') workflowData.starts++;
            if (entry.step === 'workflow_complete') workflowData.completions++;
        });

        console.log(`   Found ${this.workflows.size} unique workflows\n`);
    }

    analyzeSessions(entries) {
        console.log('📅 Analyzing session patterns...');
        
        let currentSession = null;
        
        entries.forEach(entry => {
            if (entry.workflow === 'SESSION_START') {
                currentSession = {
                    start: entry.timestamp,
                    workflows: [],
                    contexts: new Set(),
                    files: new Set(),
                    productivity: 0
                };
            } else if (entry.workflow === 'SESSION_END' && currentSession) {
                currentSession.end = entry.timestamp;
                currentSession.duration = (currentSession.end - currentSession.start) / (1000 * 60); // minutes
                this.sessions.push(currentSession);
                currentSession = null;
            } else if (currentSession) {
                currentSession.workflows.push(entry.workflow);
                currentSession.contexts.add(entry.context);
                if (entry.files) {
                    entry.files.split(',').forEach(file => {
                        currentSession.files.add(file.trim());
                    });
                }
                
                // Calculate productivity score
                if (entry.step === 'workflow_complete') currentSession.productivity += 2;
                if (entry.workflow === 'DEVELOPMENT') currentSession.productivity += 3;
                if (entry.workflow === 'DOCUMENTATION') currentSession.productivity += 2;
            }
        });

        console.log(`   Analyzed ${this.sessions.length} complete sessions\n`);
    }

    analyzeKnowledgeDomains(entries) {
        console.log('🧠 Analyzing knowledge domain engagement...');
        
        entries.forEach(entry => {
            if (entry.context) {
                const domains = entry.context.split(',').map(d => d.trim());
                domains.forEach(domain => {
                    if (!this.knowledgeDomains.has(domain)) {
                        this.knowledgeDomains.set(domain, {
                            count: 0,
                            workflows: new Set(),
                            files: new Set()
                        });
                    }
                    const domainData = this.knowledgeDomains.get(domain);
                    domainData.count++;
                    domainData.workflows.add(entry.workflow);
                    if (entry.files) {
                        entry.files.split(',').forEach(file => {
                            domainData.files.add(file.trim());
                        });
                    }
                });
            }
        });

        console.log(`   Identified ${this.knowledgeDomains.size} knowledge domains\n`);
    }

    analyzeComponentInteractions(entries) {
        console.log('🔗 Analyzing component interactions...');
        
        // Group entries by session/workflow to find co-modified files
        const sessionGroups = new Map();
        
        entries.forEach(entry => {
            const sessionKey = entry.timestamp.toDateString();
            if (!sessionGroups.has(sessionKey)) {
                sessionGroups.set(sessionKey, new Set());
            }
            
            if (entry.files) {
                entry.files.split(',').forEach(file => {
                    sessionGroups.get(sessionKey).add(file.trim());
                });
            }
        });

        // Calculate file co-modification frequency
        sessionGroups.forEach(files => {
            const fileArray = Array.from(files);
            for (let i = 0; i < fileArray.length; i++) {
                for (let j = i + 1; j < fileArray.length; j++) {
                    const pair = [fileArray[i], fileArray[j]].sort().join(' + ');
                    if (!this.componentInteractions.has(pair)) {
                        this.componentInteractions.set(pair, 0);
                    }
                    this.componentInteractions.set(pair, this.componentInteractions.get(pair) + 1);
                }
            }
        });

        console.log(`   Found ${this.componentInteractions.size} component interaction patterns\n`);
    }

    analyzeSystemAreaEngagement(entries) {
        console.log('🏗️ Analyzing system area engagement...');
        
        const systemAreaPatterns = {
            'documentation': /docs\/|\.md$|README/i,
            'core_modules': /modules\/|libs\/|src\//i,
            'tooling': /tools\/|scripts\/|\.js$|\.sh$/i,
            'configuration': /config|settings|\.json$|\.yaml$|\.yml$/i,
            'testing': /test|spec|\.test\.|\.spec\./i,
            'workflows': /workflows\/|\.workflow/i,
            'audit': /audit\/|\.log$/i
        };

        entries.forEach(entry => {
            if (entry.files) {
                entry.files.split(',').forEach(file => {
                    const cleanFile = file.trim();
                    Object.entries(systemAreaPatterns).forEach(([area, pattern]) => {
                        if (pattern.test(cleanFile)) {
                            if (!this.systemAreas.has(area)) {
                                this.systemAreas.set(area, {
                                    count: 0,
                                    workflows: new Set(),
                                    files: new Set()
                                });
                            }
                            const areaData = this.systemAreas.get(area);
                            areaData.count++;
                            areaData.workflows.add(entry.workflow);
                            areaData.files.add(cleanFile);
                        }
                    });
                });
            }
        });

        console.log(`   Mapped ${this.systemAreas.size} system areas\n`);
    }

    analyzeProcessPatterns(entries) {
        console.log('⚙️ Analyzing process effectiveness patterns...');
        
        // Analyze workflow completion rates
        this.workflows.forEach((data, workflow) => {
            const completionRate = data.starts > 0 ? (data.completions / data.starts) * 100 : 0;
            
            if (completionRate >= 90 && data.count >= 5) {
                this.processPatterns.successful.push({
                    workflow,
                    completionRate,
                    count: data.count,
                    avgSteps: data.steps.size
                });
            } else if (completionRate < 50 && data.count >= 3) {
                this.processPatterns.problematic.push({
                    workflow,
                    completionRate,
                    count: data.count,
                    issues: 'Low completion rate'
                });
            }
        });

        // Analyze session productivity
        this.sessions.forEach(session => {
            const productivityScore = session.productivity / (session.duration / 60); // per hour
            const fileModificationRate = session.files.size / (session.duration / 60);
            
            if (productivityScore > 5 && session.workflows.length > 3) {
                this.processPatterns.efficient.push({
                    duration: session.duration,
                    productivity: productivityScore,
                    workflows: session.workflows.length,
                    files: session.files.size
                });
            }
        });

        console.log(`   Identified ${this.processPatterns.successful.length} successful patterns\n`);
    }

    analyzeDevelopmentPatterns(entries) {
        console.log('🚀 Analyzing development patterns...');
        
        // Identify productive sessions
        this.sessions.forEach((session, index) => {
            if (session.productivity > 10 && session.duration > 30) {
                this.developmentPatterns.productiveSessions.push({
                    index,
                    productivity: session.productivity,
                    duration: session.duration,
                    workflowCount: session.workflows.length,
                    fileCount: session.files.size,
                    contexts: Array.from(session.contexts)
                });
            }
        });

        // Analyze workflow sequences
        entries.forEach((entry, index) => {
            if (index > 0) {
                const prevWorkflow = entries[index - 1].workflow;
                const sequence = `${prevWorkflow} → ${entry.workflow}`;
                if (!this.developmentPatterns.workflowSequences.has(sequence)) {
                    this.developmentPatterns.workflowSequences.set(sequence, 0);
                }
                this.developmentPatterns.workflowSequences.set(sequence, 
                    this.developmentPatterns.workflowSequences.get(sequence) + 1);
            }
        });

        console.log(`   Found ${this.developmentPatterns.productiveSessions.length} highly productive sessions\n`);
    }

    generateStrategicInsights() {
        console.log('💡 Generating strategic insights...');
        
        // Version achievements
        const totalWorkflows = Array.from(this.workflows.values()).reduce((sum, w) => sum + w.count, 0);
        const completedWorkflows = Array.from(this.workflows.values()).reduce((sum, w) => sum + w.completions, 0);
        const totalFiles = new Set();
        Array.from(this.workflows.values()).forEach(w => {
            w.files.forEach(f => totalFiles.add(f));
        });

        this.strategicInsights.achievements.push(
            `Executed ${totalWorkflows} workflow instances across ${this.workflows.size} different workflows`,
            `Achieved ${((completedWorkflows / totalWorkflows) * 100).toFixed(1)}% workflow completion rate`,
            `Modified ${totalFiles.size} unique files across ${this.systemAreas.size} system areas`,
            `Engaged ${this.knowledgeDomains.size} distinct knowledge domains`
        );

        // Process improvements identified
        if (this.processPatterns.successful.length > 0) {
            this.strategicInsights.recommendations.push(
                `Standardize ${this.processPatterns.successful.length} highly successful workflow patterns`,
                `Focus on ${this.processPatterns.successful[0].workflow} workflow - highest success rate`
            );
        }

        if (this.processPatterns.problematic.length > 0) {
            this.strategicInsights.recommendations.push(
                `Address ${this.processPatterns.problematic.length} workflows with low completion rates`,
                `Investigate ${this.processPatterns.problematic[0].workflow} workflow issues`
            );
        }

        // Development pattern insights
        if (this.developmentPatterns.productiveSessions.length > 0) {
            const avgProductivity = this.developmentPatterns.productiveSessions.reduce(
                (sum, s) => sum + s.productivity, 0) / this.developmentPatterns.productiveSessions.length;
            
            this.strategicInsights.opportunities.push(
                `Replicate characteristics of ${this.developmentPatterns.productiveSessions.length} highly productive sessions`,
                `Target productivity score of ${avgProductivity.toFixed(1)} for future sessions`
            );
        }

        console.log(`   Generated ${this.strategicInsights.achievements.length + this.strategicInsights.recommendations.length + this.strategicInsights.opportunities.length} strategic insights\n`);
    }

    generateStrategicReport() {
        const timestamp = new Date().toISOString();
        const version = path.basename(path.dirname(process.argv[2] || '')) || 'current';
        
        let report = `# Strategic Analysis Report - ${version}\n\n`;
        report += `**Generated**: ${timestamp}\n`;
        report += `**Analysis Scope**: VERSION_TRANSITION Step 4 - Strategic Analysis and Metrics Generation\n\n`;

        // Executive Summary
        report += `## Executive Summary\n\n`;
        report += `This strategic analysis provides comprehensive insights into development patterns, process effectiveness, and future optimization opportunities based on version ${version} audit data.\n\n`;

        const totalSessions = this.sessions.length;
        const totalWorkflows = Array.from(this.workflows.values()).reduce((sum, w) => sum + w.count, 0);
        const totalDuration = this.sessions.reduce((sum, s) => sum + s.duration, 0);

        report += `### Key Metrics\n`;
        report += `- **Development Sessions**: ${totalSessions}\n`;
        report += `- **Workflow Instances**: ${totalWorkflows}\n`;
        report += `- **Total Development Time**: ${(totalDuration / 60).toFixed(1)} hours\n`;
        report += `- **Average Session Duration**: ${(totalDuration / totalSessions).toFixed(1)} minutes\n`;
        report += `- **Workflow Diversity**: ${this.workflows.size} unique workflows\n`;
        report += `- **Knowledge Domain Engagement**: ${this.knowledgeDomains.size} domains\n\n`;

        // Strategic Achievements
        report += `## Version Achievements\n\n`;
        this.strategicInsights.achievements.forEach(achievement => {
            report += `- ${achievement}\n`;
        });
        report += `\n`;

        // Workflow Effectiveness Analysis
        report += `## Workflow Effectiveness Analysis\n\n`;
        
        report += `### Most Successful Workflows\n`;
        const topWorkflows = Array.from(this.workflows.entries())
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 10);
        
        report += `| Workflow | Instances | Completion Rate | Contexts | Files |\n`;
        report += `|----------|-----------|-----------------|----------|---------|\n`;
        topWorkflows.forEach(([workflow, data]) => {
            const completionRate = data.starts > 0 ? ((data.completions / data.starts) * 100).toFixed(1) : 'N/A';
            report += `| ${workflow} | ${data.count} | ${completionRate}% | ${data.contexts.size} | ${data.files.size} |\n`;
        });
        report += `\n`;

        // Component Interaction Analysis
        report += `## Component Interaction Analysis\n\n`;
        
        const topInteractions = Array.from(this.componentInteractions.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 15);

        if (topInteractions.length > 0) {
            report += `### Most Frequently Co-Modified Components\n`;
            report += `| Component Pair | Co-modification Count |\n`;
            report += `|----------------|----------------------|\n`;
            topInteractions.forEach(([pair, count]) => {
                report += `| ${pair} | ${count} |\n`;
            });
            report += `\n`;
        }

        // System Area Engagement
        report += `## System Area Engagement\n\n`;
        
        const sortedAreas = Array.from(this.systemAreas.entries())
            .sort(([,a], [,b]) => b.count - a.count);

        report += `| System Area | Activity Count | Unique Workflows | Files Modified |\n`;
        report += `|-------------|----------------|------------------|----------------|\n`;
        sortedAreas.forEach(([area, data]) => {
            report += `| ${area} | ${data.count} | ${data.workflows.size} | ${data.files.size} |\n`;
        });
        report += `\n`;

        // Knowledge Domain Analysis
        report += `## Knowledge Domain Analysis\n\n`;
        
        const topDomains = Array.from(this.knowledgeDomains.entries())
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 15);

        report += `### Most Engaged Knowledge Domains\n`;
        report += `| Domain | Engagement Count | Workflows | Files |\n`;
        report += `|--------|------------------|-----------|-------|\n`;
        topDomains.forEach(([domain, data]) => {
            report += `| ${domain} | ${data.count} | ${data.workflows.size} | ${data.files.size} |\n`;
        });
        report += `\n`;

        // Development Patterns
        report += `## Development Pattern Analysis\n\n`;
        
        if (this.developmentPatterns.productiveSessions.length > 0) {
            report += `### Highly Productive Sessions\n`;
            report += `| Session | Duration (min) | Productivity Score | Workflows | Files | Key Contexts |\n`;
            report += `|---------|----------------|-------------------|-----------|-------|-------------|\n`;
            this.developmentPatterns.productiveSessions.slice(0, 10).forEach(session => {
                const contexts = session.contexts.slice(0, 3).join(', ');
                report += `| ${session.index + 1} | ${session.duration.toFixed(1)} | ${session.productivity.toFixed(1)} | ${session.workflowCount} | ${session.fileCount} | ${contexts} |\n`;
            });
            report += `\n`;
        }

        // Process Improvement Recommendations
        report += `## Process Improvement Recommendations\n\n`;
        
        report += `### Immediate Actions\n`;
        this.strategicInsights.recommendations.slice(0, 5).forEach(rec => {
            report += `1. ${rec}\n`;
        });
        report += `\n`;

        report += `### Strategic Opportunities\n`;
        this.strategicInsights.opportunities.forEach(opp => {
            report += `- ${opp}\n`;
        });
        report += `\n`;

        // Future Version Guidance
        report += `## Future Version Guidance\n\n`;
        
        report += `### Recommended Focus Areas\n`;
        const topSystemAreas = Array.from(this.systemAreas.entries())
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 3);
        
        topSystemAreas.forEach(([area, data]) => {
            report += `- **${area}**: High activity (${data.count} instances) suggests continued importance\n`;
        });
        report += `\n`;

        report += `### Process Evolution Recommendations\n`;
        report += `1. **Workflow Standardization**: Formalize successful patterns identified in analysis\n`;
        report += `2. **Component Coupling Management**: Address high co-modification patterns for better modularity\n`;
        report += `3. **Session Optimization**: Target characteristics of highly productive sessions\n`;
        report += `4. **Knowledge Domain Balance**: Ensure adequate coverage of all engaged domains\n\n`;

        // Integration with VERSION_TRANSITION
        report += `## VERSION_TRANSITION Integration\n\n`;
        report += `This strategic analysis supports VERSION_TRANSITION by providing:\n\n`;
        report += `### Assessment Results\n`;
        report += `- **Process Maturity**: Evidence of systematic development approach\n`;
        report += `- **Workflow Effectiveness**: Quantified success patterns and improvement areas\n`;
        report += `- **Component Architecture**: Interaction patterns and coupling insights\n`;
        report += `- **Development Efficiency**: Productivity patterns and optimization opportunities\n\n`;

        report += `### Next Steps Integration\n`;
        report += `1. **Step 5 Input**: Use focus area and process insights for next version preparation\n`;
        report += `2. **Workflow Enhancement**: Apply successful patterns to VERSION_TRANSITION procedures\n`;
        report += `3. **Tool Evolution**: Enhance based on most effective workflow patterns\n`;
        report += `4. **Process Documentation**: Update procedures with strategic insights\n\n`;

        // Historical Tracking Metrics
        report += `## Historical Tracking Metrics\n\n`;
        report += `*For comparison across version transitions:*\n\n`;
        report += `- **Workflow Diversity Index**: ${this.workflows.size / totalWorkflows * 100}\n`;
        report += `- **Process Completion Rate**: ${((Array.from(this.workflows.values()).reduce((sum, w) => sum + w.completions, 0) / totalWorkflows) * 100).toFixed(1)}%\n`;
        report += `- **Session Productivity Average**: ${(this.sessions.reduce((sum, s) => sum + s.productivity, 0) / this.sessions.length).toFixed(2)}\n`;
        report += `- **Component Interaction Density**: ${this.componentInteractions.size}\n`;
        report += `- **Knowledge Domain Coverage**: ${this.knowledgeDomains.size}\n\n`;

        report += `---\n\n`;
        report += `*This strategic analysis was generated by the Strategic Analysis Engine as part of VERSION_TRANSITION Step 4. The insights and recommendations support continuous process improvement and effective future version planning.*`;

        return report;
    }
}

// CLI execution
if (require.main === module) {
    const logFilePath = process.argv[2];
    
    if (!logFilePath) {
        console.error('❌ Please provide the audit log file path');
        console.error('Usage: node strategic-analysis-engine.js <audit-log-path>');
        process.exit(1);
    }

    const analyzer = new StrategicAnalysisEngine();
    
    analyzer.analyzeAuditLogs(logFilePath)
        .then(report => {
            // Extract version from path for report naming
            const pathParts = logFilePath.split('/');
            const versionDir = pathParts.find(part => part.startsWith('v'));
            const version = versionDir || 'current';
            
            const reportPath = `docs/reports/${version}-strategic-analysis.md`;
            
            // Ensure reports directory exists
            const reportsDir = 'docs/reports';
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            
            fs.writeFileSync(reportPath, report);
            console.log(`📋 Strategic analysis report generated: ${reportPath}`);
            console.log(`\n✅ VERSION_TRANSITION Step 4 complete!`);
        })
        .catch(error => {
            console.error('❌ Error during strategic analysis:', error);
            process.exit(1);
        });
}

module.exports = StrategicAnalysisEngine;