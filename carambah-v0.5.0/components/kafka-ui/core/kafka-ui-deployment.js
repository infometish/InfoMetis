/**
 * InfoMetis Kafka UI Component
 * Kafka UI (provectuslabs/kafka-ui:latest) deployment for InfoMetis platform
 * Provides web-based Kafka cluster management and monitoring interface
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');
const path = require('path');

class KafkaUIDeployment {
    constructor() {
        this.logger = new Logger('Kafka UI');
        this.config = new ConfigUtil(this.logger);
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        
        this.imageConfig = null;
        this.namespace = 'infometis';
        this.clusterName = 'infometis';
    }

    /**
     * Initialize deployment with configuration loading
     */
    async initialize() {
        try {
            this.logger.header('InfoMetis Kafka UI Component', 'provectuslabs/kafka-ui:latest');
            
            // Load image configuration
            this.imageConfig = await this.config.loadImageConfig();
            
            this.logger.config('Kafka UI Configuration', {
                'UI Image': this.imageConfig.images.find(img => img.includes('kafka-ui')) || 'provectuslabs/kafka-ui:latest',
                'Pull Policy': 'Never',
                'Context Path': '/kafka-ui',
                'Kafka Bootstrap': 'kafka-service:9092',
                'Namespace': this.namespace,
                'Cluster Name': this.clusterName
            });
            
            return true;
        } catch (error) {
            this.logger.error(`Failed to initialize: ${error.message}`);
            return false;
        }
    }

    /**
     * Check prerequisites for Kafka UI deployment
     */
    async checkPrerequisites() {
        this.logger.step('Checking prerequisites...');
        
        try {
            // Check if kubectl is available
            if (!await this.kubectl.isAvailable()) {
                throw new Error('kubectl not available or cluster not accessible');
            }

            // Check if k0s container is running
            const containerCheck = await this.exec.run(`docker ps -q -f name=${this.clusterName}`, {}, true);
            if (!containerCheck.success || !containerCheck.stdout.trim()) {
                throw new Error('k0s container is not running. Deploy k0s cluster first.');
            }

            // Check if InfoMetis namespace exists
            if (!await this.kubectl.namespaceExists(this.namespace)) {
                throw new Error('InfoMetis namespace does not exist. Deploy cluster first.');
            }

            // Check if Kafka service exists
            const kafkaServiceCheck = await this.exec.run(
                `kubectl get service -n ${this.namespace} kafka-service`, 
                {}, true
            );
            if (!kafkaServiceCheck.success) {
                this.logger.warn('Kafka service not found - Kafka UI will require Kafka to be deployed');
            }

            this.logger.success('Prerequisites verified');
            return true;
        } catch (error) {
            this.logger.error(`Prerequisites check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if image exists in k0s containerd
     */
    async isImageInContainerd(image) {
        try {
            const patterns = [
                image,
                `library/${image}`,
                image.replace(':', ' ')
            ];
            
            for (const pattern of patterns) {
                const result = await this.exec.run(
                    `docker exec ${this.clusterName} k0s ctr -n k8s.io images list | grep "${pattern}"`,
                    {}, true
                );
                if (result.success) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Transfer image from Docker to k0s containerd
     */
    async transferImageToContainerd(image) {
        try {
            // Check if image is in Docker cache
            const dockerCheck = await this.exec.run(`docker inspect "${image}"`, {}, true);
            if (!dockerCheck.success) {
                throw new Error(`Image not in Docker cache: ${image}`);
            }

            // Transfer to k0s containerd
            this.logger.info(`📤 Transferring ${image} to k0s containerd...`);
            const transferResult = await this.exec.run(
                `docker save "${image}" | docker exec -i ${this.clusterName} k0s ctr -n k8s.io images import -`,
                { timeout: 0 }
            );
            
            if (!transferResult.success) {
                throw new Error(`Failed to transfer ${image}: ${transferResult.stderr}`);
            }
            
            this.logger.success(`✓ Transferred ${image} to k0s containerd`);
            return true;
            
        } catch (error) {
            this.logger.error(`✗ Failed to transfer ${image}: ${error.message}`);
            return false;
        }
    }

    /**
     * Ensure Kafka UI image is available in k0s containerd
     */
    async ensureImageAvailable() {
        this.logger.step('Ensuring Kafka UI image is available in k0s containerd...');
        
        const uiImage = this.imageConfig.images.find(img => img.includes('kafka-ui')) || 'provectuslabs/kafka-ui:latest';
        
        // Check if image exists in containerd
        if (await this.isImageInContainerd(uiImage)) {
            this.logger.success(`✓ ${uiImage} already in k0s containerd`);
            return true;
        }
        
        // Transfer from Docker to containerd
        if (!await this.transferImageToContainerd(uiImage)) {
            throw new Error(`Failed to ensure ${uiImage} is available in k0s containerd`);
        }
        
        return true;
    }

    /**
     * Deploy Kafka UI using static manifest
     */
    async deployKafkaUI() {
        this.logger.step('Deploying Kafka UI using static manifest...');
        
        try {
            const fs = require('fs');
            
            // Use static manifest file
            const manifestPath = path.join(__dirname, '..', 'environments', 'kubernetes', 'manifests', 'kafka-ui-k8s.yaml');
            let manifestContent = fs.readFileSync(manifestPath, 'utf8');
            
            // Update image version if needed
            const uiImage = this.imageConfig.images.find(img => img.includes('kafka-ui')) || 'provectuslabs/kafka-ui:latest';
            manifestContent = manifestContent.replace(/image: provectuslabs\/kafka-ui:latest/g, `image: ${uiImage}`);
            
            if (!await this.kubectl.applyYaml(manifestContent, 'Kafka UI Dashboard')) {
                return false;
            }
            
            this.logger.success('Kafka UI deployed using static manifest with imagePullPolicy: Never');
            this.logger.info('Kafka UI provides web-based Kafka cluster management and monitoring');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy Kafka UI: ${error.message}`);
            return false;
        }
    }

    /**
     * Wait for Kafka UI to be ready
     */
    async waitForKafkaUI() {
        this.logger.progress('Waiting for Kafka UI to be ready...');
        this.logger.info('This may take 1-2 minutes for Kafka UI to initialize...');
        
        try {
            // Wait for deployment to be available
            this.logger.progress('Waiting for deployment to be ready...');
            const deploymentReady = await this.kubectl.waitForDeployment(this.namespace, 'kafka-ui', 120);
            
            if (!deploymentReady) {
                this.logger.warn('Kafka UI deployment not ready within timeout');
                return false;
            }
            
            // Wait a bit more for UI to fully start
            this.logger.progress('Waiting for Kafka UI to be fully operational...');
            await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second additional wait
            
            this.logger.success('Kafka UI is ready');
            return true;
        } catch (error) {
            this.logger.error(`Failed to wait for Kafka UI: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Kafka UI deployment
     */
    async verifyKafkaUI() {
        this.logger.step('Verifying Kafka UI deployment...');
        
        try {
            // Check if UI is running
            const uiRunning = await this.kubectl.arePodsRunning(this.namespace, 'app=kafka-ui');
            if (uiRunning) {
                this.logger.success('Kafka UI is running');
            } else {
                this.logger.warn('Kafka UI is not running');
                return false;
            }
            
            return true;
        } catch (error) {
            this.logger.error(`Kafka UI verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get Kafka UI deployment status
     */
    async getKafkaUIStatus() {
        this.logger.step('Getting Kafka UI status...');
        
        try {
            // Get pod status
            this.logger.info('Kafka UI Pod Status:');
            await this.exec.run(
                `kubectl get pods -n ${this.namespace} -l app=kafka-ui -o wide`,
                {},
                false
            );

            this.logger.newline();
            
            // Get service status
            this.logger.info('Kafka UI Service Status:');
            await this.exec.run(
                `kubectl get svc -n ${this.namespace} kafka-ui-service`,
                {},
                false
            );

            this.logger.newline();
            
            // Get ingress status
            this.logger.info('Kafka UI Ingress Status:');
            await this.exec.run(
                `kubectl get ingress -n ${this.namespace} kafka-ui-ingress`,
                {},
                false
            );

            this.logger.newline();
            this.logger.config('Access Information', {
                'Kafka UI Dashboard': 'http://localhost/kafka-ui',
                'Health Check': 'http://localhost/kafka-ui/actuator/health',
                'Direct Pod Access': `kubectl port-forward -n ${this.namespace} deployment/kafka-ui 8080:8080`,
                'Pod Logs': `kubectl logs -n ${this.namespace} deployment/kafka-ui -f`
            });

        } catch (error) {
            this.logger.error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Deploy complete Kafka UI workflow
     */
    async deploy() {
        try {
            if (!await this.initialize()) {
                return false;
            }

            // Execute deployment workflow
            const steps = [
                () => this.checkPrerequisites(),
                () => this.ensureImageAvailable(),
                () => this.deployKafkaUI(),
                () => this.waitForKafkaUI()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Verify deployment
            if (await this.verifyKafkaUI()) {
                await this.getKafkaUIStatus();
                this.logger.newline();
                this.logger.success('Kafka UI deployment completed successfully!');
                this.logger.info('Kafka UI web interface is now accessible at http://localhost/kafka-ui');
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('Kafka UI deployment completed with warnings');
                this.logger.info('Kafka UI may need more time to fully initialize');
                await this.getKafkaUIStatus();
                return true;
            }

        } catch (error) {
            this.logger.error(`Kafka UI deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Cleanup Kafka UI resources
     */
    async cleanup() {
        this.logger.step('Cleaning up Kafka UI resources...');
        
        try {
            // Delete Kafka UI resources
            const resources = [
                'ingress/kafka-ui-ingress',
                'service/kafka-ui-service',
                'deployment/kafka-ui'
            ];

            for (const resource of resources) {
                await this.exec.run(
                    `kubectl delete ${resource} -n ${this.namespace} --ignore-not-found=true`,
                    {},
                    true
                );
            }

            this.logger.success('Kafka UI resources cleaned up');
            return true;
        } catch (error) {
            this.logger.error(`Kafka UI cleanup failed: ${error.message}`);
            return false;
        }
    }
}

module.exports = KafkaUIDeployment;

// Allow direct execution
if (require.main === module) {
    const deployment = new KafkaUIDeployment();
    
    deployment.deploy().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}