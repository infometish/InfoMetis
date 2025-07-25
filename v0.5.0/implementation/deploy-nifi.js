/**
 * InfoMetis v0.4.0 - NiFi Deployment
 * JavaScript implementation for NiFi deployment using static manifests
 * Deploys Apache NiFi with persistent storage and Traefik ingress
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');
const path = require('path');

class NiFiDeployment {
    constructor() {
        this.logger = new Logger('NiFi Deployment');
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
            this.logger.header('InfoMetis v0.4.0 - NiFi Deployment', 'JavaScript Native Implementation');
            
            // Load image configuration
            this.imageConfig = await this.config.loadImageConfig();
            
            this.logger.config('NiFi Configuration', {
                'Image': this.imageConfig.images.find(img => img.includes('nifi') && !img.includes('registry')) || 'apache/nifi:1.23.2',
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
     * Check prerequisites for NiFi deployment
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
                image,                                    // exact match: apache/nifi:1.23.2
                `library/${image}`,                      // docker.io/library/apache/nifi:1.23.2
                image.replace(':', ' ')                  // space-separated: apache/nifi 1.23.2
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
     * Ensure NiFi image is available in k0s containerd
     */
    async ensureImageAvailable() {
        this.logger.step('Ensuring NiFi image is available in k0s containerd...');
        
        const image = this.imageConfig.images.find(img => img.includes('nifi') && !img.includes('registry')) || 'apache/nifi:1.23.2';
        
        // Check if image exists in containerd
        if (await this.isImageInContainerd(image)) {
            this.logger.success(`✓ ${image} already in k0s containerd`);
            return true;
        }
        
        // Transfer from Docker to containerd
        return await this.transferImageToContainerd(image);
    }

    /**
     * Setup NiFi storage directories
     */
    async setupNiFiStorage() {
        this.logger.step('Setting up NiFi storage directories...');
        
        try {
            const storagePaths = [
                '/var/lib/k0s/nifi-content-data',
                '/var/lib/k0s/nifi-database-data', 
                '/var/lib/k0s/nifi-flowfile-data',
                '/var/lib/k0s/nifi-provenance-data'
            ];
            
            // Create directories inside k0s container
            const mkdirResult = await this.exec.run(
                `docker exec ${this.clusterName} mkdir -p ${storagePaths.join(' ')}`,
                {},
                true
            );
            
            if (!mkdirResult.success) {
                this.logger.error('Failed to create NiFi storage directories');
                return false;
            }
            
            // Set proper permissions (777 for all users)
            const chmodResult = await this.exec.run(
                `docker exec ${this.clusterName} chmod 777 ${storagePaths.join(' ')}`,
                {},
                true
            );
            
            if (!chmodResult.success) {
                this.logger.error('Failed to set directory permissions');
                return false;
            }
            
            this.logger.success('Storage directories created with proper permissions');
            return true;
        } catch (error) {
            this.logger.error(`Failed to setup storage: ${error.message}`);
            return false;
        }
    }


    /**
     * Deploy NiFi complete using static manifest
     */
    async deployNiFiComplete() {
        this.logger.step('Deploying NiFi using static manifest...');
        
        try {
            const fs = require('fs');
            
            // Use static manifest file
            const manifestPath = path.join(__dirname, '..', 'config', 'manifests', 'nifi-k8s.yaml');
            let manifestContent = fs.readFileSync(manifestPath, 'utf8');
            
            // Update image version if needed
            const image = this.imageConfig.images.find(img => img.includes('nifi') && !img.includes('registry')) || 'apache/nifi:1.23.2';
            manifestContent = manifestContent.replace(/image: apache\/nifi:1\.23\.2/g, `image: ${image}`);
            
            if (!await this.kubectl.applyYaml(manifestContent, 'NiFi Complete (PV, PVC, Service, StatefulSet, Ingress)')) {
                return false;
            }
            
            this.logger.success('NiFi deployed using static manifest with imagePullPolicy: Never');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy NiFi: ${error.message}`);
            return false;
        }
    }


    /**
     * Wait for NiFi to be ready
     */
    async waitForNiFi() {
        this.logger.progress('Waiting for NiFi to be ready...');
        this.logger.info('This may take up to 10 minutes for NiFi to initialize...');
        
        try {
            // Wait for StatefulSet to be ready
            const statefulSetReady = await this.kubectl.waitForStatefulSet(this.namespace, 'nifi', 600);
            
            if (!statefulSetReady) {
                this.logger.warn('NiFi StatefulSet not ready within timeout');
                return false;
            }
            
            // Wait a bit more for NiFi to fully start
            this.logger.progress('Waiting for NiFi service to be fully operational...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second additional wait
            
            this.logger.success('NiFi is ready');
            return true;
        } catch (error) {
            this.logger.error(`Failed to wait for NiFi: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify NiFi deployment
     */
    async verifyNiFi() {
        this.logger.step('Verifying NiFi deployment...');
        
        try {
            // Check if StatefulSet exists
            const statefulSetResult = await this.exec.run(
                `kubectl get statefulset nifi -n ${this.namespace}`,
                {},
                true
            );
            
            if (!statefulSetResult.success) {
                this.logger.error('NiFi StatefulSet not found');
                return false;
            }
            this.logger.success('NiFi StatefulSet exists');

            // Check if pods are running
            if (!await this.kubectl.arePodsRunning(this.namespace, 'app=nifi')) {
                this.logger.error('NiFi pod not running');
                return false;
            }
            this.logger.success('NiFi pod is running');

            // Check if API is responsive
            const apiResult = await this.kubectl.execInPod(
                this.namespace,
                'statefulset/nifi',
                'curl -f http://localhost:8080/nifi/',
                true
            );

            if (apiResult.success) {
                this.logger.success('NiFi API is responsive');
                return true;
            } else {
                this.logger.warn('NiFi API not responsive yet');
                return false;
            }
        } catch (error) {
            this.logger.error(`NiFi verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test NiFi UI access
     */
    async testNiFiUI() {
        this.logger.step('Testing NiFi UI access...');
        
        try {
            // Test direct access via ingress
            const uiResult = await this.exec.run('curl -I http://localhost/nifi/', {}, true);
            
            if (uiResult.success) {
                this.logger.success('NiFi UI accessible via Traefik');
                return true;
            } else {
                this.logger.warn('NiFi UI not accessible via Traefik yet');
                return false;
            }
        } catch (error) {
            this.logger.error(`NiFi UI test failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get NiFi status information
     */
    async getNiFiStatus() {
        this.logger.newline();
        this.logger.header('NiFi Status');
        
        try {
            // Get StatefulSet status
            const statefulSetResult = await this.exec.run(
                `kubectl get statefulset nifi -n ${this.namespace}`,
                {},
                false
            );

            this.logger.newline();
            
            // Get pods status
            const podsResult = await this.exec.run(
                `kubectl get pods -n ${this.namespace} -l app=nifi`,
                {},
                false
            );

            this.logger.newline();
            
            // Get service status
            const serviceResult = await this.exec.run(
                `kubectl get service nifi-service -n ${this.namespace}`,
                {},
                false
            );

            this.logger.newline();
            
            // Get PVC status
            const pvcResult = await this.exec.run(
                `kubectl get pvc -n ${this.namespace}`,
                {},
                false
            );

            this.logger.newline();
            
            // Get ingress status
            const ingressResult = await this.exec.run(
                `kubectl get ingress nifi-ingress -n ${this.namespace}`,
                {},
                false
            );

            this.logger.newline();
            this.logger.config('Access Information', {
                'NiFi UI': 'http://localhost/nifi',
                'Username': 'admin',
                'Password': 'infometis2024',
                'Direct Access': `kubectl port-forward -n ${this.namespace} statefulset/nifi 8080:8080`,
                'Health Check': 'curl http://localhost/nifi/'
            });

        } catch (error) {
            this.logger.error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Deploy complete NiFi workflow
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
                () => this.setupNiFiStorage(),
                () => this.deployNiFiComplete(),
                () => this.waitForNiFi()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Verify deployment
            if (await this.verifyNiFi()) {
                await this.getNiFiStatus();
                this.logger.newline();
                this.logger.success('NiFi deployment completed successfully!');
                this.logger.info('Apache NiFi is deployed and ready for data flow development');
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('NiFi deployment completed with warnings');
                this.logger.info('NiFi deployed but may need more time to fully initialize');
                await this.getNiFiStatus();
                return true; // Don't fail on verification warnings
            }

        } catch (error) {
            this.logger.error(`Deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean up NiFi deployment
     */
    async cleanup() {
        this.logger.header('NiFi Cleanup');
        
        try {
            const resources = [
                { type: 'statefulset', name: 'nifi', namespace: this.namespace },
                { type: 'service', name: 'nifi-service', namespace: this.namespace },
                { type: 'ingress', name: 'nifi-ingress', namespace: this.namespace },
                { type: 'pvc', name: 'nifi-content-repository', namespace: this.namespace },
                { type: 'pvc', name: 'nifi-database-repository', namespace: this.namespace },
                { type: 'pvc', name: 'nifi-flowfile-repository', namespace: this.namespace },
                { type: 'pvc', name: 'nifi-provenance-repository', namespace: this.namespace },
                { type: 'pv', name: 'nifi-content-pv', namespace: '' },
                { type: 'pv', name: 'nifi-database-pv', namespace: '' },
                { type: 'pv', name: 'nifi-flowfile-pv', namespace: '' },
                { type: 'pv', name: 'nifi-provenance-pv', namespace: '' }
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

            this.logger.success('NiFi cleanup completed');
            return true;
        } catch (error) {
            this.logger.error(`Cleanup failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use as module
module.exports = NiFiDeployment;

// Allow direct execution
if (require.main === module) {
    const deployment = new NiFiDeployment();
    
    // Handle command line arguments
    const args = process.argv.slice(2);
    if (args.includes('cleanup')) {
        deployment.cleanup().then(success => {
            process.exit(success ? 0 : 1);
        });
    } else {
        deployment.deploy().then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}