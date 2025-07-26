#!/usr/bin/env node

/**
 * InfoMetis Kafka UI Cleanup Script
 * Simple script to cleanup the Kafka UI component
 */

const KafkaUIDeployment = require('../core/kafka-ui-deployment');

async function main() {
    console.log('Starting Kafka UI cleanup...');
    
    const deployment = new KafkaUIDeployment();
    
    try {
        // Initialize to setup logger and utilities
        await deployment.initialize();
        
        const success = await deployment.cleanup();
        
        if (success) {
            console.log('\n✅ Kafka UI cleanup completed successfully!');
            process.exit(0);
        } else {
            console.log('\n❌ Kafka UI cleanup failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 Fatal error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = main;