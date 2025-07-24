const fs = require('fs');
const path = require('path');

class StackOrchestrator {
    constructor(config = {}) {
        this.config = config;
        this.components = new Map();
        this.deployedStacks = [];
    }
    
    async registerComponent(componentName, componentPath) {
        try {
            const ComponentClass = require(componentPath);
            this.components.set(componentName, ComponentClass);
            console.log(`✅ Registered component: ${componentName}`);
        } catch (error) {
            console.error(`❌ Failed to register component ${componentName}:`, error.message);
            throw error;
        }
    }
    
    async deployStack(stackConfig) {
        console.log(`🚀 Deploying stack: ${stackConfig.name || 'unnamed'}`);
        
        const deployments = [];
        const deploymentOrder = this.calculateDeploymentOrder(stackConfig.components);
        
        for (const componentConfig of deploymentOrder) {
            try {
                const deployment = await this.deployComponent(componentConfig);
                deployments.push(deployment);
                console.log(`✅ Component ${componentConfig.name} deployed successfully`);
            } catch (error) {
                console.error(`❌ Failed to deploy component ${componentConfig.name}:`, error.message);
                
                // Rollback on failure
                await this.rollbackDeployments(deployments);
                throw error;
            }
        }
        
        // Configure inter-component networking
        if (stackConfig.networking) {
            await this.configureNetworking(deployments, stackConfig.networking);
        }
        
        const stackDeployment = {
            id: this.generateStackId(),
            name: stackConfig.name,
            components: deployments,
            deployedAt: new Date().toISOString(),
            status: 'deployed'
        };
        
        this.deployedStacks.push(stackDeployment);
        console.log(`🎉 Stack deployment completed: ${stackDeployment.id}`);
        
        return stackDeployment;
    }
    
    async deployComponent(componentConfig) {
        const { name, environment, config } = componentConfig;
        
        // Try to use registered component
        if (this.components.has(name)) {
            const ComponentClass = this.components.get(name);
            const component = new ComponentClass(environment, config);
            return await component.deploy();
        }
        
        // Try to use enhanced container directly
        if (componentConfig.image) {
            return await this.deployEnhancedContainer(componentConfig);
        }
        
        // Try to discover component from registry
        const discoveredComponent = await this.discoverComponent(name);
        if (discoveredComponent) {
            return await this.deployDiscoveredComponent(discoveredComponent, componentConfig);
        }
        
        throw new Error(`Component not found: ${name}`);
    }
    
    async deployEnhancedContainer(componentConfig) {
        const { name, image, environment, config } = componentConfig;
        
        const docker = new (require('../lib/docker/docker.js'))();
        
        // Mount necessary volumes for deployment
        const volumes = [
            `${process.env.HOME}/.kube:/root/.kube`,
            `/var/run/docker.sock:/var/run/docker.sock`
        ];
        
        // Set environment variables
        const env = [
            `INFOMETIS_ENV=${environment}`,
            `INFOMETIS_CONFIG=${JSON.stringify(config)}`
        ];
        
        console.log(`📦 Deploying enhanced container: ${image}`);
        
        const result = await docker.run(image, ['infometis', 'deploy'], {
            rm: true,
            volumes,
            env,
            name: `${name}-deployer`
        });
        
        return {
            component: name,
            method: 'enhanced-container',
            image,
            environment,
            result
        };
    }
    
    calculateDeploymentOrder(components) {
        // Simple dependency resolution - can be enhanced
        const ordered = [];
        const visited = new Set();
        
        const visit = (component) => {
            if (visited.has(component.name)) return;
            
            // Deploy dependencies first
            if (component.dependencies) {
                for (const dep of component.dependencies) {
                    const depComponent = components.find(c => c.name === dep);
                    if (depComponent) {
                        visit(depComponent);
                    }
                }
            }
            
            visited.add(component.name);
            ordered.push(component);
        };
        
        components.forEach(visit);
        return ordered;
    }
    
    async configureNetworking(deployments, networkingConfig) {
        console.log('🔗 Configuring inter-component networking...');
        
        // Implementation depends on environment
        // Kubernetes: Services, Ingress
        // Docker Compose: Networks
        // Standalone: Port mapping, bridge networks
        
        for (const rule of networkingConfig.rules || []) {
            await this.applyNetworkingRule(deployments, rule);
        }
    }
    
    async getStackStatus(stackId) {
        const stack = this.deployedStacks.find(s => s.id === stackId);
        if (!stack) {
            throw new Error(`Stack not found: ${stackId}`);
        }
        
        const componentStatuses = [];
        for (const deployment of stack.components) {
            const status = await this.getComponentStatus(deployment);
            componentStatuses.push(status);
        }
        
        return {
            ...stack,
            componentStatuses,
            overallStatus: this.calculateOverallStatus(componentStatuses)
        };
    }
    
    async rollbackDeployments(deployments) {
        console.log('⏪ Rolling back deployments...');
        
        for (const deployment of deployments.reverse()) {
            try {
                await this.cleanupDeployment(deployment);
                console.log(`🗑️ Cleaned up ${deployment.component}`);
            } catch (error) {
                console.error(`⚠️ Failed to cleanup ${deployment.component}:`, error.message);
            }
        }
    }
    
    generateStackId() {
        return `stack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    async discoverComponent(name) {
        // Implementation for component discovery from registry
        // Could check GitHub Container Registry, NPM, local registry, etc.
        return null;
    }
    
    calculateOverallStatus(componentStatuses) {
        const allHealthy = componentStatuses.every(s => s.status === 'healthy');
        const anyFailed = componentStatuses.some(s => s.status === 'failed');
        
        if (allHealthy) return 'healthy';
        if (anyFailed) return 'degraded';
        return 'pending';
    }
}

module.exports = StackOrchestrator;