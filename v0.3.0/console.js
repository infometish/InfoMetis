#!/usr/bin/env node

/**
 * InfoMetis v0.3.0 - JavaScript Console Implementation
 * Cross-platform deployment console using native JavaScript
 * Consistent entry point: node console.js (same as v0.1.0 and v0.2.0)
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