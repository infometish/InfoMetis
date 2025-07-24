#!/usr/bin/env node

const StackOrchestrator = require('../core/stack-orchestrator.js');
const InteractiveConsole = require('../console/interactive-console.js');
const fs = require('fs');

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command) {
        console.log(`
InfoMetis Orchestrator CLI

Usage:
  infometis console                                    # Start interactive console
  infometis deploy-stack <stack-file>                 # Deploy stack from configuration
  infometis deploy <component> [--env <environment>]  # Deploy single component  
  infometis status [stack-id]                         # Get deployment status
  infometis list-stacks                               # List all deployed stacks
  infometis cleanup <stack-id>                        # Cleanup deployed stack
  infometis spec                                      # Show orchestrator specification
  infometis cache-images                              # Cache container images
  infometis deploy-cluster                            # Deploy K0s cluster

Component Commands:
  infometis deploy kafka --env kubernetes
  infometis deploy grafana --env docker-compose
  infometis deploy nifi --env standalone

Examples:
  infometis console
  infometis deploy-stack ./analytics-stack.json
  infometis deploy kafka --env kubernetes --config ./kafka-config.json
        `);
        process.exit(0);
    }
    
    // Parse arguments
    const options = {};
    for (let i = 1; i < args.length; i += 2) {
        if (args[i] && args[i].startsWith('--')) {
            options[args[i].slice(2)] = args[i + 1];
        }
    }
    
    const orchestrator = new StackOrchestrator();
    
    try {
        switch (command) {
            case 'console':
                console.log('🎛️ Starting InfoMetis Interactive Console...');
                const console = new InteractiveConsole();
                await console.start();
                break;
                
            case 'deploy-stack':
                const stackFile = args[1];
                if (!stackFile) {
                    console.error('❌ Stack configuration file required');
                    process.exit(1);
                }
                
                const stackConfig = JSON.parse(fs.readFileSync(stackFile, 'utf8'));
                const deployment = await orchestrator.deployStack(stackConfig);
                console.log('✅ Stack deployment completed');
                console.log(JSON.stringify(deployment, null, 2));
                break;
                
            case 'deploy':
                const componentName = args[1];
                if (!componentName) {
                    console.error('❌ Component name required');
                    process.exit(1);
                }
                
                const environment = options.env || 'auto';
                const configFile = options.config;
                
                let config = {};
                if (configFile) {
                    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                }
                
                const componentDeployment = await orchestrator.deployComponent({
                    name: componentName,
                    environment,
                    config
                });
                
                console.log(`✅ Component ${componentName} deployed successfully`);
                console.log(JSON.stringify(componentDeployment, null, 2));
                break;
                
            case 'status':
                const stackId = args[1];
                if (stackId) {
                    const status = await orchestrator.getStackStatus(stackId);
                    console.log(JSON.stringify(status, null, 2));
                } else {
                    console.log('📊 Overall Orchestrator Status:');
                    console.log(`Deployed stacks: ${orchestrator.deployedStacks.length}`);
                    console.log(`Registered components: ${orchestrator.components.size}`);
                }
                break;
                
            case 'list-stacks':
                console.log('📋 Deployed Stacks:');
                orchestrator.deployedStacks.forEach(stack => {
                    console.log(`  ${stack.id}: ${stack.name} (${stack.status})`);
                });
                break;
                
            case 'cleanup':
                const cleanupStackId = args[1];
                if (!cleanupStackId) {
                    console.error('❌ Stack ID required for cleanup');
                    process.exit(1);
                }
                
                await orchestrator.cleanupStack(cleanupStackId);
                console.log(`🗑️ Stack ${cleanupStackId} cleaned up`);
                break;
                
            case 'spec':
                const spec = JSON.parse(fs.readFileSync('../component-spec.json', 'utf8'));
                console.log(JSON.stringify(spec, null, 2));
                break;
                
            case 'cache-images':
                console.log('📦 Caching container images...');
                const cacheImages = require('../tools/cache-images.js');
                await cacheImages();
                break;
                
            case 'deploy-cluster':
                console.log('🏗️ Deploying K0s cluster...');
                const deployCluster = require('../tools/deploy-k0s-cluster.js');
                await deployCluster();
                break;
                
            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main().catch(console.error);