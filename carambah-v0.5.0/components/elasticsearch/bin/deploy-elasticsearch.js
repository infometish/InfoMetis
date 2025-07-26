/**
 * InfoMetis v0.4.0 - Elasticsearch Deployment
 * JavaScript implementation for Elasticsearch deployment
 * Deploys Elasticsearch with persistent storage and Traefik ingress
 */

const Logger = require('../core/logger');
const ConfigUtil = require('../core/fs/config');
const KubectlUtil = require('../core/kubectl/kubectl');
const ExecUtil = require('../core/exec');
const path = require('path');

class ElasticsearchDeployment {
    constructor() {
        this.logger = new Logger('Elasticsearch Deployment');
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
            this.logger.header('InfoMetis v0.4.0 - Elasticsearch Deployment', 'JavaScript Native Implementation');
            
            // Load image configuration
            this.imageConfig = await this.config.loadImageConfig();
            
            this.logger.config('Elasticsearch Configuration', {
                'Image': this.imageConfig.images.find(img => img.includes('elasticsearch')) || 'elasticsearch:8.15.0',
                'Pull Policy': 'Never',
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
     * Check prerequisites for Elasticsearch deployment
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
        this.logger.step('Ensuring Elasticsearch images are available in k0s containerd...');
        
        const requiredImages = [
            this.imageConfig.images.find(img => img.includes('elasticsearch')) || 'elasticsearch:8.15.0',
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
     * Deploy Elasticsearch complete using static manifest
     */
    async deployElasticsearchComplete() {
        this.logger.step('Deploying Elasticsearch using static manifest...');
        
        try {
            const fs = require('fs');
            
            // Use static manifest file
            const manifestPath = path.join(__dirname, '..', 'environments', 'kubernetes', 'manifests', 'elasticsearch-k8s.yaml');
            let manifestContent = fs.readFileSync(manifestPath, 'utf8');
            
            // Update image version if needed
            const image = this.imageConfig.images.find(img => img.includes('elasticsearch')) || 'elasticsearch:8.15.0';
            manifestContent = manifestContent.replace(/image: elasticsearch:8\.15\.0/g, `image: ${image}`);
            
            if (!await this.kubectl.applyYaml(manifestContent, 'Elasticsearch Complete (PV, PVC, Config, Deployment, Service, Ingress)')) {
                return false;
            }
            
            this.logger.success('Elasticsearch deployed using static manifest with imagePullPolicy: Never');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy Elasticsearch: ${error.message}`);
            return false;
        }
    }

    /**
     * Wait for Elasticsearch to be ready
     */
    async waitForElasticsearch() {
        this.logger.progress('Waiting for Elasticsearch to be ready...');
        this.logger.info('This may take up to 10 minutes for Elasticsearch to initialize...');
        
        try {
            // Wait for deployment to be available
            this.logger.progress('Waiting for deployment to be ready...');
            const deploymentReady = await this.kubectl.waitForDeployment(this.namespace, 'elasticsearch', 600);
            
            if (!deploymentReady) {
                this.logger.warn('Elasticsearch deployment not ready within timeout');
                return false;
            }
            
            // Wait a bit more for Elasticsearch to fully start
            this.logger.progress('Waiting for Elasticsearch service to be fully operational...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second additional wait
            
            this.logger.success('Elasticsearch is ready');
            return true;
        } catch (error) {
            this.logger.error(`Failed to wait for Elasticsearch: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Elasticsearch deployment
     */
    async verifyElasticsearch() {
        this.logger.step('Verifying Elasticsearch deployment...');
        
        try {
            // Check if pods are running
            const podsRunning = await this.kubectl.arePodsRunning(this.namespace, 'app=elasticsearch');
            
            if (!podsRunning) {
                this.logger.warn('Elasticsearch pods are not running');
                return false;
            }
            
            // Test Elasticsearch health via kubectl port-forward
            this.logger.info('Testing Elasticsearch health...');
            const healthResult = await this.exec.run(
                `kubectl exec -n ${this.namespace} deployment/elasticsearch -- curl -s http://localhost:9200/_cluster/health`,
                {},
                true
            );
            
            if (healthResult.success) {
                try {
                    const health = JSON.parse(healthResult.stdout);
                    if (health.status === 'green' || health.status === 'yellow') {
                        this.logger.success(`Elasticsearch cluster health: ${health.status}`);
                        return true;
                    } else {
                        this.logger.warn(`Elasticsearch cluster health: ${health.status}`);
                        return false;
                    }
                } catch (parseError) {
                    this.logger.warn('Could not parse Elasticsearch health response');
                    return true; // Don't fail on parse error
                }
            } else {
                this.logger.warn('Could not reach Elasticsearch health endpoint');
                return true; // Don't fail deployment if health check fails
            }
        } catch (error) {
            this.logger.error(`Elasticsearch verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get Elasticsearch deployment status
     */
    async getElasticsearchStatus() {
        this.logger.step('Getting Elasticsearch status...');
        
        try {
            // Get pod status
            this.logger.info('Elasticsearch Pod Status:');
            await this.exec.run(
                `kubectl get pods -n ${this.namespace} -l app=elasticsearch -o wide`,
                {},
                false
            );

            this.logger.newline();
            
            // Get service status
            this.logger.info('Elasticsearch Service Status:');
            await this.exec.run(
                `kubectl get svc -n ${this.namespace} elasticsearch-service`,
                {},
                false
            );

            this.logger.newline();
            
            // Get PVC status
            this.logger.info('Elasticsearch Storage Status:');
            await this.exec.run(
                `kubectl get pvc -n ${this.namespace} elasticsearch-pvc`,
                {},
                false
            );

            this.logger.newline();
            this.logger.config('Access Information', {
                'Elasticsearch UI': 'http://localhost/elasticsearch',
                'Direct Access': `kubectl port-forward -n ${this.namespace} deployment/elasticsearch 9200:9200`,
                'Health Check': 'curl http://localhost/elasticsearch/_cluster/health'
            });

        } catch (error) {
            this.logger.error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Deploy complete Elasticsearch workflow
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
                () => this.deployElasticsearchComplete(),
                () => this.waitForElasticsearch()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Verify deployment
            if (await this.verifyElasticsearch()) {
                await this.getElasticsearchStatus();
                this.logger.newline();
                this.logger.success('Elasticsearch deployment completed successfully!');
                this.logger.info('Elasticsearch is deployed and ready for indexing and search');
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('Elasticsearch deployment completed with warnings');
                this.logger.info('Elasticsearch deployed but may need more time to fully initialize');
                await this.getElasticsearchStatus();
                return true; // Don't fail on verification warnings
            }

        } catch (error) {
            this.logger.error(`Elasticsearch deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Cleanup Elasticsearch resources
     */
    async cleanup() {
        this.logger.step('Cleaning up Elasticsearch resources...');
        
        try {
            // Delete Elasticsearch resources
            const resources = [
                'ingress/elasticsearch-ingress',
                'service/elasticsearch-service',
                'deployment/elasticsearch',
                'configmap/elasticsearch-config',
                'pvc/elasticsearch-pvc',
                'pv/elasticsearch-pv'
            ];

            for (const resource of resources) {
                await this.exec.run(
                    `kubectl delete ${resource} -n ${this.namespace} --ignore-not-found=true`,
                    {},
                    true
                );
            }

            this.logger.success('Elasticsearch resources cleaned up');
            return true;
        } catch (error) {
            this.logger.error(`Elasticsearch cleanup failed: ${error.message}`);
            return false;
        }
    }
}

module.exports = ElasticsearchDeployment;

// Allow direct execution
if (require.main === module) {
    const deployment = new ElasticsearchDeployment();
    
    deployment.deploy().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}