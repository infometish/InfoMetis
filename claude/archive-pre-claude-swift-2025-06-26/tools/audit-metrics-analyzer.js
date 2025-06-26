#!/usr/bin/env node

/**
 * Audit Log Metrics Analyzer
 * Analyzes audit logs for workflow statistics, durations, and categorization
 */

const fs = require('fs');
const path = require('path');

class AuditMetricsAnalyzer {
    constructor() {
        this.workflows = new Map();
        this.sessions = [];
        this.workTypes = {
            development: 0,
            operational: 0, 
            documentation: 0,
            discussion: 0,
            planning: 0,
            testing: 0
        };
        this.plannedVsUnplanned = {
            planned: 0,
            unplanned: 0
        };
        this.knowledgeDomains = new Map();
        this.components = {
            filesModified: new Map(),
            newFiles: new Set(),
            systemAreas: new Map(),
            moduleInteractions: new Map()
        };
    }

    parseTimestamp(timestampStr) {
        // Handle multiple timestamp formats
        const cleanStr = timestampStr.replace(/[→]/g, '').trim();
        if (cleanStr.includes('+08:00')) {
            return new Date(cleanStr);
        }
        return new Date(cleanStr);
    }

    categorizeWorkType(workflow, context) {
        const workflowLower = workflow.toLowerCase();
        const contextLower = (context || '').toLowerCase();
        
        if (workflowLower.includes('development') || 
            workflowLower.includes('issue_creation') ||
            workflowLower.includes('implementation') ||
            contextLower.includes('development')) {
            return 'development';
        }
        
        if (workflowLower.includes('session') || 
            workflowLower.includes('git_workflow') ||
            workflowLower.includes('operational') ||
            contextLower.includes('session_management') ||
            contextLower.includes('git_operations')) {
            return 'operational';
        }
        
        if (workflowLower.includes('documentation') || 
            contextLower.includes('documentation_strategy') ||
            contextLower.includes('documentation')) {
            return 'documentation';
        }
        
        if (workflowLower.includes('discussion') || 
            workflowLower.includes('clarification') ||
            contextLower.includes('discussion')) {
            return 'discussion';
        }
        
        if (workflowLower.includes('planning') || 
            workflowLower.includes('architecture') ||
            contextLower.includes('planning') ||
            contextLower.includes('architecture')) {
            return 'planning';
        }
        
        if (workflowLower.includes('tdd') || 
            workflowLower.includes('test') ||
            contextLower.includes('testing')) {
            return 'testing';
        }
        
        return 'other';
    }

    isPlannedWork(context) {
        const contextLower = (context || '').toLowerCase();
        return contextLower.includes('issue') || 
               contextLower.includes('milestone') ||
               contextLower.includes('epic') ||
               contextLower.includes('feature/');
    }

    extractKnowledgeDomains(context) {
        if (!context) return [];
        
        // Split on common separators and clean
        const domains = context.split(/[,|]/).map(d => d.trim()).filter(d => d.length > 0);
        return domains;
    }

    categorizeSystemArea(filePath) {
        if (!filePath) return 'other';
        
        const pathLower = filePath.toLowerCase();
        
        if (pathLower.includes('claude/')) {
            if (pathLower.includes('workflows/')) return 'workflow_system';
            if (pathLower.includes('audit/')) return 'audit_system';
            if (pathLower.includes('tools/')) return 'automation_tools';
            if (pathLower.includes('operational-docs/')) return 'operational_docs';
            return 'claude_system';
        }
        
        if (pathLower.includes('docs/')) {
            if (pathLower.includes('architecture/')) return 'architecture_docs';
            if (pathLower.includes('api/')) return 'api_docs';
            if (pathLower.includes('reports/')) return 'reports';
            return 'documentation';
        }
        
        if (pathLower.includes('modules/')) {
            if (pathLower.includes('spl/')) return 'core_platform';
            return 'platform_modules';
        }
        
        if (pathLower.includes('.md')) return 'documentation';
        if (pathLower.includes('.js')) return 'implementation';
        if (pathLower.includes('.json')) return 'configuration';
        
        return 'other';
    }

    isNewFile(workflow, step, description) {
        const desc = (description || '').toLowerCase();
        const workflowLower = (workflow || '').toLowerCase();
        
        return desc.includes('created') || 
               desc.includes('new file') ||
               desc.includes('added') ||
               workflowLower.includes('creation') ||
               step === 'file_creation';
    }

    parseAuditLog(logContent) {
        const lines = logContent.split('\n').filter(line => line.trim());
        let currentSession = null;
        
        for (const line of lines) {
            // Handle both formats: with line numbers (current) and without (v0.6.1)
            let content = line;
            const lineNumberMatch = line.match(/^\s*\d+→(.+)/);
            if (lineNumberMatch) {
                content = lineNumberMatch[1];
            }
            
            const parts = content.split('|');
            if (parts.length < 4) continue;
            
            const timestamp = parts[0];
            const workflow = parts[1];
            const step = parts[2];
            const context = parts[3] || '';
            const details = parts[4] || '';
            
            const parsedTime = this.parseTimestamp(timestamp);
            
            // Track sessions
            if (workflow === 'SESSION_START') {
                currentSession = {
                    start: parsedTime,
                    workflows: [],
                    workTypes: {...this.workTypes}
                };
            } else if (workflow === 'SESSION_END' && currentSession) {
                currentSession.end = parsedTime;
                currentSession.duration = (currentSession.end - currentSession.start) / (1000 * 60); // minutes
                this.sessions.push(currentSession);
                currentSession = null;
            }
            
            // Track workflows
            if (!this.workflows.has(workflow)) {
                this.workflows.set(workflow, {
                    count: 0,
                    totalDuration: 0,
                    instances: [],
                    workType: this.categorizeWorkType(workflow, context)
                });
            }
            
            const workflowData = this.workflows.get(workflow);
            workflowData.count++;
            
            if (step === 'workflow_start') {
                workflowData.startTime = parsedTime;
            } else if ((step === 'workflow_complete' || step === 'complete') && workflowData.startTime) {
                const duration = (parsedTime - workflowData.startTime) / (1000 * 60); // minutes
                workflowData.totalDuration += duration;
                workflowData.instances.push({
                    start: workflowData.startTime,
                    end: parsedTime,
                    duration: duration,
                    context: context
                });
                delete workflowData.startTime;
            }
            
            // Categorize work
            const workType = this.categorizeWorkType(workflow, context);
            this.workTypes[workType]++;
            
            if (currentSession) {
                currentSession.workTypes[workType]++;
                currentSession.workflows.push({
                    workflow,
                    step,
                    context,
                    timestamp: parsedTime,
                    workType
                });
            }
            
            // Track planned vs unplanned
            if (this.isPlannedWork(context)) {
                this.plannedVsUnplanned.planned++;
            } else {
                this.plannedVsUnplanned.unplanned++;
            }
            
            // Extract knowledge domains
            const domains = this.extractKnowledgeDomains(context);
            domains.forEach(domain => {
                if (!this.knowledgeDomains.has(domain)) {
                    this.knowledgeDomains.set(domain, 0);
                }
                this.knowledgeDomains.set(domain, this.knowledgeDomains.get(domain) + 1);
            });
            
            // Track file components
            if (details && details.trim()) {
                // Count file modifications
                if (!this.components.filesModified.has(details)) {
                    this.components.filesModified.set(details, 0);
                }
                this.components.filesModified.set(details, this.components.filesModified.get(details) + 1);
                
                // Detect new files
                if (this.isNewFile(workflow, step, details)) {
                    this.components.newFiles.add(details);
                }
                
                // Categorize system areas
                const systemArea = this.categorizeSystemArea(details);
                if (!this.components.systemAreas.has(systemArea)) {
                    this.components.systemAreas.set(systemArea, 0);
                }
                this.components.systemAreas.set(systemArea, this.components.systemAreas.get(systemArea) + 1);
            }
        }
    }

    generateBarChart(data, title, width = 50) {
        let result = `\n${title}\n${'='.repeat(title.length)}\n`;
        
        const maxValue = Math.max(...Object.values(data));
        const maxKeyLength = Math.max(...Object.keys(data).map(k => k.length));
        
        for (const [key, value] of Object.entries(data)) {
            const barLength = Math.round((value / maxValue) * width);
            const bar = '█'.repeat(barLength);
            const padding = ' '.repeat(maxKeyLength - key.length);
            result += `${key}${padding} │${bar} ${value}\n`;
        }
        
        return result;
    }

    generateWorkflowReport() {
        let report = "# V0.6.1 Audit Log Metrics Analysis\n\n";
        
        // Summary statistics
        report += "## Summary Statistics\n";
        report += `- **Total Sessions**: ${this.sessions.length}\n`;
        report += `- **Total Workflows**: ${this.workflows.size}\n`;
        report += `- **Total Workflow Instances**: ${Array.from(this.workflows.values()).reduce((sum, w) => sum + w.count, 0)}\n`;
        
        const completedSessions = this.sessions.filter(s => s.end);
        if (completedSessions.length > 0) {
            const avgDuration = completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length;
            const totalDuration = completedSessions.reduce((sum, s) => sum + s.duration, 0);
            report += `- **Average Session Duration**: ${avgDuration.toFixed(1)} minutes\n`;
            report += `- **Total Development Time**: ${(totalDuration / 60).toFixed(1)} hours\n`;
        }
        
        // Workflow frequency table
        report += "\n## Workflow Frequency Analysis\n\n";
        report += "| Workflow | Count | Avg Duration (min) | Work Type |\n";
        report += "|----------|-------|-------------------|----------|\n";
        
        const sortedWorkflows = Array.from(this.workflows.entries())
            .sort((a, b) => b[1].count - a[1].count);
        
        for (const [name, data] of sortedWorkflows) {
            const avgDuration = data.instances.length > 0 ? 
                (data.totalDuration / data.instances.length).toFixed(1) : 'N/A';
            report += `| ${name} | ${data.count} | ${avgDuration} | ${data.workType} |\n`;
        }
        
        // Work type distribution
        const workTypeData = {};
        for (const [type, count] of Object.entries(this.workTypes)) {
            if (count > 0) workTypeData[type] = count;
        }
        report += this.generateBarChart(workTypeData, "\n## Work Type Distribution");
        
        // Planned vs Unplanned
        report += this.generateBarChart(this.plannedVsUnplanned, "\n## Planned vs Unplanned Work");
        
        // Knowledge domains analysis
        const topDomains = {};
        Array.from(this.knowledgeDomains.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .forEach(([domain, count]) => {
                topDomains[domain] = count;
            });
        report += this.generateBarChart(topDomains, "\n## Top 15 Knowledge Domains");
        
        // System areas analysis
        const systemAreaData = {};
        for (const [area, count] of this.components.systemAreas.entries()) {
            if (count > 0) systemAreaData[area] = count;
        }
        report += this.generateBarChart(systemAreaData, "\n## System Areas Modified");
        
        // Workflow frequency chart
        const topWorkflows = {};
        sortedWorkflows.slice(0, 10).forEach(([name, data]) => {
            topWorkflows[name] = data.count;
        });
        report += this.generateBarChart(topWorkflows, "\n## Top 10 Workflows by Frequency");
        
        // Session analysis
        if (completedSessions.length > 0) {
            report += "\n## Session Analysis\n\n";
            report += "| Session | Duration (min) | Workflows | Primary Work Type |\n";
            report += "|---------|----------------|-----------|------------------|\n";
            
            completedSessions.forEach((session, index) => {
                const primaryWorkType = Object.entries(session.workTypes)
                    .sort((a, b) => b[1] - a[1])[0][0];
                report += `| ${index + 1} | ${session.duration.toFixed(1)} | ${session.workflows.length} | ${primaryWorkType} |\n`;
            });
        }
        
        // Duration analysis for key workflows
        report += "\n## Workflow Duration Analysis\n\n";
        const workflowsWithDuration = Array.from(this.workflows.entries())
            .filter(([_, data]) => data.instances.length > 0)
            .sort((a, b) => b[1].totalDuration - a[1].totalDuration);
        
        if (workflowsWithDuration.length > 0) {
            report += "| Workflow | Total Duration (min) | Instances | Avg Duration (min) |\n";
            report += "|----------|---------------------|-----------|-------------------|\n";
            
            workflowsWithDuration.slice(0, 10).forEach(([name, data]) => {
                const avgDuration = (data.totalDuration / data.instances.length).toFixed(1);
                report += `| ${name} | ${data.totalDuration.toFixed(1)} | ${data.instances.length} | ${avgDuration} |\n`;
            });
        }
        
        // New components and files analysis
        report += "\n## Component Discovery Analysis\n\n";
        
        if (this.components.newFiles.size > 0) {
            report += "### New Files Created\n\n";
            Array.from(this.components.newFiles).forEach(file => {
                const systemArea = this.categorizeSystemArea(file);
                report += `- **${file}** (${systemArea})\n`;
            });
        }
        
        report += "\n### Most Modified Files\n\n";
        report += "| File | Modifications | System Area |\n";
        report += "|------|---------------|-------------|\n";
        
        Array.from(this.components.filesModified.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .forEach(([file, count]) => {
                const systemArea = this.categorizeSystemArea(file);
                report += `| ${file} | ${count} | ${systemArea} |\n`;
            });
        
        // Knowledge domain summary
        report += "\n## Knowledge Domain Summary\n\n";
        report += `- **Total Unique Domains**: ${this.knowledgeDomains.size}\n`;
        report += `- **Total Domain Interactions**: ${Array.from(this.knowledgeDomains.values()).reduce((sum, count) => sum + count, 0)}\n`;
        report += `- **New Files Discovered**: ${this.components.newFiles.size}\n`;
        report += `- **Unique Files Modified**: ${this.components.filesModified.size}\n`;
        report += `- **System Areas Touched**: ${this.components.systemAreas.size}\n`;
        
        return report;
    }
}

// Main execution
function main() {
    const analyzer = new AuditMetricsAnalyzer();
    
    try {
        const logPath = path.join(__dirname, '..', 'audit', 'v0.6.1', 'audit_v0.6.1.log');
        const logContent = fs.readFileSync(logPath, 'utf8');
        
        console.log('Analyzing audit log...');
        analyzer.parseAuditLog(logContent);
        
        const report = analyzer.generateWorkflowReport();
        
        // Write report to file
        const reportPath = path.join(__dirname, '..', 'operational-docs', 'v0.6.1-metrics-report.md');
        fs.writeFileSync(reportPath, report);
        
        console.log(`Analysis complete! Report saved to: ${reportPath}`);
        console.log('\nQuick Summary:');
        console.log(`- Sessions: ${analyzer.sessions.length}`);
        console.log(`- Workflows: ${analyzer.workflows.size}`);
        console.log(`- Total workflow instances: ${Array.from(analyzer.workflows.values()).reduce((sum, w) => sum + w.count, 0)}`);
        
        return report;
    } catch (error) {
        console.error('Error analyzing audit log:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = AuditMetricsAnalyzer;