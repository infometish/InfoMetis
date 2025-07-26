/**
 * InfoMetis v0.4.0 - Kafka Deployment
 * JavaScript implementation for Kafka deployment using static manifests
 * Deploys Apache Kafka with KRaft mode, REST proxy, UI dashboard, and Traefik ingress
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');
const path = require('path');

class KafkaDeployment {
    constructor() {
        this.logger = new Logger('Kafka Deployment');
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
            this.logger.header('InfoMetis v0.4.0 - Kafka Deployment', 'JavaScript Native Implementation');
            
            // Load image configuration
            this.imageConfig = await this.config.loadImageConfig();
            
            this.logger.config('Kafka Configuration', {
                'Kafka Image': this.imageConfig.images.find(img => img.includes('cp-kafka') && !img.includes('rest')) || 'confluentinc/cp-kafka:7.5.0',
                'REST Proxy Image': this.imageConfig.images.find(img => img.includes('kafka-rest')) || 'confluentinc/cp-kafka-rest:7.5.0',
                'UI Image': this.imageConfig.images.find(img => img.includes('kafka-ui')) || 'provectuslabs/kafka-ui:latest',
                'Pull Policy': 'Never',
                'Mode': 'KRaft (Zookeeper-free)',
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
     * Check prerequisites for Kafka deployment
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
            // Try multiple patterns to match the image
            const patterns = [
                image,                                    // exact match
                `library/${image}`,                      // docker.io/library prefix  
                image.replace(':', ' ')                  // space-separated
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
     * Ensure required images are available in k0s containerd
     */
    async ensureImagesAvailable() {
        this.logger.step('Ensuring Kafka images are available in k0s containerd...');
        
        const requiredImages = [
            this.imageConfig.images.find(img => img.includes('cp-kafka') && !img.includes('rest')) || 'confluentinc/cp-kafka:7.5.0',
            this.imageConfig.images.find(img => img.includes('kafka-rest')) || 'confluentinc/cp-kafka-rest:7.5.0',
            this.imageConfig.images.find(img => img.includes('kafka-ui')) || 'provectuslabs/kafka-ui:latest',
            this.imageConfig.images.find(img => img.includes('busybox')) || 'busybox:1.35'
        ];
        
        for (const image of requiredImages) {
            // Check if image exists in containerd
            if (await this.isImageInContainerd(image)) {
                this.logger.success(`✓ ${image} already in k0s containerd`);
                continue;
            }
            
            // Transfer from Docker to containerd
            if (!await this.transferImageToContainerd(image)) {
                throw new Error(`Failed to ensure ${image} is available in k0s containerd`);
            }
        }
        
        return true;
    }

    /**
     * Deploy Kafka complete using static manifest
     */
    async deployKafkaComplete() {
        this.logger.step('Deploying Kafka using static manifest...');
        
        try {
            const fs = require('fs');
            
            // Use static manifest file
            const manifestPath = path.join(__dirname, '..', 'config', 'manifests', 'kafka-k8s.yaml');
            let manifestContent = fs.readFileSync(manifestPath, 'utf8');
            
            // Update image versions if needed
            const kafkaImage = this.imageConfig.images.find(img => img.includes('cp-kafka') && !img.includes('rest')) || 'confluentinc/cp-kafka:7.5.0';
            const restImage = this.imageConfig.images.find(img => img.includes('kafka-rest')) || 'confluentinc/cp-kafka-rest:7.5.0';
            const uiImage = this.imageConfig.images.find(img => img.includes('kafka-ui')) || 'provectuslabs/kafka-ui:latest';
            const busyboxImage = this.imageConfig.images.find(img => img.includes('busybox')) || 'busybox:1.35';
            
            manifestContent = manifestContent.replace(/image: confluentinc\/cp-kafka:7\.5\.0/g, `image: ${kafkaImage}`);
            manifestContent = manifestContent.replace(/image: confluentinc\/cp-kafka-rest:7\.5\.0/g, `image: ${restImage}`);
            manifestContent = manifestContent.replace(/image: provectuslabs\/kafka-ui:latest/g, `image: ${uiImage}`);
            manifestContent = manifestContent.replace(/image: busybox:1\.35/g, `image: ${busyboxImage}`);
            
            if (!await this.kubectl.applyYaml(manifestContent, 'Kafka Complete (3 Deployments: Kafka + REST Proxy + UI)')) {
                return false;
            }
            
            this.logger.success('Kafka deployed using static manifest with imagePullPolicy: Never');
            this.logger.info('Deployment includes: Single-node KRaft Kafka + separate REST Proxy + UI Dashboard');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy Kafka: ${error.message}`);
            return false;
        }
    }

    /**
     * Wait for Kafka to be ready
     */
    async waitForKafka() {
        this.logger.progress('Waiting for Kafka to be ready...');
        this.logger.info('This may take 3-5 minutes for Kafka to initialize...');
        
        try {
            // Wait for deployment to be available
            this.logger.progress('Waiting for deployment to be ready...');
            const deploymentReady = await this.kubectl.waitForDeployment(this.namespace, 'kafka', 300);
            
            if (!deploymentReady) {
                this.logger.warn('Kafka deployment not ready within timeout');
                return false;
            }
            
            // Wait a bit more for Kafka to fully start
            this.logger.progress('Waiting for Kafka services to be fully operational...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second additional wait
            
            this.logger.success('Kafka is ready');
            return true;
        } catch (error) {
            this.logger.error(`Failed to wait for Kafka: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Kafka deployment
     */
    async verifyKafka() {
        this.logger.step('Verifying Kafka deployment...');
        
        try {
            // Check if Kafka broker is running
            const kafkaRunning = await this.kubectl.arePodsRunning(this.namespace, 'app=kafka');
            if (!kafkaRunning) {
                this.logger.warn('Kafka broker is not running');
                return false;
            }
            this.logger.success('Kafka broker is running');
            
            // Check if REST proxy is running
            const restRunning = await this.kubectl.arePodsRunning(this.namespace, 'app=kafka-rest-proxy');
            if (restRunning) {
                this.logger.success('Kafka REST proxy is running');
            } else {
                this.logger.warn('Kafka REST proxy is not running');
            }
            
            // Check if UI is running
            const uiRunning = await this.kubectl.arePodsRunning(this.namespace, 'app=kafka-ui');
            if (uiRunning) {
                this.logger.success('Kafka UI is running');
            } else {
                this.logger.warn('Kafka UI is not running');
            }
            
            return true;
        } catch (error) {
            this.logger.error(`Kafka verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get Kafka deployment status
     */
    async getKafkaStatus() {
        this.logger.step('Getting Kafka status...');
        
        try {
            // Get pod status
            this.logger.info('Kafka Pod Status:');
            await this.exec.run(
                `kubectl get pods -n ${this.namespace} -l app=kafka -o wide`,
                {},
                false
            );

            this.logger.newline();
            
            // Get service status
            this.logger.info('Kafka Service Status:');
            await this.exec.run(
                `kubectl get svc -n ${this.namespace} kafka-service kafka-nodeport`,
                {},
                false
            );

            this.logger.newline();
            
            // Get PVC status
            this.logger.info('Kafka Storage Status:');
            await this.exec.run(
                `kubectl get pvc -n ${this.namespace} kafka-pvc`,
                {},
                false
            );

            this.logger.newline();
            this.logger.config('Access Information', {
                'Kafka REST API': 'http://localhost/kafka',
                'Kafka UI Dashboard': 'http://localhost/kafka-ui',
                'Native Kafka Access': 'localhost:30092 (NodePort)',
                'Internal Cluster Access': 'kafka-service:9092',
                'Direct Pod Access': `kubectl port-forward -n ${this.namespace} deployment/kafka 9092:9092`,
                'REST API Test': 'curl http://localhost/kafka/topics'
            });

        } catch (error) {
            this.logger.error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Deploy complete Kafka workflow
     */
    async deploy() {
        try {
            if (!await this.initialize()) {
                return false;
            }

            // Execute deployment workflow
            const steps = [
                () => this.checkPrerequisites(),
                () => this.ensureImagesAvailable(),
                () => this.deployKafkaComplete(),
                () => this.waitForKafka()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Verify deployment
            if (await this.verifyKafka()) {
                await this.getKafkaStatus();
                this.logger.newline();
                this.logger.success('Kafka deployment completed successfully!');
                this.logger.info('Apache Kafka is deployed with KRaft mode, REST API, and UI dashboard');
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('Kafka deployment completed with warnings');
                this.logger.info('Kafka deployed but some components may need more time to initialize');
                await this.getKafkaStatus();
                return true; // Don't fail on verification warnings
            }

        } catch (error) {
            this.logger.error(`Kafka deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Cleanup Kafka resources
     */
    async cleanup() {
        this.logger.step('Cleaning up Kafka resources...');
        
        try {
            // Delete Kafka resources
            const resources = [
                'ingress/kafka-rest-ingress',
                'ingress/kafka-ui-ingress',
                'service/kafka-rest-service',
                'service/kafka-ui-service', 
                'service/kafka-service',
                'service/kafka-nodeport',
                'deployment/kafka-ui',
                'deployment/kafka-rest-proxy',
                'deployment/kafka',
                'pvc/kafka-pvc',
                'pv/kafka-pv'
            ];

            for (const resource of resources) {
                await this.exec.run(
                    `kubectl delete ${resource} -n ${this.namespace} --ignore-not-found=true`,
                    {},
                    true
                );
            }

            this.logger.success('Kafka resources cleaned up');
            return true;
        } catch (error) {
            this.logger.error(`Kafka cleanup failed: ${error.message}`);
            return false;
        }
    }
}

module.exports = KafkaDeployment;

// Allow direct execution
if (require.main === module) {
    const deployment = new KafkaDeployment();
    
    deployment.deploy().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}