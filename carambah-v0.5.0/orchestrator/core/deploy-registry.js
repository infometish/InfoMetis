/**
 * InfoMetis v0.4.0 - Registry Deployment
 * JavaScript implementation of I1-deploy-registry.sh
 * Deploys NiFi Registry with persistent storage and Git integration support
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');

class RegistryDeployment {
    constructor() {
        this.logger = new Logger('Registry Deployment');
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
            this.logger.header('InfoMetis v0.4.0 - Registry Deployment', 'JavaScript Native Implementation');
            
            // Load image configuration
            this.imageConfig = await this.config.loadImageConfig();
            
            const registryImage = this.imageConfig.images.find(img => img.includes('nifi-registry')) || 'apache/nifi-registry:1.23.2';
            
            this.logger.config('Registry Configuration', {
                'Image': registryImage,
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
     * Check prerequisites for Registry deployment
     * Equivalent to check_prerequisites() bash function
     */
    async checkPrerequisites() {
        this.logger.step('Checking prerequisites...');
        
        try {
            // Check if kubectl is available
            if (!await this.kubectl.isAvailable()) {
                throw new Error('kubectl not available or cluster not accessible');
            }

            // Check if infometis namespace exists
            if (!await this.kubectl.namespaceExists(this.namespace)) {
                throw new Error(`${this.namespace} namespace not found`);
            }

            // Check if NiFi is running
            const nifiRunning = await this.kubectl.arePodsRunning(this.namespace, 'app=nifi');
            if (!nifiRunning) {
                throw new Error('NiFi not running. Deploy v0.1.0 foundation first.\n' +
                    '   Run: ./D1-deploy-v0.1.0-foundation.sh && ./D2-deploy-v0.1.0-infometis.sh');
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
                image,                                    // exact match: apache/nifi-registry:1.23.2
                `library/${image}`,                      // docker.io/library/apache/nifi-registry:1.23.2
                image.replace(':', ' ')                  // space-separated: apache/nifi-registry 1.23.2
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
        this.logger.step('Ensuring NiFi Registry images are available in k0s containerd...');
        
        const requiredImages = [
            this.imageConfig.images.find(img => img.includes('nifi-registry')) || 'apache/nifi-registry:1.23.2',
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
     * Deploy Registry using static manifests
     * Uses v0.4.0 static manifest approach
     */
    async deployRegistryComplete() {
        this.logger.step('Deploying NiFi Registry using v0.4.0 manifests...');
        
        try {
            const path = require('path');
            const fs = require('fs');
            
            // Use absolute path to v0.4.0 manifest
            const manifestPath = path.join(__dirname, '..', 'config', 'manifests', 'nifi-registry-k8s.yaml');
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            
            if (!await this.kubectl.applyYaml(manifestContent, 'Registry Complete (PV, PVC, Config, Deployment, Service)')) {
                return false;
            }

            this.logger.success('Registry deployed using v0.4.0 static manifests');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy Registry: ${error.message}`);
            return false;
        }
    }

    /**
     * Wait for Registry to be ready
     * Equivalent to wait_for_registry() bash function
     */
    async waitForRegistry() {
        this.logger.progress('Waiting for Registry to be ready...');
        this.logger.info('This may take up to 2 minutes as Registry initializes...');
        
        try {
            // Wait for deployment to be available using direct status check
            let attempts = 0;
            const maxAttempts = 24; // 2 minutes with 5 second intervals
            let deploymentReady = false;
            
            while (attempts < maxAttempts && !deploymentReady) {
                const statusResult = await this.exec.run(
                    `kubectl get deployment nifi-registry -n ${this.namespace} -o jsonpath='{.status.readyReplicas}'`,
                    {},
                    true
                );
                
                if (statusResult.success && statusResult.stdout.trim() === '1') {
                    deploymentReady = true;
                    break;
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    this.logger.info(`Waiting for deployment... (${attempts}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
            
            if (!deploymentReady) {
                this.logger.warn('Registry deployment not ready within timeout');
                return false;
            }

            this.logger.success('Registry deployment is available');

            // Wait for Registry API to be responsive
            const apiReady = await this.exec.waitFor(
                async () => {
                    const result = await this.kubectl.execInPod(
                        this.namespace,
                        'deployment/nifi-registry',
                        'curl -f http://localhost:18080/nifi-registry/',
                        true
                    );
                    return result.success;
                },
                24, // 24 attempts
                5000, // 5 second intervals = 2 minutes total
                'Registry API'
            );

            if (apiReady) {
                this.logger.success('Registry API is responsive');
                return true;
            } else {
                this.logger.warn('Registry API may not be fully ready yet, but deployment is complete');
                return false;
            }
        } catch (error) {
            this.logger.error(`Failed waiting for Registry: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Registry deployment
     * Equivalent to verify_registry() bash function
     */
    async verifyRegistry() {
        this.logger.step('Verifying Registry deployment...');
        
        try {
            // Check if deployment exists
            const deploymentResult = await this.exec.run(
                `kubectl get deployment nifi-registry -n ${this.namespace}`,
                {},
                true
            );
            
            if (!deploymentResult.success) {
                this.logger.error('Registry deployment not found');
                return false;
            }
            this.logger.success('Registry deployment exists');

            // Check if pods are running
            if (!await this.kubectl.arePodsRunning(this.namespace, 'app=nifi-registry')) {
                this.logger.error('Registry pod not running');
                return false;
            }
            this.logger.success('Registry pod is running');

            // Check if API is responsive
            const apiResult = await this.kubectl.execInPod(
                this.namespace,
                'deployment/nifi-registry',
                'curl -f http://localhost:18080/nifi-registry/',
                true
            );

            if (apiResult.success) {
                this.logger.success('Registry API is responsive');
                return true;
            } else {
                this.logger.warn('Registry API not responsive yet');
                return false;
            }
        } catch (error) {
            this.logger.error(`Registry verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get Registry status information
     * Equivalent to get_registry_status() bash function
     */
    async getRegistryStatus() {
        this.logger.newline();
        this.logger.header('Registry Status');
        
        try {
            // Get deployment status
            const deploymentResult = await this.exec.run(
                `kubectl get deployment nifi-registry -n ${this.namespace}`,
                {},
                false
            );

            this.logger.newline();
            
            // Get pods status
            const podsResult = await this.exec.run(
                `kubectl get pods -n ${this.namespace} -l app=nifi-registry`,
                {},
                false
            );

            this.logger.newline();
            
            // Get service status
            const serviceResult = await this.exec.run(
                `kubectl get service nifi-registry-service -n ${this.namespace}`,
                {},
                false
            );

            this.logger.newline();
            
            // Get PVC status
            const pvcResult = await this.exec.run(
                `kubectl get pvc nifi-registry-pvc -n ${this.namespace}`,
                {},
                false
            );

            this.logger.newline();
            this.logger.config('Access Information', {
                'Registry UI': 'http://localhost/nifi-registry',
                'Direct Access': `kubectl port-forward -n ${this.namespace} deployment/nifi-registry 18080:18080`,
                'Health Check': 'curl http://localhost/nifi-registry/'
            });

        } catch (error) {
            this.logger.error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Deploy complete Registry workflow
     * Equivalent to main() bash function
     */
    async deploy() {
        try {
            if (!await this.initialize()) {
                return false;
            }

            // Execute deployment workflow using static manifests only
            const steps = [
                () => this.checkPrerequisites(),
                () => this.ensureImagesAvailable(),
                () => this.deployRegistryComplete(),
                () => this.waitForRegistry()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Verify deployment
            if (await this.verifyRegistry()) {
                await this.getRegistryStatus();
                this.logger.newline();
                this.logger.success('Registry deployment completed successfully!');
                this.logger.info('NiFi Registry is deployed and ready for Git integration');
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('Registry deployment completed with warnings');
                this.logger.info('Registry deployed but may need more time to fully initialize');
                await this.getRegistryStatus();
                return false;
            }

        } catch (error) {
            this.logger.error(`Deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean up Registry deployment
     */
    async cleanup() {
        this.logger.header('Registry Cleanup');
        
        try {
            const resources = [
                { type: 'deployment', name: 'nifi-registry', namespace: this.namespace },
                { type: 'service', name: 'nifi-registry-service', namespace: this.namespace },
                { type: 'ingress', name: 'nifi-registry-ingress', namespace: this.namespace },
                { type: 'configmap', name: 'nifi-registry-config', namespace: this.namespace },
                { type: 'pvc', name: 'nifi-registry-pvc', namespace: this.namespace },
                { type: 'pv', name: 'nifi-registry-pv', namespace: '' }
            ];

            for (const resource of resources) {
                const nsFlag = resource.namespace ? `-n ${resource.namespace}` : '';
                const result = await this.exec.run(
                    `kubectl delete ${resource.type} ${resource.name} ${nsFlag} --ignore-not-found=true`,
                    {},
                    true
                );
                
                if (result.success) {
                    this.logger.success(`${resource.type}/${resource.name} removed`);
                }
            }

            this.logger.success('Registry cleanup completed');
            return true;
        } catch (error) {
            this.logger.error(`Cleanup failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use as module
module.exports = RegistryDeployment;

// Allow direct execution
if (require.main === module) {
    const deployment = new RegistryDeployment();
    deployment.deploy().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}