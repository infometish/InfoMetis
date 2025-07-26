#!/usr/bin/env node

/**
 * InfoMetis Kafka UI Deployment Script
 * Simple script to deploy the Kafka UI component
 */

const KafkaUIDeployment = require('../core/kafka-ui-deployment');

async function main() {
    console.log('Starting Kafka UI deployment...');
    
    const deployment = new KafkaUIDeployment();
    
    try {
        const success = await deployment.deploy();
        
        if (success) {
            console.log('\n✅ Kafka UI deployment completed successfully!');
            console.log('Access Kafka UI at: http://localhost/kafka-ui');
            process.exit(0);
        } else {
            console.log('\n❌ Kafka UI deployment failed');
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