#!/usr/bin/env node

/**
 * InfoMetis v0.4.0 - Elasticsearch Integration
 * Cross-platform deployment console with Elasticsearch support  
 * Consistent entry point: node console.js (same as previous versions)
 */

const InteractiveConsole = require('./console/interactive-console');

async function main() {
    const console = new InteractiveConsole();
    
    // Run interactive console
    const success = await console.run();
    process.exit(success ? 0 : 1);
}

// Run main function
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}