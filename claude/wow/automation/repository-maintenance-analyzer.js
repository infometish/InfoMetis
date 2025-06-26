#!/usr/bin/env node

/**
 * Repository Maintenance Analyzer
 * Analyzes repository for maintenance needs: stale content, broken links, temporary content, consistency issues
 */

const fs = require('fs');
const path = require('path');

class RepositoryMaintenanceAnalyzer {
    constructor() {
        this.maintenanceTasks = {
            staleContent: [],
            brokenReferences: [],
            temporaryContent: [],
            consistencyIssues: []
        };
        this.scannedFiles = [];
        this.currentVersion = null;
        this.reportData = {
            summary: {},
            highPriority: [],
            mediumPriority: [],
            lowPriority: []
        };
    }

    async analyzeRepository(repositoryPath = '.') {
        console.log('🔍 Starting repository maintenance analysis...\n');
        
        // Detect current version
        this.currentVersion = await this.detectCurrentVersion(repositoryPath);
        console.log(`📋 Detected current version: ${this.currentVersion || 'unknown'}\n`);

        // Scan repository structure
        await this.scanRepositoryFiles(repositoryPath);
        console.log(`📁 Scanned ${this.scannedFiles.length} files\n`);

        // Run analysis categories
        await this.analyzeStaleContent();
        await this.validateFileReferences();
        await this.identifyTemporaryContent();
        await this.validateConsistency();

        // Generate prioritized tasks
        this.prioritizeTasks();

        // Generate both reports
        const summaryReport = this.generateSummaryReport();
        const operationalDoc = this.generateOperationalDocument();
        
        return { summaryReport, operationalDoc };
    }

    async detectCurrentVersion(repositoryPath) {
        // Check package.json for version
        const packagePath = path.join(repositoryPath, 'package.json');
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
                cwd: repositoryPath, 
                encoding: 'utf8' 
            }).trim();
            return latestTag.replace(/^v/, '');
        } catch (e) {
            // Continue to other methods
        }

        // Check audit logs for version references
        const auditCurrentPath = path.join(repositoryPath, 'audit', 'current');
        if (fs.existsSync(auditCurrentPath)) {
            const files = fs.readdirSync(auditCurrentPath);
            for (const file of files) {
                if (file.endsWith('.log')) {
                    const content = fs.readFileSync(path.join(auditCurrentPath, file), 'utf8');
                    const versionMatch = content.match(/v?(\d+\.\d+\.\d+)/);
                    if (versionMatch) {
                        return versionMatch[1];
                    }
                }
            }
        }

        return null;
    }

    async scanRepositoryFiles(repositoryPath) {
        const extensions = ['.md', '.js', '.json', '.txt', '.yml', '.yaml'];
        const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.vscode'];

        const scanDir = (dirPath) => {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const relativePath = path.relative(repositoryPath, fullPath);
                
                if (ignoreDirs.some(ignore => relativePath.includes(ignore))) {
                    continue;
                }
                
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else if (extensions.some(ext => item.endsWith(ext))) {
                    this.scannedFiles.push({
                        fullPath,
                        relativePath,
                        extension: path.extname(item),
                        lastModified: stat.mtime,
                        size: stat.size
                    });
                }
            }
        };

        scanDir(repositoryPath);
    }

    async analyzeStaleContent() {
        console.log('🗑️  Analyzing stale content...');
        
        for (const file of this.scannedFiles) {
            if (file.extension !== '.md') continue;
            
            try {
                const content = fs.readFileSync(file.fullPath, 'utf8');
                const lines = content.split('\n');
                
                // Check for outdated version references
                lines.forEach((line, index) => {
                    // Version number patterns
                    const versionMatches = line.match(/v?(\d+\.\d+\.\d+)/g);
                    if (versionMatches) {
                        versionMatches.forEach(version => {
                            const cleanVersion = version.replace(/^v/, '');
                            if (this.currentVersion && cleanVersion !== this.currentVersion) {
                                this.maintenanceTasks.staleContent.push({
                                    type: 'outdated_version_reference',
                                    file: file.relativePath,
                                    line: index + 1,
                                    content: line.trim(),
                                    issue: `Outdated version reference: ${version}`,
                                    suggestion: `Update to current version: v${this.currentVersion}`
                                });
                            }
                        });
                    }
                    
                    // TODO/FIXME that might be completed
                    // Only flag actual TODO/FIXME comments, not words in filenames or content
                    if (line.match(/^\s*[\/\*#]*\s*(TODO|FIXME|XXX|HACK)\s*[:]/i)) {
                        this.maintenanceTasks.staleContent.push({
                            type: 'todo_comment',
                            file: file.relativePath,
                            line: index + 1,
                            content: line.trim(),
                            issue: 'TODO/FIXME comment may be outdated',
                            suggestion: 'Review if still relevant or can be removed'
                        });
                    }
                    
                    // Experimental/temporary markers
                    if (line.match(/experimental|temporary|draft|wip|prototype/i)) {
                        this.maintenanceTasks.staleContent.push({
                            type: 'experimental_marker',
                            file: file.relativePath,
                            line: index + 1,
                            content: line.trim(),
                            issue: 'Experimental/temporary marker found',
                            suggestion: 'Review if content is now permanent or should be archived'
                        });
                    }
                });

                // Check file age (not modified in 60+ days might be stale)
                const daysSinceModified = (Date.now() - file.lastModified.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceModified > 60) {
                    this.maintenanceTasks.staleContent.push({
                        type: 'old_file',
                        file: file.relativePath,
                        line: null,
                        content: `Last modified: ${file.lastModified.toLocaleDateString()}`,
                        issue: `File not modified in ${Math.round(daysSinceModified)} days`,
                        suggestion: 'Review if content is still relevant or should be archived'
                    });
                }
                
            } catch (error) {
                console.warn(`⚠️  Could not read file: ${file.relativePath}`);
            }
        }
        
        console.log(`   Found ${this.maintenanceTasks.staleContent.length} stale content issues\n`);
    }

    async validateFileReferences() {
        console.log('🔗 Validating file references...');
        
        for (const file of this.scannedFiles) {
            if (file.extension !== '.md') continue;
            
            try {
                const content = fs.readFileSync(file.fullPath, 'utf8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    // Markdown links [text](path)
                    const mdLinks = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
                    if (mdLinks) {
                        mdLinks.forEach(link => {
                            const pathMatch = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
                            if (pathMatch) {
                                const linkPath = pathMatch[2];
                                
                                // Skip external URLs
                                if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
                                    return;
                                }
                                
                                // Check if file exists
                                const resolvedPath = path.resolve(path.dirname(file.fullPath), linkPath.split('#')[0]);
                                if (!fs.existsSync(resolvedPath)) {
                                    this.maintenanceTasks.brokenReferences.push({
                                        type: 'broken_link',
                                        file: file.relativePath,
                                        line: index + 1,
                                        content: line.trim(),
                                        issue: `Broken link: ${linkPath}`,
                                        suggestion: 'Update path or remove broken link'
                                    });
                                }
                            }
                        });
                    }
                    
                    // File path references in backticks
                    const pathRefs = line.match(/`([^`]*\.[a-zA-Z]{2,4})`/g);
                    if (pathRefs) {
                        pathRefs.forEach(ref => {
                            const filePath = ref.slice(1, -1); // Remove backticks
                            
                            // Skip if it looks like a command or URL
                            if (filePath.includes(' ') || filePath.startsWith('http')) {
                                return;
                            }
                            
                            const resolvedPath = path.resolve(path.dirname(file.fullPath), filePath);
                            if (!fs.existsSync(resolvedPath)) {
                                // Try from repository root
                                const rootPath = path.resolve('.', filePath);
                                if (!fs.existsSync(rootPath)) {
                                    this.maintenanceTasks.brokenReferences.push({
                                        type: 'broken_file_reference',
                                        file: file.relativePath,
                                        line: index + 1,
                                        content: line.trim(),
                                        issue: `File reference not found: ${filePath}`,
                                        suggestion: 'Update path or verify file exists'
                                    });
                                }
                            }
                        });
                    }
                });
                
            } catch (error) {
                console.warn(`⚠️  Could not validate references in: ${file.relativePath}`);
            }
        }
        
        console.log(`   Found ${this.maintenanceTasks.brokenReferences.length} broken reference issues\n`);
    }

    async identifyTemporaryContent() {
        console.log('📦 Identifying temporary content...');
        
        for (const file of this.scannedFiles) {
            // Check filename patterns
            const filename = path.basename(file.relativePath);
            const dirname = path.dirname(file.relativePath);
            
            // Temporary file patterns
            if (filename.match(/(temp|tmp|draft|wip|test|example|prototype|experimental)/i)) {
                this.maintenanceTasks.temporaryContent.push({
                    type: 'temporary_filename',
                    file: file.relativePath,
                    line: null,
                    content: `Filename: ${filename}`,
                    issue: 'File has temporary naming pattern',
                    suggestion: 'Review if content should be archived or renamed'
                });
            }
            
            // Files in temporary directories
            if (dirname.match(/(temp|tmp|draft|examples|prototypes|experimental)/i)) {
                this.maintenanceTasks.temporaryContent.push({
                    type: 'temporary_directory',
                    file: file.relativePath,
                    line: null,
                    content: `Directory: ${dirname}`,
                    issue: 'File in temporary directory',
                    suggestion: 'Consider moving to appropriate permanent location or archive'
                });
            }
            
            // Content analysis for markdown files
            if (file.extension === '.md') {
                try {
                    const content = fs.readFileSync(file.fullPath, 'utf8');
                    
                    // Check for draft/WIP indicators in content
                    if (content.match(/\b(draft|work in progress|wip|unfinished|incomplete)\b/i)) {
                        this.maintenanceTasks.temporaryContent.push({
                            type: 'draft_content',
                            file: file.relativePath,
                            line: null,
                            content: 'Contains draft/WIP indicators',
                            issue: 'Document marked as draft or work-in-progress',
                            suggestion: 'Review completion status and update or archive'
                        });
                    }
                    
                    // Version-specific content
                    if (content.match(/for version \d+\.\d+/i) || content.match(/v\d+\.\d+ specific/i)) {
                        this.maintenanceTasks.temporaryContent.push({
                            type: 'version_specific',
                            file: file.relativePath,
                            line: null,
                            content: 'Contains version-specific information',
                            issue: 'Version-specific content may need archiving',
                            suggestion: 'Consider archiving if version is completed'
                        });
                    }
                } catch (error) {
                    // Skip if cannot read
                }
            }
        }
        
        console.log(`   Found ${this.maintenanceTasks.temporaryContent.length} temporary content issues\n`);
    }

    async validateConsistency() {
        console.log('📏 Validating consistency...');
        
        const terminologyMap = new Map();
        const formattingIssues = [];
        
        for (const file of this.scannedFiles) {
            if (file.extension !== '.md') continue;
            
            try {
                const content = fs.readFileSync(file.fullPath, 'utf8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    // Check for inconsistent terminology
                    const terms = ['workflow', 'todo', 'audit log', 'repository'];
                    terms.forEach(term => {
                        // Look for variations in capitalization
                        const variations = [
                            term,
                            term.toUpperCase(),
                            term.charAt(0).toUpperCase() + term.slice(1),
                            term.replace(' ', '-'),
                            term.replace(' ', '_')
                        ];
                        
                        variations.forEach(variation => {
                            if (line.toLowerCase().includes(variation.toLowerCase()) && variation !== term) {
                                if (!terminologyMap.has(term)) {
                                    terminologyMap.set(term, new Set());
                                }
                                terminologyMap.get(term).add(variation);
                            }
                        });
                    });
                    
                    // Check markdown formatting consistency
                    
                    // Headers without space after #
                    if (line.match(/^#+[^\s]/)) {
                        formattingIssues.push({
                            type: 'header_formatting',
                            file: file.relativePath,
                            line: index + 1,
                            content: line.trim(),
                            issue: 'Header missing space after #',
                            suggestion: 'Add space after # for proper markdown formatting'
                        });
                    }
                    
                    // Code blocks without language specification
                    if (line.trim() === '```' && index > 0) {
                        formattingIssues.push({
                            type: 'code_block_formatting',
                            file: file.relativePath,
                            line: index + 1,
                            content: line.trim(),
                            issue: 'Code block without language specification',
                            suggestion: 'Add language identifier for syntax highlighting'
                        });
                    }
                    
                    // Lists with inconsistent bullet styles
                    if (line.match(/^\s*[*+-]\s/)) {
                        const bullet = line.match(/^\s*([*+-])/)[1];
                        // This would need more context to detect inconsistencies
                    }
                });
                
            } catch (error) {
                console.warn(`⚠️  Could not validate consistency in: ${file.relativePath}`);
            }
        }
        
        // Add terminology inconsistencies to issues
        terminologyMap.forEach((variations, term) => {
            if (variations.size > 1) {
                this.maintenanceTasks.consistencyIssues.push({
                    type: 'terminology_inconsistency',
                    file: 'multiple files',
                    line: null,
                    content: `Term: ${term}`,
                    issue: `Inconsistent usage: ${Array.from(variations).join(', ')}`,
                    suggestion: `Standardize on: ${term}`
                });
            }
        });
        
        // Add formatting issues
        this.maintenanceTasks.consistencyIssues.push(...formattingIssues);
        
        console.log(`   Found ${this.maintenanceTasks.consistencyIssues.length} consistency issues\n`);
    }

    prioritizeTasks() {
        console.log('📊 Prioritizing maintenance tasks...');
        
        const allTasks = [
            ...this.maintenanceTasks.staleContent,
            ...this.maintenanceTasks.brokenReferences,
            ...this.maintenanceTasks.temporaryContent,
            ...this.maintenanceTasks.consistencyIssues
        ];
        
        allTasks.forEach(task => {
            // High priority: broken links, outdated version refs in user docs
            if (task.type === 'broken_link' || 
                (task.type === 'outdated_version_reference' && task.file.startsWith('docs/'))) {
                this.reportData.highPriority.push(task);
            }
            // Medium priority: temporary content, TODO comments
            else if (task.type === 'temporary_filename' || 
                     task.type === 'todo_comment' || 
                     task.type === 'draft_content') {
                this.reportData.mediumPriority.push(task);
            }
            // Low priority: formatting, old files
            else {
                this.reportData.lowPriority.push(task);
            }
        });
        
        this.reportData.summary = {
            totalTasks: allTasks.length,
            highPriority: this.reportData.highPriority.length,
            mediumPriority: this.reportData.mediumPriority.length,
            lowPriority: this.reportData.lowPriority.length,
            staleContent: this.maintenanceTasks.staleContent.length,
            brokenReferences: this.maintenanceTasks.brokenReferences.length,
            temporaryContent: this.maintenanceTasks.temporaryContent.length,
            consistencyIssues: this.maintenanceTasks.consistencyIssues.length
        };
        
        console.log(`   Prioritized ${allTasks.length} total tasks\n`);
    }

    generateSummaryReport() {
        const timestamp = new Date().toISOString();
        const version = this.currentVersion || 'unknown';
        
        let report = `# Repository Maintenance Report - v${version}\n\n`;
        report += `**Generated**: ${timestamp}\n`;
        report += `**Repository Version**: ${version}\n`;
        report += `**Files Scanned**: ${this.scannedFiles.length}\n\n`;
        
        // Executive Summary
        report += `## Executive Summary\n\n`;
        report += `**Total Maintenance Tasks**: ${this.reportData.summary.totalTasks}\n\n`;
        report += `| Priority | Count | Percentage |\n`;
        report += `|----------|-------|------------|\n`;
        report += `| High     | ${this.reportData.summary.highPriority} | ${((this.reportData.summary.highPriority / this.reportData.summary.totalTasks) * 100).toFixed(1)}% |\n`;
        report += `| Medium   | ${this.reportData.summary.mediumPriority} | ${((this.reportData.summary.mediumPriority / this.reportData.summary.totalTasks) * 100).toFixed(1)}% |\n`;
        report += `| Low      | ${this.reportData.summary.lowPriority} | ${((this.reportData.summary.lowPriority / this.reportData.summary.totalTasks) * 100).toFixed(1)}% |\n\n`;
        
        // Category Breakdown
        report += `### Category Breakdown\n\n`;
        report += `- **Stale Content**: ${this.reportData.summary.staleContent} issues\n`;
        report += `- **Broken References**: ${this.reportData.summary.brokenReferences} issues\n`;
        report += `- **Temporary Content**: ${this.reportData.summary.temporaryContent} issues\n`;
        report += `- **Consistency Issues**: ${this.reportData.summary.consistencyIssues} issues\n\n`;
        
        // High Priority Tasks
        if (this.reportData.highPriority.length > 0) {
            report += `## High Priority Tasks (${this.reportData.highPriority.length})\n\n`;
            report += `*These issues affect navigation, user experience, or critical documentation.*\n\n`;
            report += `| File | Line | Type | Issue | Content | Suggestion |\n`;
            report += `|------|------|------|-------|---------|------------|\n`;
            this.reportData.highPriority.forEach(task => {
                const line = task.line ? task.line : '-';
                const content = task.content.replace(/\|/g, '\\|').substring(0, 50) + (task.content.length > 50 ? '...' : '');
                const suggestion = task.suggestion.replace(/\|/g, '\\|').substring(0, 60) + (task.suggestion.length > 60 ? '...' : '');
                report += `| \`${task.file}\` | ${line} | ${task.type} | ${task.issue} | ${content} | ${suggestion} |\n`;
            });
            report += `\n`;
        }
        
        // Medium Priority Tasks
        if (this.reportData.mediumPriority.length > 0) {
            report += `## Medium Priority Tasks (${this.reportData.mediumPriority.length})\n\n`;
            report += `*These issues affect code quality and maintenance but are not critical.*\n\n`;
            // Show first 20 in table, then summarize the rest
            const showCount = Math.min(20, this.reportData.mediumPriority.length);
            report += `### Top ${showCount} Issues\n\n`;
            report += `| File | Line | Type | Issue | Content | Suggestion |\n`;
            report += `|------|------|------|-------|---------|------------|\n`;
            this.reportData.mediumPriority.slice(0, showCount).forEach(task => {
                const line = task.line ? task.line : '-';
                const content = task.content.replace(/\|/g, '\\|').substring(0, 40) + (task.content.length > 40 ? '...' : '');
                const suggestion = task.suggestion.replace(/\|/g, '\\|').substring(0, 50) + (task.suggestion.length > 50 ? '...' : '');
                report += `| \`${task.file}\` | ${line} | ${task.type} | ${task.issue} | ${content} | ${suggestion} |\n`;
            });
            report += `\n`;
            
            if (this.reportData.mediumPriority.length > showCount) {
                report += `### Remaining ${this.reportData.mediumPriority.length - showCount} Medium Priority Issues\n\n`;
                // Group by type for summary
                const remaining = this.reportData.mediumPriority.slice(showCount);
                const groupedRemaining = {};
                remaining.forEach(task => {
                    if (!groupedRemaining[task.type]) {
                        groupedRemaining[task.type] = [];
                    }
                    groupedRemaining[task.type].push(task);
                });
                
                Object.entries(groupedRemaining).forEach(([type, tasks]) => {
                    report += `- **${type}**: ${tasks.length} instances\n`;
                });
                report += `\n`;
            }
        }
        
        // Low Priority Tasks (summarized)
        if (this.reportData.lowPriority.length > 0) {
            report += `## Low Priority Tasks (${this.reportData.lowPriority.length})\n\n`;
            report += `*These are minor improvements that can be addressed when convenient.*\n\n`;
            
            // Group by type for summary
            const groupedLowPriority = {};
            this.reportData.lowPriority.forEach(task => {
                if (!groupedLowPriority[task.type]) {
                    groupedLowPriority[task.type] = [];
                }
                groupedLowPriority[task.type].push(task);
            });
            
            Object.entries(groupedLowPriority).forEach(([type, tasks]) => {
                report += `### ${type} (${tasks.length} instances)\n`;
                tasks.slice(0, 5).forEach(task => { // Show first 5 examples
                    report += `- \`${task.file}\``;
                    if (task.line) report += `:${task.line}`;
                    report += ` - ${task.issue}\n`;
                });
                if (tasks.length > 5) {
                    report += `- ... and ${tasks.length - 5} more instances\n`;
                }
                report += `\n`;
            });
        }
        
        // Recommendations
        report += `## Maintenance Recommendations\n\n`;
        report += `### Immediate Actions\n`;
        if (this.reportData.highPriority.length > 0) {
            report += `1. **Fix broken links** to restore navigation functionality\n`;
            report += `2. **Update version references** in user-facing documentation\n`;
        } else {
            report += `✅ No immediate actions required - no high priority issues found!\n`;
        }
        report += `\n`;
        
        report += `### Ongoing Maintenance\n`;
        report += `1. **Review TODO/FIXME comments** to remove completed items\n`;
        report += `2. **Organize temporary content** by archiving or promoting to permanent status\n`;
        report += `3. **Standardize terminology** across documentation\n`;
        report += `4. **Establish regular maintenance schedule** to prevent accumulation\n\n`;
        
        // Integration Notes
        report += `## Integration with VERSION_TRANSITION\n\n`;
        report += `This maintenance report supports VERSION_TRANSITION Step 3 by providing:\n`;
        report += `- Specific file and line references for efficient task execution\n`;
        report += `- Priority classification for resource allocation\n`;
        report += `- Category grouping for systematic cleanup approach\n`;
        report += `- Actionable recommendations for immediate and ongoing maintenance\n\n`;
        
        report += `**Next Steps**: Execute high priority tasks first, then proceed with medium priority items based on available time and resources.\n\n`;
        
        report += `---\n\n`;
        report += `*This summary report was generated by the Repository Maintenance Analyzer as part of VERSION_TRANSITION Step 3. For detailed task execution, see the corresponding operational document.*`;
        
        return report;
    }

    generateOperationalDocument() {
        const timestamp = new Date().toISOString();
        const version = this.currentVersion || 'unknown';
        
        let doc = `# Repository Maintenance Tasks - v${version}\n\n`;
        doc += `**Generated**: ${timestamp}\n`;
        doc += `**Repository Version**: ${version}\n`;
        doc += `**Files Scanned**: ${this.scannedFiles.length}\n`;
        doc += `**Total Tasks**: ${this.reportData.summary.totalTasks}\n\n`;
        
        doc += `## Purpose\n\n`;
        doc += `This operational document provides detailed task lists for executing repository maintenance as part of VERSION_TRANSITION Step 3. Each task includes specific file and line references for efficient execution.\n\n`;
        
        doc += `## Execution Strategy\n\n`;
        doc += `### Recommended Order\n`;
        doc += `1. **High Priority Tasks** (${this.reportData.summary.highPriority} tasks) - Execute first\n`;
        doc += `2. **Medium Priority Tasks** (${this.reportData.summary.mediumPriority} tasks) - Execute based on available time\n`;
        doc += `3. **Low Priority Tasks** (${this.reportData.summary.lowPriority} tasks) - Execute when convenient\n\n`;
        
        doc += `### Task Completion Tracking\n`;
        doc += `- [ ] Mark completed tasks with ✅\n`;
        doc += `- [ ] Update this document as tasks are completed\n`;
        doc += `- [ ] Remove completed sections to maintain focus\n\n`;
        
        // High Priority Tasks (Full Detail)
        if (this.reportData.highPriority.length > 0) {
            doc += `## High Priority Tasks (${this.reportData.highPriority.length})\n\n`;
            doc += `*Critical issues affecting navigation, user experience, and version accuracy.*\n\n`;
            
            // Group by type for better organization
            const groupedHigh = {};
            this.reportData.highPriority.forEach(task => {
                if (!groupedHigh[task.type]) {
                    groupedHigh[task.type] = [];
                }
                groupedHigh[task.type].push(task);
            });
            
            Object.entries(groupedHigh).forEach(([type, tasks]) => {
                doc += `### ${type} (${tasks.length} tasks)\n\n`;
                doc += `| Status | File | Line | Content | Issue | Action |\n`;
                doc += `|--------|------|------|---------|-------|--------|\n`;
                tasks.forEach(task => {
                    const line = task.line ? task.line : '-';
                    const content = task.content.replace(/\|/g, '\\|').substring(0, 40) + (task.content.length > 40 ? '...' : '');
                    const issue = task.issue.replace(/\|/g, '\\|');
                    const action = task.suggestion.replace(/\|/g, '\\|').substring(0, 50) + (task.suggestion.length > 50 ? '...' : '');
                    doc += `| ⬜ | \`${task.file}\` | ${line} | ${content} | ${issue} | ${action} |\n`;
                });
                doc += `\n`;
            });
        }
        
        // Medium Priority Tasks (Structured Detail)
        if (this.reportData.mediumPriority.length > 0) {
            doc += `## Medium Priority Tasks (${this.reportData.mediumPriority.length})\n\n`;
            doc += `*Quality and organization issues that improve maintainability.*\n\n`;
            
            const groupedMedium = {};
            this.reportData.mediumPriority.forEach(task => {
                if (!groupedMedium[task.type]) {
                    groupedMedium[task.type] = [];
                }
                groupedMedium[task.type].push(task);
            });
            
            Object.entries(groupedMedium).forEach(([type, tasks]) => {
                doc += `### ${type} (${tasks.length} tasks)\n\n`;
                doc += `| Status | File | Line | Content | Action |\n`;
                doc += `|--------|------|------|---------|--------|\n`;
                tasks.forEach(task => {
                    const line = task.line ? task.line : '-';
                    const content = task.content.replace(/\|/g, '\\|').substring(0, 50) + (task.content.length > 50 ? '...' : '');
                    const action = task.suggestion.replace(/\|/g, '\\|').substring(0, 60) + (task.suggestion.length > 60 ? '...' : '');
                    doc += `| ⬜ | \`${task.file}\` | ${line} | ${content} | ${action} |\n`;
                });
                doc += `\n`;
            });
        }
        
        // Low Priority Tasks (Summary with Examples)
        if (this.reportData.lowPriority.length > 0) {
            doc += `## Low Priority Tasks (${this.reportData.lowPriority.length})\n\n`;
            doc += `*Minor improvements that can be addressed when convenient. These are summarized by type with examples.*\n\n`;
            
            const groupedLow = {};
            this.reportData.lowPriority.forEach(task => {
                if (!groupedLow[task.type]) {
                    groupedLow[task.type] = [];
                }
                groupedLow[task.type].push(task);
            });
            
            Object.entries(groupedLow).forEach(([type, tasks]) => {
                doc += `### ${type} (${tasks.length} instances)\n\n`;
                doc += `**Pattern**: ${tasks[0].issue}\n`;
                doc += `**Action**: ${tasks[0].suggestion}\n\n`;
                doc += `**All Files**:\n`;
                tasks.forEach(task => {
                    const line = task.line ? `:${task.line}` : '';
                    doc += `- [ ] \`${task.file}\`${line}\n`;
                });
                doc += `\n`;
            });
        }
        
        // Progress Tracking
        doc += `## Progress Tracking\n\n`;
        doc += `### Completion Summary\n`;
        doc += `- [ ] High Priority: 0/${this.reportData.summary.highPriority} completed\n`;
        doc += `- [ ] Medium Priority: 0/${this.reportData.summary.mediumPriority} completed\n`;
        doc += `- [ ] Low Priority: 0/${this.reportData.summary.lowPriority} completed\n\n`;
        
        doc += `### Completion Criteria\n`;
        doc += `**High Priority Complete When**:\n`;
        doc += `- All broken internal links are fixed\n`;
        doc += `- All version references updated to current version\n`;
        doc += `- Critical navigation issues resolved\n\n`;
        
        doc += `**Medium Priority Complete When**:\n`;
        doc += `- Draft content reviewed and finalized or archived\n`;
        doc += `- Temporary files organized properly\n`;
        doc += `- Content quality issues addressed\n\n`;
        
        doc += `**Low Priority Complete When**:\n`;
        doc += `- Formatting consistency improved\n`;
        doc += `- Terminology standardized\n`;
        doc += `- Minor issues addressed as time permits\n\n`;
        
        // Notes Section
        doc += `## Execution Notes\n\n`;
        doc += `### Tips for Efficient Execution\n`;
        doc += `1. **Batch similar tasks**: Group file operations by type\n`;
        doc += `2. **Use find/replace**: For version updates and terminology fixes\n`;
        doc += `3. **Test changes**: Verify links work after fixing\n`;
        doc += `4. **Update progress**: Mark completed tasks immediately\n\n`;
        
        doc += `### Common Patterns\n`;
        doc += `- **Version References**: Update \`v1.2.3\`, \`v0.6.2\` → \`v${version}\`\n`;
        doc += `- **Broken Links**: Check file exists, update path if moved\n`;
        doc += `- **Draft Content**: Review completion status, remove draft markers\n`;
        doc += `- **Temporary Files**: Decide permanent location or archive\n\n`;
        
        doc += `---\n\n`;
        doc += `*This operational document was generated by the Repository Maintenance Analyzer for VERSION_TRANSITION Step 3 execution. Update progress as tasks are completed.*`;
        
        return doc;
    }
}

// CLI execution
if (require.main === module) {
    const analyzer = new RepositoryMaintenanceAnalyzer();
    
    analyzer.analyzeRepository()
        .then(({ summaryReport, operationalDoc }) => {
            const version = analyzer.currentVersion || 'current';
            
            // Write summary report to reports directory
            const summaryReportPath = `docs/reports/v${version}-repository-maintenance.md`;
            const reportsDir = 'docs/reports';
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            fs.writeFileSync(summaryReportPath, summaryReport);
            
            // Write operational document to operational docs
            const operationalDocPath = `claude/operational-docs/repository-maintenance-tasks-v${version}.md`;
            const operationalDir = 'claude/operational-docs';
            if (!fs.existsSync(operationalDir)) {
                fs.mkdirSync(operationalDir, { recursive: true });
            }
            fs.writeFileSync(operationalDocPath, operationalDoc);
            
            console.log(`📋 Summary report generated: ${summaryReportPath}`);
            console.log(`📋 Operational document generated: ${operationalDocPath}`);
            console.log(`\n✅ Repository maintenance analysis complete!`);
            
            // Display summary
            console.log(`\n📊 Summary:`);
            console.log(`   Total tasks: ${analyzer.reportData.summary.totalTasks}`);
            console.log(`   High priority: ${analyzer.reportData.summary.highPriority}`);
            console.log(`   Medium priority: ${analyzer.reportData.summary.mediumPriority}`);
            console.log(`   Low priority: ${analyzer.reportData.summary.lowPriority}`);
        })
        .catch(error => {
            console.error('❌ Error during analysis:', error);
            process.exit(1);
        });
}

module.exports = RepositoryMaintenanceAnalyzer;