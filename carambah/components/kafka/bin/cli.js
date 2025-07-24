#!/usr/bin/env node

const KafkaComponent = require('../core/kafka-component.js');

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command) {
        console.log(`
InfoMetis Kafka Component CLI

Usage:
  infometis-kafka deploy [--env <environment>] [--config <config-file>]
  infometis-kafka status [--env <environment>]
  infometis-kafka validate [--env <environment>]
  infometis-kafka cleanup [--env <environment>]
  infometis-kafka spec
  infometis-kafka info

Environments: kubernetes, docker-compose, standalone, auto (default)

Examples:
  infometis-kafka deploy --env kubernetes
  infometis-kafka deploy --env docker-compose --config ./custom-config.json
  infometis-kafka status
        `);
        process.exit(0);
    }
    
    // Parse arguments
    const options = {};
    for (let i = 1; i < args.length; i += 2) {
        if (args[i].startsWith('--')) {
            options[args[i].slice(2)] = args[i + 1];
        }
    }
    
    const environment = options.env || 'auto';
    const configFile = options.config;
    
    let config = {};
    if (configFile) {
        config = JSON.parse(require('fs').readFileSync(configFile, 'utf8'));
    }
    
    const kafka = new KafkaComponent(environment, config);
    
    try {
        switch (command) {
            case 'deploy':
                const result = await kafka.deploy();
                console.log('✅ Kafka deployment completed successfully');
                console.log(JSON.stringify(result, null, 2));
                break;
                
            case 'status':
                const status = await kafka.getStatus();
                console.log('📊 Kafka Status:');
                console.log(JSON.stringify(status, null, 2));
                break;
                
            case 'validate':
                const validation = await kafka.validate();
                console.log('🔍 Kafka Validation:');
                console.log(JSON.stringify(validation, null, 2));
                break;
                
            case 'cleanup':
                await kafka.cleanup();
                console.log('🧹 Kafka cleanup completed');
                break;
                
            case 'spec':
                console.log(JSON.stringify(kafka.spec, null, 2));
                break;
                
            case 'info':
                const info = kafka.getComponentInfo();
                console.log(JSON.stringify(info, null, 2));
                break;
                
            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main().catch(console.error);