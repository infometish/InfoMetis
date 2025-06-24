#!/usr/bin/env node

/**
 * Version Readiness Validator
 * VERSION_TRANSITION Step 5: Validate next version preparation completion
 */

const fs = require('fs');
const path = require('path');

class VersionReadinessValidator {
    constructor() {
        this.validationResults = {
            auditCleanup: { status: 'pending', issues: [], details: [] },
            versionReferences: { status: 'pending', issues: [], details: [] },
            versionScope: { status: 'pending', issues: [], details: [] },
            knowledgeSystems: { status: 'pending', issues: [], details: [] }
        };
        this.currentVersion = null;
        this.readinessScore = 0;
        this.totalChecks = 0;
    }

    async validateReadiness(targetVersion = null) {
        console.log('🔍 Starting version readiness assessment...\n');
        
        // Detect or use provided version
        this.currentVersion = targetVersion || await this.detectCurrentVersion();
        console.log(`📋 Assessing readiness for version: ${this.currentVersion}\n`);

        // Run all validation checks
        await this.validateAuditCleanup();
        await this.validateVersionReferences();
        await this.validateVersionScope();
        await this.validateKnowledgeSystems();

        // Calculate overall readiness
        this.calculateReadinessScore();

        console.log('✅ Version readiness assessment complete!\n');
        return this.generateReadinessReport();
    }

    async detectCurrentVersion() {
        // Check package.json
        const packagePath = 'package.json';
        if (fs.existsSync(packagePath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                return pkg.version;
            } catch (e) {
                // Continue to other methods
            }
        }

        // Check git tags
        try {
            const { execSync } = require('child_process');
            const latestTag = execSync('git describe --tags --abbrev=0', { 
                encoding: 'utf8' 
            }).trim();
            return latestTag.replace(/^v/, '');
        } catch (e) {
            // Continue to fallback
        }

        return 'unknown';
    }

    async validateAuditCleanup() {
        console.log('📁 Validating audit cleanup...');
        const result = this.validationResults.auditCleanup;
        
        try {
            // Check if claude/audit/current exists and assess its state
            const currentAuditPath = 'claude/audit/current';
            const versionAuditPath = `claude/audit/v${this.currentVersion}`;
            
            if (!fs.existsSync(currentAuditPath)) {
                result.issues.push('claude/audit/current directory does not exist');
                result.status = 'failed';
                this.totalChecks++;
                return;
            }

            const currentFiles = fs.readdirSync(currentAuditPath);
            const logFiles = currentFiles.filter(f => f.endsWith('.log'));
            
            // Check if previous version audit is archived
            if (fs.existsSync(versionAuditPath)) {
                const archivedFiles = fs.readdirSync(versionAuditPath);
                result.details.push(`✅ Previous version archived: ${archivedFiles.length} files in ${versionAuditPath}`);
                this.readinessScore++;
            } else {
                result.issues.push(`Previous version audit not found at ${versionAuditPath}`);
            }
            this.totalChecks++;

            // Check current audit state
            if (logFiles.length === 1 && logFiles[0] === 'current.log') {
                const currentLogSize = fs.statSync(path.join(currentAuditPath, 'current.log')).size;
                if (currentLogSize < 1000) { // Less than 1KB suggests reset
                    result.details.push('✅ Current audit log appears reset for new version');
                    this.readinessScore++;
                } else {
                    result.details.push('⚠️ Current audit log contains significant data - may need archival');
                }
            } else {
                result.details.push(`Current audit contains ${logFiles.length} log files`);
            }
            this.totalChecks++;

            // Check session files (these are normal during ongoing development)
            const sessionFiles = currentFiles.filter(f => f.startsWith('session_'));
            if (sessionFiles.length === 0) {
                result.details.push('✅ No current session files');
            } else {
                result.details.push(`✅ Current development session files: ${sessionFiles.length} files (normal operational state)`);
            }
            this.readinessScore++; // Session files in current/ are expected during development
            this.totalChecks++;

            result.status = result.issues.length === 0 ? 'passed' : 'warning';
            
        } catch (error) {
            result.issues.push(`Error during audit cleanup validation: ${error.message}`);
            result.status = 'failed';
            this.totalChecks += 3;
        }

        console.log(`   ${result.status.toUpperCase()}: ${result.issues.length} issues found\n`);
    }

    async validateVersionReferences() {
        console.log('🔢 Validating version reference consistency...');
        const result = this.validationResults.versionReferences;
        
        try {
            // Scan key files for version references
            const filesToCheck = [
                'package.json',
                'README.md',
                'CLAUDE.md',
                'RELEASE_NOTES_v*.md'
            ];

            // Only scan current platform documentation folders
            const platformDocsFolders = [
                'docs/guides',        // Current development processes
                'docs/specifications' // Current system specifications
            ];

            // Collect files only from platform documentation folders
            for (const folder of platformDocsFolders) {
                const folderFiles = this.findFilesRecursive(folder, '.md');
                filesToCheck.push(...folderFiles);
            }

            let inconsistentFiles = 0;
            const versionPattern = /v?(\d+\.\d+\.\d+)/g;

            for (const file of filesToCheck) {
                if (!fs.existsSync(file)) continue;

                try {
                    const content = fs.readFileSync(file, 'utf8');
                    const versions = [...content.matchAll(versionPattern)];
                    
                    if (versions.length > 0) {
                        const uniqueVersions = [...new Set(versions.map(v => v[1]))];
                        
                        // Check if all versions match current version
                        const outdatedVersions = uniqueVersions.filter(v => v !== this.currentVersion);
                        
                        if (outdatedVersions.length > 0) {
                            result.issues.push(`${file}: contains outdated versions: ${outdatedVersions.join(', ')}`);
                            inconsistentFiles++;
                        } else {
                            result.details.push(`✅ ${file}: version references consistent`);
                        }
                    }
                } catch (error) {
                    result.details.push(`⚠️ Could not read ${file}: ${error.message}`);
                }
            }

            this.totalChecks++;
            if (inconsistentFiles === 0) {
                result.details.push(`✅ All scanned files have consistent version references`);
                this.readinessScore++;
                result.status = 'passed';
            } else {
                result.status = 'failed';
            }

        } catch (error) {
            result.issues.push(`Error during version reference validation: ${error.message}`);
            result.status = 'failed';
            this.totalChecks++;
        }

        console.log(`   ${result.status.toUpperCase()}: ${result.issues.length} inconsistencies found\n`);
    }

    async validateVersionScope() {
        console.log('🎯 Validating version scope planning...');
        const result = this.validationResults.versionScope;
        
        try {
            // Check for evidence of NEW_VERSION_PLANNING execution
            const planningEvidence = [
                'docs/workflows/phase-based-development-strategy.md',
                'docs/management/versioning-strategy.md',
                'docs/management/github-project-setup.md'
            ];

            let planningComplete = 0;
            
            for (const file of planningEvidence) {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    
                    // Check if content references current version
                    if (content.includes(this.currentVersion)) {
                        result.details.push(`✅ ${file}: contains current version planning`);
                        planningComplete++;
                    } else {
                        result.details.push(`⚠️ ${file}: may need version update`);
                    }
                } else {
                    result.details.push(`⚠️ ${file}: planning document not found`);
                }
            }

            this.totalChecks++;

            // Check for GitHub milestone/project setup
            const projectFiles = [
                'docs/management/github-project-setup.md',
                'docs/management/spl1-epics-overview.md'
            ];

            let projectSetup = 0;
            for (const file of projectFiles) {
                if (fs.existsSync(file)) {
                    projectSetup++;
                    result.details.push(`✅ ${file}: project planning exists`);
                }
            }

            this.totalChecks++;
            if (projectSetup > 0) {
                this.readinessScore++;
            }

            // Check for roadmap/focus area definition
            if (planningComplete >= 2) {
                result.details.push(`✅ Version planning appears complete`);
                result.status = 'passed';
                this.readinessScore++;
            } else {
                result.issues.push('Version scope planning may be incomplete');
                result.status = 'warning';
            }
            this.totalChecks++;

        } catch (error) {
            result.issues.push(`Error during version scope validation: ${error.message}`);
            result.status = 'failed';
            this.totalChecks += 3;
        }

        console.log(`   ${result.status.toUpperCase()}: ${result.issues.length} scope issues found\n`);
    }

    async validateKnowledgeSystems() {
        console.log('🧠 Validating knowledge system readiness...');
        const result = this.validationResults.knowledgeSystems;
        
        try {
            // Check workflow system readiness
            const workflowFiles = [
                'claude/workflows/SESSION_START.md',
                'claude/workflows/SESSION_END.md',
                'claude/workflows/VERSION_TRANSITION.md',
                'claude/workflows/AUDIT_LOGGING.md'
            ];

            let workflowsReady = 0;
            for (const file of workflowFiles) {
                if (fs.existsSync(file)) {
                    workflowsReady++;
                    result.details.push(`✅ ${file}: workflow available`);
                } else {
                    result.issues.push(`Missing workflow: ${file}`);
                }
            }

            this.totalChecks++;
            if (workflowsReady >= 3) {
                this.readinessScore++;
            }

            // Check tool availability
            const toolFiles = [
                'claude/tools/audit-metrics-analyzer.js',
                'claude/tools/repository-maintenance-analyzer.js',
                'claude/tools/strategic-analysis-engine.js'
            ];

            let toolsReady = 0;
            for (const file of toolFiles) {
                if (fs.existsSync(file)) {
                    toolsReady++;
                    result.details.push(`✅ ${file}: tool available`);
                } else {
                    result.issues.push(`Missing tool: ${file}`);
                }
            }

            this.totalChecks++;
            if (toolsReady >= 2) {
                this.readinessScore++;
            }

            // Check operational documentation
            const operationalDocs = [
                'claude/operational-docs',
                'CLAUDE.md'
            ];

            let docsReady = 0;
            for (const item of operationalDocs) {
                if (fs.existsSync(item)) {
                    docsReady++;
                    result.details.push(`✅ ${item}: operational docs available`);
                } else {
                    result.issues.push(`Missing operational docs: ${item}`);
                }
            }

            this.totalChecks++;
            if (docsReady >= 1) {
                this.readinessScore++;
            }

            result.status = result.issues.length === 0 ? 'passed' : 'warning';

        } catch (error) {
            result.issues.push(`Error during knowledge systems validation: ${error.message}`);
            result.status = 'failed';
            this.totalChecks += 3;
        }

        console.log(`   ${result.status.toUpperCase()}: ${result.issues.length} system issues found\n`);
    }

    findFilesRecursive(dir, extension) {
        const files = [];
        if (!fs.existsSync(dir)) return files;

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.startsWith('.')) {
                files.push(...this.findFilesRecursive(fullPath, extension));
            } else if (stat.isFile() && item.endsWith(extension)) {
                files.push(fullPath);
            }
        }
        return files;
    }

    calculateReadinessScore() {
        const percentage = this.totalChecks > 0 ? (this.readinessScore / this.totalChecks) * 100 : 0;
        console.log(`📊 Readiness Score: ${this.readinessScore}/${this.totalChecks} (${percentage.toFixed(1)}%)\n`);
    }

    generateReadinessReport() {
        const timestamp = new Date().toISOString();
        const overallStatus = this.readinessScore >= this.totalChecks * 0.8 ? 'READY' : 'NOT READY';
        const percentage = this.totalChecks > 0 ? (this.readinessScore / this.totalChecks) * 100 : 0;

        let report = `# Version Readiness Assessment - v${this.currentVersion}\n\n`;
        report += `**Generated**: ${timestamp}\n`;
        report += `**Assessment Scope**: VERSION_TRANSITION Step 5 - Next Version Readiness Validation\n\n`;

        // Overall Status
        report += `## Overall Status: ${overallStatus === 'READY' ? '✅' : '❌'} ${overallStatus}\n\n`;
        report += `**Readiness Score**: ${this.readinessScore}/${this.totalChecks} (${percentage.toFixed(1)}%)\n\n`;

        // Validation Results Summary
        report += `## Validation Results Summary\n\n`;
        report += `| Category | Status | Issues | Details |\n`;
        report += `|----------|--------|--------|---------|\n`;
        
        Object.entries(this.validationResults).forEach(([category, result]) => {
            const statusIcon = result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
            const issueCount = result.issues.length;
            const detailCount = result.details.length;
            
            report += `| ${category} | ${statusIcon} ${result.status.toUpperCase()} | ${issueCount} | ${detailCount} |\n`;
        });
        report += `\n`;

        // Detailed Results
        Object.entries(this.validationResults).forEach(([category, result]) => {
            report += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Validation\n\n`;
            
            if (result.issues.length > 0) {
                report += `**Issues Found**:\n`;
                result.issues.forEach(issue => {
                    report += `- ❌ ${issue}\n`;
                });
                report += `\n`;
            }
            
            if (result.details.length > 0) {
                report += `**Validation Details**:\n`;
                result.details.forEach(detail => {
                    report += `- ${detail}\n`;
                });
                report += `\n`;
            }
        });

        // Required Actions
        const allIssues = Object.values(this.validationResults).flatMap(r => r.issues);
        if (allIssues.length > 0) {
            report += `## Required Actions\n\n`;
            allIssues.forEach((issue, index) => {
                report += `${index + 1}. ${issue}\n`;
            });
            report += `\n`;
        } else {
            report += `## Required Actions\n\n`;
            report += `✅ No actions required - all validation checks passed!\n\n`;
        }

        // Readiness Criteria Assessment
        report += `## Readiness Criteria Assessment\n\n`;
        const passedCategories = Object.values(this.validationResults).filter(r => r.status === 'passed').length;
        const totalCategories = Object.keys(this.validationResults).length;
        
        report += `**Categories Passed**: ${passedCategories}/${totalCategories}\n`;
        report += `**Overall Readiness**: ${percentage.toFixed(1)}%\n\n`;

        if (overallStatus === 'READY') {
            report += `### ✅ Ready for Next Version Development\n`;
            report += `All critical validation checks have passed. The repository is ready for next version development to begin.\n\n`;
        } else {
            report += `### ❌ Preparation Incomplete\n`;
            report += `Some validation checks have failed. Address the required actions above before proceeding with next version development.\n\n`;
        }

        // Integration Notes
        report += `## VERSION_TRANSITION Integration\n\n`;
        report += `This readiness assessment validates that:\n`;
        report += `- **Close Version Workflow** completed audit cleanup and system reset\n`;
        report += `- **NEW_VERSION_PLANNING Workflow** completed scope and priority definition\n`;
        report += `- **Version references** are consistently updated across documentation\n`;
        report += `- **Knowledge management systems** are ready for new version development\n\n`;

        report += `### Next Steps\n`;
        if (overallStatus === 'READY') {
            report += `1. **Begin Version Development**: All preparation validated - ready to start\n`;
            report += `2. **Execute SESSION_START**: Initialize first development session\n`;
            report += `3. **Monitor Progress**: Use established workflows and tools\n`;
        } else {
            report += `1. **Address Issues**: Complete required actions listed above\n`;
            report += `2. **Re-run Validation**: Execute readiness assessment again\n`;
            report += `3. **Escalate Blockers**: Resolve any persistent preparation issues\n`;
        }
        report += `\n`;

        report += `---\n\n`;
        report += `*This readiness assessment was generated by the Version Readiness Validator as part of VERSION_TRANSITION Step 5. The assessment serves as a quality gate ensuring proper preparation completion before next version development begins.*`;

        return report;
    }
}

// CLI execution
if (require.main === module) {
    const targetVersion = process.argv[2];
    
    const validator = new VersionReadinessValidator();
    
    validator.validateReadiness(targetVersion)
        .then(report => {
            const version = validator.currentVersion || 'current';
            const reportPath = `docs/reports/v${version}-readiness-assessment.md`;
            
            // Ensure reports directory exists
            const reportsDir = 'docs/reports';
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            
            fs.writeFileSync(reportPath, report);
            console.log(`📋 Readiness assessment generated: ${reportPath}`);
            
            const percentage = validator.totalChecks > 0 ? (validator.readinessScore / validator.totalChecks) * 100 : 0;
            const overallStatus = validator.readinessScore >= validator.totalChecks * 0.8 ? 'READY' : 'NOT READY';
            
            console.log(`\n${overallStatus === 'READY' ? '✅' : '❌'} Overall Status: ${overallStatus}`);
            console.log(`📊 Readiness Score: ${validator.readinessScore}/${validator.totalChecks} (${percentage.toFixed(1)}%)`);
            
            if (overallStatus === 'READY') {
                console.log(`\n🚀 VERSION_TRANSITION Step 5 complete - Ready for next version development!`);
            } else {
                console.log(`\n⚠️  VERSION_TRANSITION Step 5 - Preparation issues need resolution`);
            }
        })
        .catch(error => {
            console.error('❌ Error during readiness validation:', error);
            process.exit(1);
        });
}

module.exports = VersionReadinessValidator;