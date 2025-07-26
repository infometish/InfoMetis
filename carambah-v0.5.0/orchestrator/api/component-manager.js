/**
 * Component Manager API
 * Provides programmatic interface for managing image-based components
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');

// Import all deployment modules
const K0sClusterDeployment = require('../core/deploy-k0s-cluster');
const TraefikDeployment = require('../core/deploy-traefik');
const NiFiDeployment = require('../core/deploy-nifi');
const RegistryDeployment = require('../core/deploy-registry');
const ElasticsearchDeployment = require('../core/deploy-elasticsearch');
const GrafanaDeployment = require('../core/deploy-grafana');
const KafkaDeployment = require('../core/deploy-kafka');
const KsqlDBDeployment = require('../core/deploy-ksqldb');
const FlinkDeployment = require('../core/deploy-flink');
const PrometheusDeployment = require('../core/deploy-prometheus');
const SchemaRegistryDeployment = require('../core/deploy-schema-registry');
const CacheManager = require('../core/cache-images');

class ComponentManager {
    constructor() {
        this.logger = new Logger('Component Manager');
        this.config = new ConfigUtil(this.logger);
        
        // Initialize deployment modules
        this.components = {
            'k0s': new K0sClusterDeployment(),
            'traefik': new TraefikDeployment(),
            'nifi': new NiFiDeployment(),
            'registry': new RegistryDeployment(),
            'elasticsearch': new ElasticsearchDeployment(),
            'grafana': new GrafanaDeployment(),
            'kafka': new KafkaDeployment(),
            'ksqldb': new KsqlDBDeployment(),
            'flink': new FlinkDeployment(),
            'prometheus': new PrometheusDeployment(),
            'schema-registry': new SchemaRegistryDeployment()
        };
        
        this.cache = new CacheManager();
    }

    /**
     * Get list of available components
     */
    getAvailableComponents() {
        return Object.keys(this.components);
    }

    /**
     * Deploy a specific component
     * @param {string} componentName - Name of the component to deploy
     * @returns {Promise<boolean>} - Success status
     */
    async deployComponent(componentName) {
        if (!this.components[componentName]) {
            this.logger.error(`Unknown component: ${componentName}`);
            return false;
        }

        this.logger.step(`Deploying component: ${componentName}`);
        
        try {
            const result = await this.components[componentName].deploy();
            if (result) {
                this.logger.success(`Component ${componentName} deployed successfully`);
            } else {
                this.logger.error(`Component ${componentName} deployment failed`);
            }
            return result;
        } catch (error) {
            this.logger.error(`Error deploying ${componentName}: ${error.message}`);
            return false;
        }
    }

    /**
     * Remove a specific component
     * @param {string} componentName - Name of the component to remove
     * @returns {Promise<boolean>} - Success status
     */
    async removeComponent(componentName) {
        if (!this.components[componentName]) {
            this.logger.error(`Unknown component: ${componentName}`);
            return false;
        }

        this.logger.step(`Removing component: ${componentName}`);
        
        try {
            const result = await this.components[componentName].cleanup();
            if (result) {
                this.logger.success(`Component ${componentName} removed successfully`);
            } else {
                this.logger.error(`Component ${componentName} removal failed`);
            }
            return result;
        } catch (error) {
            this.logger.error(`Error removing ${componentName}: ${error.message}`);
            return false;
        }
    }

    /**
     * Deploy multiple components in sequence
     * @param {string[]} componentNames - Array of component names to deploy
     * @returns {Promise<boolean>} - Success status
     */
    async deployStack(componentNames) {
        this.logger.header(`Deploying stack: ${componentNames.join(', ')}`);
        
        let allSuccess = true;
        for (const componentName of componentNames) {
            const result = await this.deployComponent(componentName);
            if (!result) {
                allSuccess = false;
                this.logger.error(`Stack deployment failed at component: ${componentName}`);
                break;
            }
        }
        
        if (allSuccess) {
            this.logger.success('Stack deployment completed successfully');
        } else {
            this.logger.error('Stack deployment failed');
        }
        
        return allSuccess;
    }

    /**
     * Remove multiple components in reverse sequence
     * @param {string[]} componentNames - Array of component names to remove
     * @returns {Promise<boolean>} - Success status
     */
    async removeStack(componentNames) {
        this.logger.header(`Removing stack: ${componentNames.join(', ')}`);
        
        // Remove in reverse order to handle dependencies
        const reverseOrder = [...componentNames].reverse();
        
        let allSuccess = true;
        for (const componentName of reverseOrder) {
            const result = await this.removeComponent(componentName);
            if (!result) {
                allSuccess = false;
                // Continue with other components even if one fails
            }
        }
        
        if (allSuccess) {
            this.logger.success('Stack removal completed successfully');
        } else {
            this.logger.warn('Stack removal completed with some failures');
        }
        
        return allSuccess;
    }

    /**
     * Get component status
     * @param {string} componentName - Name of the component
     * @returns {Promise<object>} - Component status information
     */
    async getComponentStatus(componentName) {
        if (!this.components[componentName]) {
            return { error: `Unknown component: ${componentName}` };
        }

        try {
            // Most components have a status or health check method
            if (typeof this.components[componentName].getStatus === 'function') {
                return await this.components[componentName].getStatus();
            } else {
                return { status: 'unknown', message: 'Status check not implemented' };
            }
        } catch (error) {
            return { error: `Status check failed: ${error.message}` };
        }
    }

    /**
     * Cache all component images
     * @returns {Promise<boolean>} - Success status
     */
    async cacheImages() {
        this.logger.step('Caching all component images...');
        
        try {
            const result = await this.cache.cacheImages();
            if (result) {
                this.logger.success('All component images cached successfully');
            } else {
                this.logger.error('Some images failed to cache');
            }
            return result;
        } catch (error) {
            this.logger.error(`Image caching failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Load cached images
     * @returns {Promise<boolean>} - Success status
     */
    async loadCachedImages() {
        this.logger.step('Loading cached images...');
        
        try {
            const result = await this.cache.loadCachedImages();
            if (result) {
                this.logger.success('All cached images loaded successfully');
            } else {
                this.logger.error('Some cached images failed to load');
            }
            return result;
        } catch (error) {
            this.logger.error(`Loading cached images failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Predefined stack configurations
     */
    getStackConfigurations() {
        return {
            'minimal': ['k0s', 'traefik'],
            'basic': ['k0s', 'traefik', 'nifi', 'registry'],
            'analytics': ['k0s', 'traefik', 'nifi', 'registry', 'kafka', 'elasticsearch'],
            'complete': ['k0s', 'traefik', 'nifi', 'registry', 'kafka', 'ksqldb', 'flink', 'elasticsearch', 'grafana', 'prometheus', 'schema-registry']
        };
    }

    /**
     * Deploy a predefined stack
     * @param {string} stackName - Name of the predefined stack
     * @returns {Promise<boolean>} - Success status
     */
    async deployPredefinedStack(stackName) {
        const stacks = this.getStackConfigurations();
        
        if (!stacks[stackName]) {
            this.logger.error(`Unknown stack configuration: ${stackName}`);
            this.logger.info(`Available stacks: ${Object.keys(stacks).join(', ')}`);
            return false;
        }

        return await this.deployStack(stacks[stackName]);
    }

    /**
     * Remove a predefined stack
     * @param {string} stackName - Name of the predefined stack
     * @returns {Promise<boolean>} - Success status
     */
    async removePredefinedStack(stackName) {
        const stacks = this.getStackConfigurations();
        
        if (!stacks[stackName]) {
            this.logger.error(`Unknown stack configuration: ${stackName}`);
            return false;
        }

        return await this.removeStack(stacks[stackName]);
    }
}

module.exports = ComponentManager;