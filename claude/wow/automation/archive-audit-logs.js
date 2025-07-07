#!/usr/bin/env node

/**
 * Archive Timelog Script
 * 
 * Archives the current timelog.txt with version stamp when creating new releases.
 * Usage: node scripts/archive_timelog.js <version>
 * Example: node scripts/archive_timelog.js 0.6.2
 */

const fs = require('fs');
const path = require('path');

function archiveTimelog(version) {
    const currentTimelog = '[AUDIT_LOG_PATH]';
    const archiveDir = '[AUDIT_ARCHIVE_PATH]';
    const archiveFile = path.join(archiveDir, `timelog_v${version}.txt`);
    
    try {
        // Ensure archive directory exists
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }
        
        // Check if current timelog exists
        if (!fs.existsSync(currentTimelog)) {
            console.log(`No timelog found at ${currentTimelog} - nothing to archive`);
            return;
        }
        
        // Check if archive already exists
        if (fs.existsSync(archiveFile)) {
            console.log(`Archive already exists: ${archiveFile}`);
            console.log('Skipping archive operation');
            return;
        }
        
        // Read current timelog
        const timelogContent = fs.readFileSync(currentTimelog, 'utf8');
        
        // Add archive header
        const timestamp = new Date().toISOString();
        const archiveHeader = `# Timelog Archive for Version ${version}\n# Archived: ${timestamp}\n# Original file: ${currentTimelog}\n\n`;
        const archiveContent = archiveHeader + timelogContent;
        
        // Write archive
        fs.writeFileSync(archiveFile, archiveContent);
        console.log(`✓ Timelog archived: ${archiveFile}`);
        
        // Clear current timelog (keep file but empty content)
        fs.writeFileSync(currentTimelog, '');
        console.log(`✓ Current timelog cleared: ${currentTimelog}`);
        
        // Add version boundary marker to new timelog
        const versionMarker = `    ##→${timestamp} | version_release | v${version} - timelog archived\n`;
        fs.writeFileSync(currentTimelog, versionMarker);
        console.log(`✓ Version boundary marker added to new timelog`);
        
    } catch (error) {
        console.error(`Error archiving timelog: ${error.message}`);
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    const version = process.argv[2];
    
    if (!version) {
        console.error('Usage: node scripts/archive_timelog.js <version>');
        console.error('Example: node scripts/archive_timelog.js 0.6.2');
        process.exit(1);
    }
    
    // Validate version format (basic check)
    if (!/^\d+\.\d+\.\d+/.test(version)) {
        console.error('Invalid version format. Expected: x.y.z (e.g., 0.6.2)');
        process.exit(1);
    }
    
    console.log(`Archiving timelog for version ${version}...`);
    archiveTimelog(version);
}

module.exports = { archiveTimelog };