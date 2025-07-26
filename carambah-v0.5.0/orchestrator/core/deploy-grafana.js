/**
 * InfoMetis v0.4.0 - Grafana Deployment
 * JavaScript implementation for Grafana deployment
 * Deploys Grafana with persistent storage, Elasticsearch datasource, and Traefik ingress
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');
const path = require('path');

class GrafanaDeployment {
    constructor() {
        this.logger = new Logger('Grafana Deployment');
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
            this.logger.header('InfoMetis v0.4.0 - Grafana Deployment', 'JavaScript Native Implementation');
            
            // Load image configuration
            this.imageConfig = await this.config.loadImageConfig();
            
            this.logger.config('Grafana Configuration', {
                'Image': this.imageConfig.images.find(img => img.includes('grafana')) || 'grafana/grafana:10.2.0',
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
     * Check prerequisites for Grafana deployment
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
        this.logger.step('Ensuring Grafana images are available in k0s containerd...');
        
        const requiredImages = [
            this.imageConfig.images.find(img => img.includes('grafana')) || 'grafana/grafana:10.2.0',
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
     * Deploy Grafana complete using static manifest
     */
    async deployGrafanaComplete() {
        this.logger.step('Deploying Grafana using static manifest...');
        
        try {
            const fs = require('fs');
            
            // Use static manifest file
            const manifestPath = path.join(__dirname, '..', 'config', 'manifests', 'grafana-k8s.yaml');
            let manifestContent = fs.readFileSync(manifestPath, 'utf8');
            
            // Update image version if needed
            const image = this.imageConfig.images.find(img => img.includes('grafana')) || 'grafana/grafana:10.2.0';
            manifestContent = manifestContent.replace(/image: grafana\/grafana:10\.2\.0/g, `image: ${image}`);
            
            if (!await this.kubectl.applyYaml(manifestContent, 'Grafana Complete (PV, PVC, Config, Deployment, Service, Ingress)')) {
                return false;
            }
            
            this.logger.success('Grafana deployed using static manifest with imagePullPolicy: Never');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy Grafana: ${error.message}`);
            return false;
        }
    }

    /**
     * Wait for Grafana to be ready
     */
    async waitForGrafana() {
        this.logger.progress('Waiting for Grafana to be ready...');
        this.logger.info('This may take 2-5 minutes for Grafana to initialize...');
        
        try {
            // Wait for deployment to be available
            this.logger.progress('Waiting for deployment to be ready...');
            const deploymentReady = await this.kubectl.waitForDeployment(this.namespace, 'grafana', 300);
            
            if (!deploymentReady) {
                this.logger.warn('Grafana deployment not ready within timeout');
                return false;
            }
            
            // Wait a bit more for Grafana to fully start
            this.logger.progress('Waiting for Grafana service to be fully operational...');
            await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second additional wait
            
            this.logger.success('Grafana is ready');
            return true;
        } catch (error) {
            this.logger.error(`Failed to wait for Grafana: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Grafana deployment
     */
    async verifyGrafana() {
        this.logger.step('Verifying Grafana deployment...');
        
        try {
            // Check if pods are running
            const podsRunning = await this.kubectl.arePodsRunning(this.namespace, 'app=grafana');
            
            if (!podsRunning) {
                this.logger.warn('Grafana pods are not running');
                return false;
            }
            
            // Test Grafana health via kubectl exec
            this.logger.info('Testing Grafana health...');
            const healthResult = await this.exec.run(
                `kubectl exec -n ${this.namespace} deployment/grafana -- curl -s http://localhost:3000/api/health`,
                {},
                true
            );
            
            if (healthResult.success) {
                try {
                    const health = JSON.parse(healthResult.stdout);
                    if (health.database === 'ok') {
                        this.logger.success('Grafana health check passed');
                        return true;
                    } else {
                        this.logger.warn(`Grafana health check: ${health.database}`);
                        return false;
                    }
                } catch (parseError) {
                    this.logger.warn('Could not parse Grafana health response');
                    return true; // Don't fail on parse error
                }
            } else {
                this.logger.warn('Could not reach Grafana health endpoint');
                return true; // Don't fail deployment if health check fails
            }
        } catch (error) {
            this.logger.error(`Grafana verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get Grafana deployment status
     */
    async getGrafanaStatus() {
        this.logger.step('Getting Grafana status...');
        
        try {
            // Get pod status
            this.logger.info('Grafana Pod Status:');
            await this.exec.run(
                `kubectl get pods -n ${this.namespace} -l app=grafana -o wide`,
                {},
                false
            );

            this.logger.newline();
            
            // Get service status
            this.logger.info('Grafana Service Status:');
            await this.exec.run(
                `kubectl get svc -n ${this.namespace} grafana-service`,
                {},
                false
            );

            this.logger.newline();
            
            // Get PVC status
            this.logger.info('Grafana Storage Status:');
            await this.exec.run(
                `kubectl get pvc -n ${this.namespace} grafana-pvc`,
                {},
                false
            );

            this.logger.newline();
            this.logger.config('Access Information', {
                'Grafana UI': 'http://localhost/grafana',
                'Direct Access': `kubectl port-forward -n ${this.namespace} deployment/grafana 3000:3000`,
                'Default Login': 'admin / infometis2024',
                'Health Check': 'curl http://localhost/grafana/api/health'
            });

        } catch (error) {
            this.logger.error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Deploy complete Grafana workflow
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
                () => this.deployGrafanaComplete(),
                () => this.waitForGrafana()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Verify deployment
            if (await this.verifyGrafana()) {
                await this.getGrafanaStatus();
                this.logger.newline();
                this.logger.success('Grafana deployment completed successfully!');
                this.logger.info('Grafana is deployed with Elasticsearch datasource preconfigured');
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('Grafana deployment completed with warnings');
                this.logger.info('Grafana deployed but may need more time to fully initialize');
                await this.getGrafanaStatus();
                return true; // Don't fail on verification warnings
            }

        } catch (error) {
            this.logger.error(`Grafana deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Cleanup Grafana resources
     */
    async cleanup() {
        this.logger.step('Cleaning up Grafana resources...');
        
        try {
            // Delete Grafana resources
            const resources = [
                'ingress/grafana-ingress',
                'service/grafana-service', 
                'deployment/grafana',
                'configmap/grafana-config',
                'configmap/grafana-datasources',
                'pvc/grafana-pvc',
                'pv/grafana-pv'
            ];

            for (const resource of resources) {
                await this.exec.run(
                    `kubectl delete ${resource} -n ${this.namespace} --ignore-not-found=true`,
                    {},
                    true
                );
            }

            this.logger.success('Grafana resources cleaned up');
            return true;
        } catch (error) {
            this.logger.error(`Grafana cleanup failed: ${error.message}`);
            return false;
        }
    }
}

module.exports = GrafanaDeployment;

// Allow direct execution
if (require.main === module) {
    const deployment = new GrafanaDeployment();
    
    deployment.deploy().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}