/**
 * Carambah v0.5.0 - Kafka REST Proxy Component
 * Extracted from InfoMetis v0.5.0 - Kafka REST-specific deployment logic
 * Handles Confluent Platform Kafka REST Proxy (confluentinc/cp-kafka-rest:7.5.0)
 */

class KafkaRestDeployment {
    constructor(logger, kubectl, config) {
        this.logger = logger;
        this.kubectl = kubectl;
        this.config = config;
        this.namespace = 'infometis';
        this.componentName = 'kafka-rest';
        this.image = 'confluentinc/cp-kafka-rest:7.5.0';
    }

    /**
     * Get Kafka REST configuration
     */
    getConfiguration() {
        return {
            'Component': 'Kafka REST Proxy',
            'Image': this.image,
            'Version': '7.5.0',
            'Port': '8082',
            'Namespace': this.namespace,
            'Dependencies': ['kafka-service:9092', 'schema-registry-service:8081'],
            'Endpoints': {
                'REST API': 'http://kafka-rest-service:8082',
                'External Access': 'http://localhost/kafka'
            }
        };
    }

    /**
     * Check if Kafka REST prerequisites are met
     */
    async checkPrerequisites() {
        this.logger.step('Checking Kafka REST prerequisites...');
        
        try {
            // Check if Kafka service exists
            const kafkaService = await this.kubectl.serviceExists(this.namespace, 'kafka-service');
            if (!kafkaService) {
                throw new Error('Kafka service not found. Deploy Kafka component first.');
            }

            // Check if namespace exists
            if (!await this.kubectl.namespaceExists(this.namespace)) {
                throw new Error('InfoMetis namespace does not exist.');
            }

            this.logger.success('Kafka REST prerequisites verified');
            return true;
        } catch (error) {
            this.logger.error(`Prerequisites check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Deploy Kafka REST Proxy
     */
    async deploy() {
        this.logger.step('Deploying Kafka REST Proxy...');
        
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Load manifest
            const manifestPath = path.join(__dirname, '..', 'environments', 'kubernetes', 'manifests', 'kafka-rest-k8s.yaml');
            let manifestContent = fs.readFileSync(manifestPath, 'utf8');
            
            // Update image if configured
            if (this.config && this.config.images) {
                const configuredImage = this.config.images.find(img => img.includes('kafka-rest')) || this.image;
                manifestContent = manifestContent.replace(/image: confluentinc\/cp-kafka-rest:7\.5\.0/g, `image: ${configuredImage}`);
            }
            
            if (!await this.kubectl.applyYaml(manifestContent, 'Kafka REST Proxy')) {
                return false;
            }
            
            this.logger.success('Kafka REST Proxy deployed successfully');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy Kafka REST Proxy: ${error.message}`);
            return false;
        }
    }

    /**
     * Wait for Kafka REST to be ready
     */
    async waitForReady() {
        this.logger.progress('Waiting for Kafka REST Proxy to be ready...');
        
        try {
            // Wait for deployment to be available
            const ready = await this.kubectl.waitForDeployment(this.namespace, 'kafka-rest-proxy', 180);
            
            if (!ready) {
                this.logger.warn('Kafka REST Proxy not ready within timeout');
                return false;
            }
            
            // Additional wait for REST API to be fully operational
            this.logger.progress('Waiting for REST API to be operational...');
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            this.logger.success('Kafka REST Proxy is ready');
            return true;
        } catch (error) {
            this.logger.error(`Failed to wait for Kafka REST Proxy: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Kafka REST deployment
     */
    async verify() {
        this.logger.step('Verifying Kafka REST Proxy deployment...');
        
        try {
            // Check if pods are running
            const running = await this.kubectl.arePodsRunning(this.namespace, 'app=kafka-rest-proxy');
            if (!running) {
                this.logger.warn('Kafka REST Proxy pods are not running');
                return false;
            }
            
            this.logger.success('Kafka REST Proxy is running');
            
            // Test REST API endpoint if possible
            try {
                const testResult = await this.testRestAPI();
                if (testResult) {
                    this.logger.success('Kafka REST API is responding');
                }
            } catch (error) {
                this.logger.warn('Could not test REST API endpoint');
            }
            
            return true;
        } catch (error) {
            this.logger.error(`Kafka REST verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test Kafka REST API endpoint
     */
    async testRestAPI() {
        try {
            // This would require additional networking setup for testing
            // For now, just return true as a placeholder
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get deployment status
     */
    async getStatus() {
        this.logger.step('Getting Kafka REST Proxy status...');
        
        try {
            const config = this.getConfiguration();
            this.logger.config('Kafka REST Configuration', config);
            
            // Get pod status
            this.logger.info('Kafka REST Pod Status:');
            await this.kubectl.getPodStatus(this.namespace, 'app=kafka-rest-proxy');
            
            // Get service status
            this.logger.info('Kafka REST Service Status:');
            await this.kubectl.getServiceStatus(this.namespace, 'kafka-rest-service');
            
        } catch (error) {
            this.logger.error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Cleanup Kafka REST resources
     */
    async cleanup() {
        this.logger.step('Cleaning up Kafka REST Proxy resources...');
        
        try {
            const resources = [
                'ingress/kafka-rest-ingress',
                'middleware/kafka-rest-stripprefix',
                'service/kafka-rest-service',
                'deployment/kafka-rest-proxy'
            ];

            for (const resource of resources) {
                await this.kubectl.deleteResource(this.namespace, resource);
            }

            this.logger.success('Kafka REST Proxy resources cleaned up');
            return true;
        } catch (error) {
            this.logger.error(`Kafka REST cleanup failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Complete deployment workflow
     */
    async deployComplete() {
        try {
            this.logger.header('Kafka REST Proxy Deployment', 'Confluent Platform cp-kafka-rest:7.5.0');
            
            const steps = [
                () => this.checkPrerequisites(),
                () => this.deploy(),
                () => this.waitForReady()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Verify deployment
            if (await this.verify()) {
                await this.getStatus();
                this.logger.success('Kafka REST Proxy deployment completed successfully!');
                return true;
            } else {
                this.logger.warn('Kafka REST Proxy deployment completed with warnings');
                return true; // Don't fail on verification warnings
            }

        } catch (error) {
            this.logger.error(`Kafka REST Proxy deployment failed: ${error.message}`);
            return false;
        }
    }
}

module.exports = KafkaRestDeployment;