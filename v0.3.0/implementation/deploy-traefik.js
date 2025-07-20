/**
 * InfoMetis v0.3.0 - Traefik Deployment
 * JavaScript implementation of D1-traefik-only.sh
 * Deploys Traefik ingress controller for Kubernetes cluster
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const DockerUtil = require('../lib/docker/docker');
const KubectlUtil = require('../lib/kubectl/kubectl');
const KubernetesTemplates = require('../lib/kubectl/templates');
const ExecUtil = require('../lib/exec');
const path = require('path');

class TraefikDeployment {
    constructor() {
        this.logger = new Logger('Traefik Deployment');
        this.config = new ConfigUtil(this.logger);
        this.docker = new DockerUtil(this.logger);
        this.kubectl = new KubectlUtil(this.logger);
        this.templates = new KubernetesTemplates();
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
            this.logger.header('InfoMetis v0.3.0 - Traefik Deployment', 'JavaScript Native Implementation');
            
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
     * Load cached Traefik image
     */
    async loadCachedImages() {
        this.logger.step('Loading cached images...');
        
        const traefikImagePath = path.join(this.cacheDir, 'traefik-latest.tar');
        await this.docker.loadImage(traefikImagePath, 'Traefik');
        
        // Note: If image loading fails, Docker will pull from registry during container creation
        return true;
    }

    /**
     * Create Traefik ServiceAccount
     */
    async createServiceAccount() {
        this.logger.step('Creating Traefik ServiceAccount...');
        
        try {
            const serviceAccountManifest = this.templates.createServiceAccount({
                name: 'traefik',
                namespace: this.namespace,
                labels: { app: 'traefik' }
            });

            if (!await this.kubectl.applyYaml(serviceAccountManifest, 'Traefik ServiceAccount')) {
                return false;
            }

            this.logger.success('Traefik ServiceAccount created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to create ServiceAccount: ${error.message}`);
            return false;
        }
    }

    /**
     * Create Traefik ClusterRole
     */
    async createClusterRole() {
        this.logger.step('Creating Traefik ClusterRole...');
        
        try {
            const clusterRoleManifest = this.templates.createClusterRole({
                name: 'traefik',
                rules: [
                    {
                        apiGroups: [''],
                        resources: ['services', 'endpoints', 'secrets'],
                        verbs: ['get', 'list', 'watch']
                    },
                    {
                        apiGroups: ['extensions', 'networking.k8s.io'],
                        resources: ['ingresses', 'ingressclasses'],
                        verbs: ['get', 'list', 'watch']
                    },
                    {
                        apiGroups: ['extensions', 'networking.k8s.io'],
                        resources: ['ingresses/status'],
                        verbs: ['update']
                    }
                ],
                labels: { app: 'traefik' }
            });

            if (!await this.kubectl.applyYaml(clusterRoleManifest, 'Traefik ClusterRole')) {
                return false;
            }

            this.logger.success('Traefik ClusterRole created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to create ClusterRole: ${error.message}`);
            return false;
        }
    }

    /**
     * Create Traefik ClusterRoleBinding
     */
    async createClusterRoleBinding() {
        this.logger.step('Creating Traefik ClusterRoleBinding...');
        
        try {
            const clusterRoleBindingManifest = this.templates.createClusterRoleBinding({
                name: 'traefik',
                roleRef: {
                    apiGroup: 'rbac.authorization.k8s.io',
                    kind: 'ClusterRole',
                    name: 'traefik'
                },
                subjects: [
                    {
                        kind: 'ServiceAccount',
                        name: 'traefik',
                        namespace: this.namespace
                    }
                ],
                labels: { app: 'traefik' }
            });

            if (!await this.kubectl.applyYaml(clusterRoleBindingManifest, 'Traefik ClusterRoleBinding')) {
                return false;
            }

            this.logger.success('Traefik ClusterRoleBinding created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to create ClusterRoleBinding: ${error.message}`);
            return false;
        }
    }

    /**
     * Create Traefik IngressClass
     */
    async createIngressClass() {
        this.logger.step('Creating Traefik IngressClass...');
        
        try {
            const ingressClassManifest = this.templates.createIngressClass({
                name: 'traefik',
                controller: 'traefik.io/ingress-controller',
                labels: { app: 'traefik' }
            });

            if (!await this.kubectl.applyYaml(ingressClassManifest, 'Traefik IngressClass')) {
                return false;
            }

            this.logger.success('Traefik IngressClass created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to create IngressClass: ${error.message}`);
            return false;
        }
    }

    /**
     * Deploy Traefik application
     */
    async deployTraefik() {
        this.logger.step('Deploying Traefik ingress controller...');
        
        try {
            const deploymentManifest = this.templates.createDeployment({
                name: 'traefik',
                namespace: this.namespace,
                image: 'traefik:latest',
                replicas: 1,
                serviceAccountName: 'traefik',
                hostNetwork: true,
                args: [
                    '--api.insecure=true',
                    '--providers.kubernetesingress=true',
                    '--providers.kubernetesingress.ingressclass=traefik',
                    '--entrypoints.web.address=:80',
                    '--entrypoints.websecure.address=:443',
                    '--log.level=INFO'
                ],
                ports: [
                    { containerPort: 80, name: 'web', hostPort: 80 },
                    { containerPort: 443, name: 'websecure', hostPort: 443 },
                    { containerPort: 8080, name: 'admin', hostPort: 8080 }
                ],
                tolerations: [
                    {
                        key: 'node-role.kubernetes.io/control-plane',
                        effect: 'NoSchedule'
                    }
                ],
                labels: { app: 'traefik', version: 'v0.3.0' }
            });

            if (!await this.kubectl.applyYaml(deploymentManifest, 'Traefik Deployment')) {
                return false;
            }

            this.logger.success('Traefik deployment created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy Traefik: ${error.message}`);
            return false;
        }
    }

    /**
     * Create Traefik service
     */
    async createTraefikService() {
        this.logger.step('Creating Traefik Service...');
        
        try {
            const serviceManifest = this.templates.createService({
                name: 'traefik',
                namespace: this.namespace,
                selector: { app: 'traefik' },
                ports: [
                    { name: 'web', port: 80, targetPort: 80 },
                    { name: 'websecure', port: 443, targetPort: 443 },
                    { name: 'admin', port: 8080, targetPort: 8080 }
                ],
                type: 'ClusterIP',
                labels: { app: 'traefik' }
            });

            if (!await this.kubectl.applyYaml(serviceManifest, 'Traefik Service')) {
                return false;
            }

            this.logger.success('Traefik service created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to create service: ${error.message}`);
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
                    const result = await this.exec.run('curl -I http://localhost:8080', {}, true);
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
            const dashboardResult = await this.exec.run('curl -I http://localhost:8080', {}, true);
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
                'Traefik Dashboard': 'http://localhost:8080',
                'Web Entrypoint': 'http://localhost:80',
                'Secure Entrypoint': 'https://localhost:443',
                'Health Check': 'curl -I http://localhost:8080'
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
                () => this.loadCachedImages(),
                () => this.createServiceAccount(),
                () => this.createClusterRole(),
                () => this.createClusterRoleBinding(),
                () => this.createIngressClass(),
                () => this.deployTraefik(),
                () => this.createTraefikService(),
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
                this.logger.newline();
                this.logger.config('Next Steps', {
                    'Deploy NiFi': 'node deploy-nifi.js',
                    'Deploy Registry': 'node deploy-registry.js',
                    'Test Dashboard': 'curl -I http://localhost:8080'
                });
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
                { type: 'clusterrolebinding', name: 'traefik', namespace: '' },
                { type: 'clusterrole', name: 'traefik', namespace: '' },
                { type: 'serviceaccount', name: 'traefik', namespace: this.namespace }
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