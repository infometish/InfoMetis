#!/usr/bin/env node

/**
 * Workflow Recommendation Engine
 * Analyzes timelog patterns to recommend optimal workflows for new tasks
 */

const fs = require('fs');
const path = require('path');

class WorkflowRecommender {
    constructor() {
        this.timelogPath = path.join(__dirname, '../logs/timelog.txt');
        this.workflowMappings = {
            'SESSION_START': 'start sesame',
            'SESSION_END': 'finish sesame',
            'GIT_WORKFLOW': 'git sesame',
            'GITHUB_WORKFLOW': 'github sesame',
            'OPERATIONAL_RULES': 'rules sesame',
            'ESSENTIAL_COMMANDS': 'commands sesame',
            'RELEASE_PROCESS': 'release sesame',
            'PLANNED_VS_UNPLANNED': 'planning sesame',
            'PROJECT_AUTOMATION': 'project sesame',
            'NEXT_ISSUE': 'next sesame',
            'WORKFLOW_RECOMMENDATION': 'recommend sesame'
        };
    }

    /**
     * Parse timelog entries into structured data
     */
    parseTimelog() {
        try {
            const content = fs.readFileSync(this.timelogPath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            return lines.map(line => {
                const match = line.match(/##→(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s*\|\s*([^|]+)\s*\|\s*(.+)/);
                if (match) {
                    const [, timestamp, workflow, activity] = match;
                    const [activityType, description] = activity.split(':').map(s => s.trim());
                    
                    return {
                        timestamp: new Date(timestamp),
                        workflow: workflow.trim(),
                        activityType: activityType || 'unspecified',
                        description: description || activity,
                        raw: line
                    };
                }
                return null;
            }).filter(Boolean);
        } catch (error) {
            console.error('Error reading timelog:', error.message);
            return [];
        }
    }

    /**
     * Analyze task characteristics to determine patterns
     */
    analyzeTaskCharacteristics(description) {
        const characteristics = {
            hasIssueNumber: /#\d+/.test(description),
            isMultiStep: /implement|create|design|plan|refactor|migrate/.test(description.toLowerCase()),
            isGitRelated: /branch|commit|merge|tag|release|version/.test(description.toLowerCase()),
            isDocumentation: /document|update.*docs|readme|markdown/.test(description.toLowerCase()),
            isAnalysis: /analyze|research|investigate|study|review/.test(description.toLowerCase()),
            isProject: /project|epic|milestone|coordination/.test(description.toLowerCase()),
            isWorkflow: /workflow|process|automation/.test(description.toLowerCase()),
            isQuickFix: /fix|bug|error|quick|small/.test(description.toLowerCase())
        };

        return characteristics;
    }

    /**
     * Analyze recent session patterns for context
     */
    analyzeRecentPatterns(entries, lookbackCount = 20) {
        const recent = entries.slice(-lookbackCount);
        
        const patterns = {
            workflowFrequency: {},
            averageSessionLength: 0,
            contextSwitches: 0,
            lastWorkflow: null,
            successfulPatterns: []
        };

        // Count workflow usage
        recent.forEach(entry => {
            patterns.workflowFrequency[entry.workflow] = 
                (patterns.workflowFrequency[entry.workflow] || 0) + 1;
        });

        // Detect context switches
        let previousWorkflow = null;
        recent.forEach(entry => {
            if (previousWorkflow && previousWorkflow !== entry.workflow) {
                patterns.contextSwitches++;
            }
            previousWorkflow = entry.workflow;
        });

        // Get last workflow used
        if (recent.length > 0) {
            patterns.lastWorkflow = recent[recent.length - 1].workflow;
        }

        return patterns;
    }

    /**
     * Generate workflow recommendation based on analysis
     */
    generateRecommendation(description) {
        const entries = this.parseTimelog();
        const characteristics = this.analyzeTaskCharacteristics(description);
        const patterns = this.analyzeRecentPatterns(entries);

        let recommendation = {
            workflow: 'FREESTYLE',
            sesameAlias: null,
            confidence: 'Low',
            reasoning: [],
            alternatives: []
        };

        // Rule-based recommendation logic
        if (characteristics.hasIssueNumber) {
            recommendation.workflow = 'GITHUB_WORKFLOW';
            recommendation.confidence = 'High';
            recommendation.reasoning.push('Issue number detected - GitHub workflow recommended for proper tracking');
        } else if (characteristics.isMultiStep && !characteristics.isAnalysis) {
            recommendation.workflow = 'PLANNED_VS_UNPLANNED';
            recommendation.confidence = 'Medium';
            recommendation.reasoning.push('Multi-step implementation - planning workflow recommended');
        } else if (characteristics.isGitRelated) {
            recommendation.workflow = 'GIT_WORKFLOW';
            recommendation.confidence = 'High';
            recommendation.reasoning.push('Git-related activity - git workflow recommended for branching strategy');
        } else if (characteristics.isProject) {
            recommendation.workflow = 'PROJECT_AUTOMATION';
            recommendation.confidence = 'Medium';
            recommendation.reasoning.push('Project coordination activity - project automation recommended');
        } else if (characteristics.isWorkflow) {
            recommendation.workflow = 'FREESTYLE';
            recommendation.confidence = 'Medium';
            recommendation.reasoning.push('Workflow/process development - FREESTYLE allows for creative iteration');
        } else if (characteristics.isAnalysis || characteristics.isDocumentation) {
            recommendation.workflow = 'FREESTYLE';
            recommendation.confidence = 'Medium';
            recommendation.reasoning.push('Analysis/documentation work - FREESTYLE provides flexibility');
        }

        // Adjust based on recent patterns
        if (patterns.contextSwitches > 5) {
            recommendation.reasoning.push('High context switching detected - consider structured workflow');
            if (recommendation.workflow === 'FREESTYLE') {
                recommendation.workflow = 'PLANNED_VS_UNPLANNED';
                recommendation.confidence = 'Medium';
            }
        }

        // Set sesame alias
        recommendation.sesameAlias = this.workflowMappings[recommendation.workflow] || 'FREESTYLE';

        // Generate alternatives
        if (recommendation.workflow !== 'FREESTYLE') {
            recommendation.alternatives.push('FREESTYLE - if task scope becomes smaller than expected');
        }
        if (recommendation.workflow !== 'PLANNED_VS_UNPLANNED' && characteristics.isMultiStep) {
            recommendation.alternatives.push('planning sesame - if task requires detailed planning');
        }

        return recommendation;
    }

    /**
     * Format recommendation for display
     */
    formatRecommendation(recommendation, description) {
        const lines = [
            `🔮 Workflow Recommendation for: "${description}"`,
            '⚠️  EXPERIMENTAL - Use as suggestion only, insufficient data for fine-tuning',
            '',
            `📋 Recommended: ${recommendation.workflow}`,
            `🎯 Trigger: ${recommendation.sesameAlias}`,
            `📊 Confidence: ${recommendation.confidence}`,
            '',
            '💡 Reasoning:'
        ];

        recommendation.reasoning.forEach(reason => {
            lines.push(`   • ${reason}`);
        });

        if (recommendation.alternatives.length > 0) {
            lines.push('');
            lines.push('🔄 Alternatives:');
            recommendation.alternatives.forEach(alt => {
                lines.push(`   • ${alt}`);
            });
        }

        return lines.join('\n');
    }

    /**
     * Analyze historical effectiveness of workflow choices
     */
    analyzeHistoricalEffectiveness() {
        const entries = this.parseTimelog();
        const analysis = {
            workflowStats: {},
            totalEntries: entries.length,
            timeRange: {
                start: entries[0]?.timestamp,
                end: entries[entries.length - 1]?.timestamp
            }
        };

        // Group by workflow
        entries.forEach(entry => {
            if (!analysis.workflowStats[entry.workflow]) {
                analysis.workflowStats[entry.workflow] = {
                    count: 0,
                    activities: {},
                    outcomes: []
                };
            }
            
            const stats = analysis.workflowStats[entry.workflow];
            stats.count++;
            
            if (!stats.activities[entry.activityType]) {
                stats.activities[entry.activityType] = 0;
            }
            stats.activities[entry.activityType]++;
        });

        return analysis;
    }

    /**
     * Phase 1: Audit FREESTYLE workflow choices for optimization opportunities
     */
    auditFreestyleChoices() {
        const entries = this.parseTimelog();
        const freestyleEntries = entries.filter(entry => entry.workflow === 'FREESTYLE');
        
        console.log('🔍 Phase 1: FREESTYLE Workflow Choice Audit');
        console.log(`Total FREESTYLE entries: ${freestyleEntries.length}`);
        console.log('');

        // Group FREESTYLE activities by type
        const activityGroups = {};
        freestyleEntries.forEach(entry => {
            const characteristics = this.analyzeTaskCharacteristics(entry.description);
            let category = 'general';
            
            if (characteristics.hasIssueNumber) category = 'issue_work';
            else if (characteristics.isMultiStep) category = 'multi_step';
            else if (characteristics.isGitRelated) category = 'git_related';
            else if (characteristics.isProject) category = 'project_work';
            else if (characteristics.isAnalysis) category = 'analysis';
            else if (characteristics.isDocumentation) category = 'documentation';
            
            if (!activityGroups[category]) {
                activityGroups[category] = [];
            }
            activityGroups[category].push(entry);
        });

        // Analyze each category for potential workflow optimization
        Object.entries(activityGroups).forEach(([category, categoryEntries]) => {
            console.log(`📋 ${category.toUpperCase()} (${categoryEntries.length} entries):`);
            
            const suggestions = this.suggestWorkflowOptimizations(category, categoryEntries);
            if (suggestions.length > 0) {
                suggestions.forEach(suggestion => {
                    console.log(`   ⚠️  ${suggestion}`);
                });
            } else {
                console.log(`   ✅ FREESTYLE appears optimal for this category`);
            }
            console.log('');
        });
    }

    /**
     * Phase 2: Validate recommendation quality against actual outcomes
     */
    validateRecommendationQuality() {
        const entries = this.parseTimelog();
        
        console.log('🎯 Phase 2: Recommendation Quality Validation');
        console.log('');

        // Find entries that mention recommendations
        const recommendationEntries = entries.filter(entry => 
            entry.description.includes('recommend') || 
            entry.workflow === 'WORKFLOW_RECOMMENDATION'
        );

        if (recommendationEntries.length === 0) {
            console.log('📊 No recommendation usage data found yet');
            console.log('💡 Use the recommendation engine and track outcomes to build validation data');
            return;
        }

        // Analyze recommendation accuracy (placeholder for future implementation)
        console.log(`📈 Recommendation entries found: ${recommendationEntries.length}`);
        console.log('🔧 Validation logic will be enhanced as usage data accumulates');
        
        // Future enhancement: Compare recommended vs actual workflows and outcomes
        console.log('');
        console.log('🎯 Future validation metrics:');
        console.log('   • Recommendation acceptance rate');
        console.log('   • Outcome quality when following recommendations');
        console.log('   • Pattern identification for poor recommendations');
        console.log('   • Data quality scoring for training exclusions');
    }

    /**
     * Suggest workflow optimizations for FREESTYLE categories
     */
    suggestWorkflowOptimizations(category, entries) {
        const suggestions = [];
        
        switch (category) {
            case 'issue_work':
                suggestions.push('Consider using `github sesame` for better issue tracking integration');
                break;
            case 'multi_step':
                suggestions.push('Consider using `planning sesame` for complex implementations');
                break;
            case 'git_related':
                suggestions.push('Consider using `git sesame` for proper branching strategy');
                break;
            case 'project_work':
                suggestions.push('Consider using `project sesame` for cross-epic coordination');
                break;
            case 'analysis':
            case 'documentation':
                // These are often best in FREESTYLE
                break;
            default:
                if (entries.length > 10) {
                    suggestions.push('High FREESTYLE usage - consider if patterns exist for structured workflows');
                }
        }
        
        return suggestions;
    }

    /**
     * CLI interface
     */
    run() {
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'recommend':
                const description = args.slice(1).join(' ');
                if (!description) {
                    console.log('Usage: node workflow-recommender.js recommend "task description"');
                    process.exit(1);
                }
                const recommendation = this.generateRecommendation(description);
                console.log(this.formatRecommendation(recommendation, description));
                break;

            case 'analyze':
                const analysis = this.analyzeHistoricalEffectiveness();
                console.log('📊 Historical Workflow Analysis:');
                console.log(`Total entries: ${analysis.totalEntries}`);
                console.log('');
                Object.entries(analysis.workflowStats)
                    .sort(([,a], [,b]) => b.count - a.count)
                    .forEach(([workflow, stats]) => {
                        console.log(`${workflow}: ${stats.count} entries`);
                        const topActivities = Object.entries(stats.activities)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3);
                        topActivities.forEach(([activity, count]) => {
                            console.log(`   • ${activity}: ${count}`);
                        });
                    });
                break;

            case 'patterns':
                const entries = this.parseTimelog();
                const patterns = this.analyzeRecentPatterns(entries, 30);
                console.log('🔍 Recent Session Patterns:');
                console.log(`Context switches: ${patterns.contextSwitches}`);
                console.log(`Last workflow: ${patterns.lastWorkflow}`);
                console.log('');
                console.log('Workflow frequency:');
                Object.entries(patterns.workflowFrequency)
                    .sort(([,a], [,b]) => b - a)
                    .forEach(([workflow, count]) => {
                        console.log(`   • ${workflow}: ${count}`);
                    });
                break;

            case 'audit-freestyle':
                this.auditFreestyleChoices();
                break;

            case 'validate-recommendations':
                this.validateRecommendationQuality();
                break;

            default:
                console.log('Workflow Recommendation Engine');
                console.log('');
                console.log('Commands:');
                console.log('  recommend "description"      - Get workflow recommendation for a task');
                console.log('  analyze                      - Show historical workflow effectiveness');
                console.log('  patterns                     - Show recent session patterns');
                console.log('  audit-freestyle             - Phase 1: Audit FREESTYLE choices for optimization');
                console.log('  validate-recommendations    - Phase 2: Validate recommendation quality');
                console.log('');
                console.log('Examples:');
                console.log('  node workflow-recommender.js recommend "implement user authentication #45"');
                console.log('  node workflow-recommender.js recommend "analyze API performance issues"');
                console.log('');
                console.log('Tweaking Commands:');
                console.log('  node workflow-recommender.js audit-freestyle');
                console.log('  node workflow-recommender.js validate-recommendations');
        }
    }
}

// Run if called directly
if (require.main === module) {
    const recommender = new WorkflowRecommender();
    recommender.run();
}

module.exports = WorkflowRecommender;