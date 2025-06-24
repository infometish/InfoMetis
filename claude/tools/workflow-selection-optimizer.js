#!/usr/bin/env node

/**
 * Workflow Selection Optimizer
 * Analyzes audit data to identify when documented workflows should have been chosen over undocumented ones
 * Provides recommendations for improving workflow selection criteria and decision-making
 */

const fs = require('fs');
const path = require('path');

class WorkflowSelectionOptimizer {
    constructor() {
        this.auditData = null;
        this.documentedWorkflows = new Set();
        this.workflowInstances = [];
        this.selectionAnalysis = {
            missedOpportunities: [],
            contextPatterns: new Map(),
            selectionCriteria: new Map(),
            optimizationRecommendations: []
        };
    }

    loadAuditLog(version) {
        try {
            const auditPath = path.join(__dirname, '..', 'audit', `v${version}`, `audit_v${version}.log`);
            const content = fs.readFileSync(auditPath, 'utf8');
            
            this.auditData = this.parseAuditLog(content);
            console.log(`✅ Loaded audit log for version ${version}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load audit log: ${error.message}`);
            return false;
        }
    }

    parseAuditLog(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const instances = [];
        
        for (const line of lines) {
            let cleanLine = line;
            const lineNumberMatch = line.match(/^\s*\d+→(.+)/);
            if (lineNumberMatch) {
                cleanLine = lineNumberMatch[1];
            }
            
            const parts = cleanLine.split('|');
            if (parts.length >= 4) {
                instances.push({
                    timestamp: parts[0],
                    workflow: parts[1],
                    step: parts[2],
                    context: parts[3] || '',
                    details: parts[4] || '',
                    line: cleanLine
                });
            }
        }
        
        return instances;
    }

    loadDocumentedWorkflows() {
        console.log('📚 Loading documented workflows...');
        
        try {
            const workflowsDir = path.join(__dirname, '..', '..', 'claude', 'workflows');
            const workflowFiles = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.md'));
            
            workflowFiles.forEach(file => {
                const workflowName = file.replace('.md', '');
                this.documentedWorkflows.add(workflowName);
            });
            
            console.log(`📖 Found ${this.documentedWorkflows.size} documented workflows`);
            console.log(`🔧 Documented: ${Array.from(this.documentedWorkflows).join(', ')}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load documented workflows: ${error.message}`);
            return false;
        }
    }

    analyzeWorkflowSelection() {
        console.log('🔍 Analyzing workflow selection patterns...');
        
        const freestyleInstances = this.auditData.filter(instance => 
            instance.workflow === 'FREESTYLE'
        );
        
        const undocumentedWorkflows = this.auditData.filter(instance =>
            !this.documentedWorkflows.has(instance.workflow) && 
            instance.workflow !== 'FREESTYLE' &&
            !this.isBuiltInWorkflow(instance.workflow)
        );

        console.log(`🎯 Found ${freestyleInstances.length} FREESTYLE instances`);
        console.log(`📝 Found ${undocumentedWorkflows.length} other undocumented workflow instances`);

        // Analyze FREESTYLE usage
        this.analyzeFREESTYLEPatterns(freestyleInstances);
        
        // Analyze other undocumented workflows
        this.analyzeUndocumentedPatterns(undocumentedWorkflows);
        
        // Identify context patterns
        this.identifyContextPatterns([...freestyleInstances, ...undocumentedWorkflows]);
        
        // Generate selection criteria improvements
        this.generateSelectionCriteria();
    }

    isBuiltInWorkflow(workflow) {
        const builtInWorkflows = [
            'TODO_MANAGEMENT', 'TOOL_SELECTION', 'SEARCH_STRATEGY', 
            'ERROR_HANDLING', 'CONCURRENCY', 'CODE_ANALYSIS', 
            'COMMIT_WORKFLOW', 'RESPONSE_CONCISENESS'
        ];
        return builtInWorkflows.includes(workflow);
    }

    analyzeFREESTYLEPatterns(instances) {
        console.log('🎪 Analyzing FREESTYLE usage patterns...');
        
        instances.forEach(instance => {
            const context = instance.context.toLowerCase();
            const details = instance.details.toLowerCase();
            
            // Check if this could have been handled by existing workflows
            const possibleAlternatives = this.findWorkflowAlternatives(context, details);
            
            if (possibleAlternatives.length > 0) {
                this.selectionAnalysis.missedOpportunities.push({
                    type: 'freestyle_to_documented',
                    timestamp: instance.timestamp,
                    context: instance.context,
                    details: instance.details,
                    alternatives: possibleAlternatives,
                    recommendation: `Consider using ${possibleAlternatives[0]} instead of FREESTYLE`
                });
            }
            
            // Track context patterns
            this.trackContextPattern('FREESTYLE', context, instance);
        });
    }

    analyzeUndocumentedPatterns(instances) {
        console.log('📋 Analyzing undocumented workflow patterns...');
        
        const workflowGroups = new Map();
        
        instances.forEach(instance => {
            if (!workflowGroups.has(instance.workflow)) {
                workflowGroups.set(instance.workflow, []);
            }
            workflowGroups.get(instance.workflow).push(instance);
        });
        
        workflowGroups.forEach((instances, workflow) => {
            if (instances.length >= 3) { // Frequent undocumented workflow
                this.selectionAnalysis.missedOpportunities.push({
                    type: 'undocumented_frequent',
                    workflow: workflow,
                    frequency: instances.length,
                    contexts: instances.map(i => i.context),
                    recommendation: `Consider creating documentation for frequently used workflow '${workflow}' (${instances.length} instances)`
                });
            }
            
            instances.forEach(instance => {
                this.trackContextPattern(workflow, instance.context, instance);
            });
        });
    }

    findWorkflowAlternatives(context, details) {
        const alternatives = [];
        
        // Map context patterns to documented workflows
        const contextMappings = {
            'session_management': ['SESSION_START', 'SESSION_END'],
            'git_operations': ['GIT_WORKFLOW'],
            'github': ['GITHUB_WORKFLOW'],
            'issue': ['GITHUB_WORKFLOW', 'NEXT_ISSUE'],
            'project': ['PROJECT_AUTOMATION', 'GITHUB_WORKFLOW'],
            'documentation': ['OPERATIONAL_RULES'],
            'workflow': ['WORKFLOW_RECOMMENDATION'],
            'release': ['RELEASE_PROCESS'],
            'version': ['VERSION_TRANSITION'],
            'planning': ['PLANNED_VS_UNPLANNED']
        };
        
        Object.entries(contextMappings).forEach(([pattern, workflows]) => {
            if (context.includes(pattern) || details.includes(pattern)) {
                workflows.forEach(workflow => {
                    if (this.documentedWorkflows.has(workflow) && !alternatives.includes(workflow)) {
                        alternatives.push(workflow);
                    }
                });
            }
        });
        
        return alternatives;
    }

    trackContextPattern(workflow, context, instance) {
        const contextKey = context.toLowerCase().trim();
        if (!contextKey) return;
        
        if (!this.selectionAnalysis.contextPatterns.has(contextKey)) {
            this.selectionAnalysis.contextPatterns.set(contextKey, {
                workflows: new Map(),
                instances: []
            });
        }
        
        const pattern = this.selectionAnalysis.contextPatterns.get(contextKey);
        
        if (!pattern.workflows.has(workflow)) {
            pattern.workflows.set(workflow, 0);
        }
        pattern.workflows.set(workflow, pattern.workflows.get(workflow) + 1);
        pattern.instances.push(instance);
    }

    identifyContextPatterns() {
        console.log('🧩 Identifying context-based selection patterns...');
        
        this.selectionAnalysis.contextPatterns.forEach((pattern, context) => {
            const workflowCounts = Array.from(pattern.workflows.entries())
                .sort((a, b) => b[1] - a[1]);
            
            if (workflowCounts.length > 1) {
                const mostUsed = workflowCounts[0];
                const alternatives = workflowCounts.slice(1);
                
                // Check if documented workflow was available but less used
                const documentedAlternatives = alternatives.filter(([workflow]) => 
                    this.documentedWorkflows.has(workflow)
                );
                
                if (documentedAlternatives.length > 0 && 
                    (mostUsed[0] === 'FREESTYLE' || !this.documentedWorkflows.has(mostUsed[0]))) {
                    
                    this.selectionAnalysis.missedOpportunities.push({
                        type: 'context_pattern_optimization',
                        context: context,
                        currentChoice: mostUsed,
                        betterAlternatives: documentedAlternatives,
                        recommendation: `For context '${context}', prefer documented workflow '${documentedAlternatives[0][0]}' over '${mostUsed[0]}'`
                    });
                }
            }
        });
    }

    generateSelectionCriteria() {
        console.log('⚙️ Generating workflow selection criteria improvements...');
        
        // Analyze successful documented workflow usage
        const documentedUsage = this.auditData.filter(instance =>
            this.documentedWorkflows.has(instance.workflow)
        );
        
        const contextSuccessPatterns = new Map();
        
        documentedUsage.forEach(instance => {
            const workflow = instance.workflow;
            const context = instance.context.toLowerCase();
            
            if (!contextSuccessPatterns.has(workflow)) {
                contextSuccessPatterns.set(workflow, new Set());
            }
            contextSuccessPatterns.get(workflow).add(context);
        });
        
        // Generate recommendations for trigger improvements
        contextSuccessPatterns.forEach((contexts, workflow) => {
            const contextList = Array.from(contexts).filter(c => c.trim());
            if (contextList.length > 0) {
                this.selectionAnalysis.optimizationRecommendations.push({
                    type: 'trigger_criteria',
                    workflow: workflow,
                    contexts: contextList,
                    recommendation: `Enhance ${workflow} triggers to activate for contexts: ${contextList.join(', ')}`
                });
            }
        });
        
        // Generate decision tree recommendations
        const contextDecisions = new Map();
        
        this.selectionAnalysis.contextPatterns.forEach((pattern, context) => {
            const workflows = Array.from(pattern.workflows.entries())
                .sort((a, b) => b[1] - a[1]);
            
            if (workflows.length > 0) {
                contextDecisions.set(context, {
                    preferred: workflows[0],
                    alternatives: workflows.slice(1)
                });
            }
        });
        
        this.selectionAnalysis.optimizationRecommendations.push({
            type: 'decision_tree',
            decisions: Array.from(contextDecisions.entries()),
            recommendation: 'Implement context-based workflow selection decision tree'
        });
    }

    generateReport(version) {
        const report = `# Workflow Selection Optimization Report - v${version}

## Executive Summary

**Analysis Results:**
- **Total Audit Instances**: ${this.auditData.length}
- **Documented Workflows Available**: ${this.documentedWorkflows.size}
- **Missed Opportunities Identified**: ${this.selectionAnalysis.missedOpportunities.length}
- **Context Patterns Analyzed**: ${this.selectionAnalysis.contextPatterns.size}
- **Optimization Recommendations**: ${this.selectionAnalysis.optimizationRecommendations.length}

## Documented Workflows Available
${Array.from(this.documentedWorkflows).map(w => `- ${w}`).join('\n')}

## Missed Opportunities Analysis

${this.selectionAnalysis.missedOpportunities.map((opportunity, index) => `
### ${index + 1}. ${opportunity.type.replace(/_/g, ' ').toUpperCase()}
**Recommendation**: ${opportunity.recommendation}
${opportunity.workflow ? `**Workflow**: ${opportunity.workflow} (${opportunity.frequency} instances)` : ''}
${opportunity.context ? `**Context**: ${opportunity.context}` : ''}
${opportunity.alternatives ? `**Better Alternatives**: ${opportunity.alternatives.join(', ')}` : ''}
${opportunity.currentChoice ? `**Current Choice**: ${opportunity.currentChoice[0]} (${opportunity.currentChoice[1]} times)` : ''}
${opportunity.betterAlternatives ? `**Better Alternatives**: ${opportunity.betterAlternatives.map(([w, c]) => `${w}(${c})`).join(', ')}` : ''}
`).join('')}

## Context Pattern Analysis

${Array.from(this.selectionAnalysis.contextPatterns.entries())
    .filter(([context, pattern]) => pattern.workflows.size > 1)
    .map(([context, pattern]) => {
        const workflows = Array.from(pattern.workflows.entries())
            .sort((a, b) => b[1] - a[1]);
        return `
### Context: "${context}"
**Workflow Usage**: ${workflows.map(([w, c]) => `${w}(${c})`).join(', ')}
**Most Used**: ${workflows[0][0]} (${workflows[0][1]} times)
**Documented Available**: ${workflows.filter(([w]) => this.documentedWorkflows.has(w)).map(([w, c]) => `${w}(${c})`).join(', ') || 'None'}
`;
    }).join('')}

## Selection Criteria Improvements

${this.selectionAnalysis.optimizationRecommendations.map((rec, index) => `
### ${index + 1}. ${rec.type.replace(/_/g, ' ').toUpperCase()}
**Recommendation**: ${rec.recommendation}
${rec.workflow ? `**Workflow**: ${rec.workflow}` : ''}
${rec.contexts ? `**Trigger Contexts**: ${rec.contexts.join(', ')}` : ''}
${rec.decisions ? `\n**Decision Patterns**:\n${rec.decisions.map(([ctx, decision]) => 
    `- "${ctx}" → ${decision.preferred[0]} (${decision.preferred[1]} times)`
).join('\n')}` : ''}
`).join('')}

## Implementation Priorities

### High Priority (Immediate)
${this.selectionAnalysis.missedOpportunities
    .filter(o => o.type === 'freestyle_to_documented' && o.alternatives.length > 0)
    .map(o => `- ${o.recommendation}`)
    .join('\n')}

### Medium Priority (Next Version)
${this.selectionAnalysis.missedOpportunities
    .filter(o => o.type === 'undocumented_frequent' && o.frequency >= 5)
    .map(o => `- ${o.recommendation}`)
    .join('\n')}

### Low Priority (Future Enhancement)
${this.selectionAnalysis.optimizationRecommendations
    .filter(r => r.type === 'trigger_criteria')
    .map(r => `- ${r.recommendation}`)
    .join('\n')}

## Recommended Decision Tree

\`\`\`
Context Analysis → Workflow Selection
${Array.from(this.selectionAnalysis.contextPatterns.entries())
    .filter(([context, pattern]) => {
        const workflows = Array.from(pattern.workflows.entries());
        return workflows.some(([w]) => this.documentedWorkflows.has(w));
    })
    .map(([context, pattern]) => {
        const documented = Array.from(pattern.workflows.entries())
            .filter(([w]) => this.documentedWorkflows.has(w))
            .sort((a, b) => b[1] - a[1]);
        return documented.length > 0 ? 
            `"${context}" → ${documented[0][0]}` : null;
    })
    .filter(Boolean)
    .join('\n')}
\`\`\`

---
*Generated by Workflow Selection Optimizer v1.0*
*Source: v${version} audit log analysis*
`;

        return report;
    }

    async execute(version) {
        console.log(`🎯 Starting Workflow Selection Optimization for v${version}...`);

        // Step 1: Load audit data
        if (!this.loadAuditLog(version)) {
            return false;
        }

        // Step 2: Load documented workflows
        if (!this.loadDocumentedWorkflows()) {
            return false;
        }

        // Step 3: Analyze workflow selection patterns
        this.analyzeWorkflowSelection();

        // Step 4: Generate optimization report
        const report = this.generateReport(version);
        const reportPath = path.join(__dirname, '..', '..', 'docs', 'reports', `v${version}-workflow-optimization.md`);
        
        try {
            fs.writeFileSync(reportPath, report);
            console.log(`📊 Workflow optimization report saved: ${reportPath}`);
            
            console.log('\n✅ Workflow Selection Optimization Complete!');
            console.log(`🎯 Missed Opportunities: ${this.selectionAnalysis.missedOpportunities.length} | 🧩 Patterns: ${this.selectionAnalysis.contextPatterns.size} | ⚙️ Recommendations: ${this.selectionAnalysis.optimizationRecommendations.length}`);
            
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
    const optimizer = new WorkflowSelectionOptimizer();
    
    const success = await optimizer.execute(version);
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = WorkflowSelectionOptimizer;