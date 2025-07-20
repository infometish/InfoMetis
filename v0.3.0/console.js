#!/usr/bin/env node

/**
 * InfoMetis v0.3.0 - JavaScript Console Implementation
 * Cross-platform deployment console using native JavaScript
 */

const ConsoleCore = require('./console/console-core');

async function main() {
    const console = new ConsoleCore();
    
    try {
        // Initialize console
        if (!await console.initialize()) {
            process.exit(1);
        }

        // Display configuration
        console.displayConfig();

        // Check prerequisites
        if (!await console.checkPrerequisites()) {
            console.logger.error('Prerequisites check failed. Please install missing components.');
            process.exit(1);
        }

        // Demo: Basic cluster operations
        console.logger.header('Demo: JavaScript-Native Operations');
        
        await console.checkClusterStatus();
        await console.deployNamespace();

        console.logger.newline();
        console.logger.success('v0.3.0 JavaScript console demo completed!');
        console.logger.info('This demonstrates the hybrid approach:');
        console.logger.info('  • Native JavaScript for logic and configuration');
        console.logger.info('  • child_process.exec() for kubectl/docker commands');
        console.logger.info('  • Consistent logging and error handling');
        console.logger.info('  • Cross-platform compatibility');

    } catch (error) {
        console.logger.error(`Console error: ${error.message}`);
        process.exit(1);
    } finally {
        await console.cleanup();
    }
}

// Handle process signals
process.on('SIGINT', () => {
    console.log('\n\nReceived SIGINT. Cleaning up...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run main function
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { ConsoleCore };