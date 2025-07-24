/**
 * InfoMetis v0.4.0 - Traefik Deployment
 * JavaScript implementation of D1-traefik-only.sh
 * Deploys Traefik ingress controller for Kubernetes cluster
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const DockerUtil = require('../lib/docker/docker');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');
const path = require('path');

class TraefikDeployment {
    constructor() {
        this.logger = new Logger('Traefik Deployment');
        this.config = new ConfigUtil(this.logger);
        this.docker = new DockerUtil(this.logger);
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        
        this.clusterName = 'infometis';
        this.namespace = 'kube-system';
        this.cacheDir = null;
    }

    /**
     * Initialize deployment with configuration loading
     */
    async initialize() {
        try {
            this.logger.header('InfoMetis v0.4.0 - Traefik Deployment', 'JavaScript Native Implementation');
            
            // Load image configuration
            this.imageConfig = await this.config.loadImageConfig();
            
            // Set up cache directory path
            this.cacheDir = this.config.resolvePath('cache/images');
            
            this.logger.config('Traefik Configuration', {
                'Cluster Name': this.clusterName,
                'Namespace': this.namespace,
                'Cache Directory': this.cacheDir
            });
            
            return true;
        } catch (error) {
            this.logger.error(`Failed to initialize: ${error.message}`);
            return false;
        }
    }

    /**
     * Check prerequisites for Traefik deployment
     */
    async checkPrerequisites() {
        this.logger.step('Checking prerequisites...');
        
        try {
            // Check if kubectl is available
            if (!await this.kubectl.isAvailable()) {
                throw new Error('kubectl not available or cluster not accessible');
            }

            // Check if k0s container is running
            if (!await this.docker.isContainerRunning(this.clusterName)) {
                throw new Error('k0s container is not running. Deploy k0s cluster first.');
            }

            // Test kubectl access
            const result = await this.exec.run('kubectl get nodes', {}, true);
            if (!result.success) {
                throw new Error('kubectl cannot access cluster');
            }

            this.logger.success('Prerequisites verified');
            return true;
        } catch (error) {
            this.logger.error(`Prerequisites check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Load images from Docker into k0s containerd
     */
    async loadImagesIntoContainerd() {
        this.logger.step('Loading images from Docker into k0s containerd...');
        
        try {
            const image = this.imageConfig.images.find(img => img.includes('traefik')) || 'traefik:v2.9';
            
            // Export from Docker and import to k0s containerd
            const result = await this.exec.run(
                `docker save "${image}" | docker exec -i ${this.clusterName} k0s ctr -n k8s.io images import -`
            );
            
            if (result.success) {
                this.logger.success(`Image transferred to k0s: ${image}`);
                return true;
            } else {
                this.logger.error(`Failed to transfer image: ${result.stderr}`);
                return false;
            }
        } catch (error) {
            this.logger.error(`Image transfer failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Deploy Traefik complete using static manifest
     */
    async deployTraefikComplete() {
        this.logger.step('Deploying Traefik using static manifest...');
        
        try {
            const path = require('path');
            const fs = require('fs');
            
            // Use static manifest file
            const manifestPath = path.join(__dirname, '..', 'config', 'manifests', 'traefik-deployment.yaml');
            let manifestContent = fs.readFileSync(manifestPath, 'utf8');
            
            // Update image version if needed
            const image = this.imageConfig.images.find(img => img.includes('traefik')) || 'traefik:v2.9';
            manifestContent = manifestContent.replace(/image: traefik:v2\.9/g, `image: ${image}`);
            
            if (!await this.kubectl.applyYaml(manifestContent, 'Traefik Complete (RBAC, Deployment, Service, IngressClass)')) {
                return false;
            }
            
            this.logger.success('Traefik deployed using static manifest with imagePullPolicy: Never');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy Traefik: ${error.message}`);
            return false;
        }
    }

    /**
     * Wait for Traefik to be ready
     */
    async waitForTraefik() {
        this.logger.progress('Waiting for Traefik to be ready...');
        this.logger.info('This may take up to 5 minutes for Traefik to initialize...');
        
        try {
            // Wait for deployment to be available
            if (!await this.kubectl.waitForDeployment(this.namespace, 'traefik', 300)) {
                this.logger.warn('Traefik deployment not ready within timeout');
                return false;
            }

            this.logger.success('Traefik deployment is available');

            // Test Traefik dashboard access
            const dashboardReady = await this.exec.waitFor(
                async () => {
                    const result = await this.exec.run('curl -I http://localhost:8082', {}, true);
                    return result.success;
                },
                12, // 12 attempts
                5000, // 5 second intervals = 1 minute total
                'Traefik Dashboard'
            );

            if (dashboardReady) {
                this.logger.success('Traefik Dashboard is accessible');
                return true;
            } else {
                this.logger.warn('Traefik Dashboard may not be fully ready yet, but deployment is complete');
                return false;
            }
        } catch (error) {
            this.logger.error(`Failed waiting for Traefik: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Traefik deployment
     */
    async verifyTraefik() {
        this.logger.step('Verifying Traefik deployment...');
        
        try {
            // Check if deployment exists
            const deploymentResult = await this.exec.run(
                `kubectl get deployment traefik -n ${this.namespace}`,
                {},
                true
            );
            
            if (!deploymentResult.success) {
                this.logger.error('Traefik deployment not found');
                return false;
            }
            this.logger.success('Traefik deployment exists');

            // Check if pods are running
            if (!await this.kubectl.arePodsRunning(this.namespace, 'app=traefik')) {
                this.logger.error('Traefik pod not running');
                return false;
            }
            this.logger.success('Traefik pod is running');

            // Check if dashboard is accessible
            const dashboardResult = await this.exec.run('curl -I http://localhost:8082', {}, true);
            if (dashboardResult.success) {
                this.logger.success('Traefik Dashboard is accessible');
                return true;
            } else {
                this.logger.warn('Traefik Dashboard not accessible yet');
                return false;
            }
        } catch (error) {
            this.logger.error(`Traefik verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get Traefik status information
     */
    async getTraefikStatus() {
        this.logger.newline();
        this.logger.header('Traefik Status');
        
        try {
            // Get deployment status
            const deploymentResult = await this.exec.run(
                `kubectl get deployment traefik -n ${this.namespace}`,
                {},
                false
            );

            this.logger.newline();
            
            // Get pods status
            const podsResult = await this.exec.run(
                `kubectl get pods -n ${this.namespace} -l app=traefik`,
                {},
                false
            );

            this.logger.newline();
            
            // Get service status
            const serviceResult = await this.exec.run(
                `kubectl get service traefik -n ${this.namespace}`,
                {},
                false
            );

            this.logger.newline();
            this.logger.config('Access Information', {
                'Traefik Dashboard': 'http://localhost:8082/dashboard/',
                'Traefik API': 'http://localhost:8082/api/overview',
                'Web Entrypoint': 'http://localhost:80',
                'Secure Entrypoint': 'https://localhost:443',
                'Health Check': 'curl -I http://localhost:8082'
            });

        } catch (error) {
            this.logger.error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Deploy complete Traefik workflow
     */
    async deploy() {
        try {
            if (!await this.initialize()) {
                return false;
            }

            // Execute deployment workflow
            const steps = [
                () => this.checkPrerequisites(),
                () => this.loadImagesIntoContainerd(),
                () => this.deployTraefikComplete(),
                () => this.waitForTraefik()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Verify deployment
            if (await this.verifyTraefik()) {
                await this.getTraefikStatus();
                this.logger.newline();
                this.logger.success('Traefik deployment completed successfully!');
                this.logger.info('Traefik ingress controller is ready to route traffic');
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('Traefik deployment completed with warnings');
                this.logger.info('Traefik deployed but may need more time to fully initialize');
                await this.getTraefikStatus();
                return false;
            }

        } catch (error) {
            this.logger.error(`Deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean up Traefik deployment
     */
    async cleanup() {
        this.logger.header('Traefik Cleanup');
        
        try {
            const resources = [
                { type: 'deployment', name: 'traefik', namespace: this.namespace },
                { type: 'service', name: 'traefik', namespace: this.namespace },
                { type: 'ingressclass', name: 'traefik', namespace: '' },
                { type: 'clusterrolebinding', name: 'traefik-ingress-controller', namespace: '' },
                { type: 'clusterrole', name: 'traefik-ingress-controller', namespace: '' },
                { type: 'serviceaccount', name: 'traefik-ingress-controller', namespace: this.namespace }
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

            this.logger.success('Traefik cleanup completed');
            return true;
        } catch (error) {
            this.logger.error(`Cleanup failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use as module
module.exports = TraefikDeployment;

// Allow direct execution
if (require.main === module) {
    const deployment = new TraefikDeployment();
    
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