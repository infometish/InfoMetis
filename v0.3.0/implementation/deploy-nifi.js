/**
 * InfoMetis v0.3.0 - NiFi Deployment
 * JavaScript implementation of D2-deploy-v0.1.0-infometis.sh
 * Deploys Apache NiFi with persistent storage and Traefik ingress
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const DockerUtil = require('../lib/docker/docker');
const KubectlUtil = require('../lib/kubectl/kubectl');
const KubernetesTemplates = require('../lib/kubectl/templates');
const ExecUtil = require('../lib/exec');
const path = require('path');

class NiFiDeployment {
    constructor() {
        this.logger = new Logger('NiFi Deployment');
        this.config = new ConfigUtil(this.logger);
        this.docker = new DockerUtil(this.logger);
        this.kubectl = new KubectlUtil(this.logger);
        this.templates = new KubernetesTemplates();
        this.exec = new ExecUtil(this.logger);
        
        this.imageConfig = null;
        this.namespace = 'infometis';
        this.cacheDir = null;
    }

    /**
     * Initialize deployment with configuration loading
     */
    async initialize() {
        try {
            this.logger.header('InfoMetis v0.3.0 - NiFi Deployment', 'JavaScript Native Implementation');
            
            // Load image configuration
            this.imageConfig = await this.config.loadImageConfig();
            
            // Set up cache directory path
            this.cacheDir = this.config.resolvePath('cache/images');
            
            this.logger.config('NiFi Configuration', {
                'Image': this.imageConfig.NIFI_IMAGE || 'apache/nifi:1.23.2',
                'Pull Policy': this.imageConfig.IMAGE_PULL_POLICY || 'IfNotPresent',
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
     * Check prerequisites for NiFi deployment
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
                throw new Error(`${this.namespace} namespace not found. Deploy k0s cluster first.`);
            }

            // Check if Traefik is running
            const traefikRunning = await this.kubectl.arePodsRunning('kube-system', 'app=traefik');
            if (!traefikRunning) {
                throw new Error('Traefik not running. Deploy Traefik ingress controller first.');
            }

            this.logger.success('Prerequisites verified');
            return true;
        } catch (error) {
            this.logger.error(`Prerequisites check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Load cached NiFi image
     */
    async loadCachedImages() {
        this.logger.step('Loading cached images...');
        
        const nifiImagePath = path.join(this.cacheDir, 'apache-nifi-1.23.2.tar');
        await this.docker.loadImage(nifiImagePath, 'NiFi');
        
        // Note: If image loading fails, Docker will pull from registry during container creation
        return true;
    }

    /**
     * Setup NiFi persistent storage
     */
    async setupNiFiStorage() {
        this.logger.step('Setting up NiFi persistent storage...');
        
        try {
            // Create directories with proper permissions (fix for v0.3.0 permission issue)
            this.logger.step('Creating NiFi storage directories with permissions...');
            
            const storagePaths = [
                '/var/lib/k0s/nifi-content-data',
                '/var/lib/k0s/nifi-database-data', 
                '/var/lib/k0s/nifi-flowfile-data',
                '/var/lib/k0s/nifi-provenance-data'
            ];
            
            // Create directories inside k0s container
            const mkdirResult = await this.exec.run(
                `docker exec infometis mkdir -p ${storagePaths.join(' ')}`,
                {},
                true
            );
            
            if (!mkdirResult.success) {
                this.logger.error('Failed to create NiFi storage directories');
                return false;
            }
            
            // Set proper permissions (777 for all users)
            const chmodResult = await this.exec.run(
                `docker exec infometis chmod 777 ${storagePaths.join(' ')}`,
                {},
                true
            );
            
            if (!chmodResult.success) {
                this.logger.error('Failed to set directory permissions');
                return false;
            }
            
            this.logger.success('Storage directories created with proper permissions');
            
            // Create PersistentVolumes for NiFi data
            const pvConfigs = [
                { name: 'nifi-content-pv', capacity: '5Gi', hostPath: '/var/lib/k0s/nifi-content-data' },
                { name: 'nifi-database-pv', capacity: '1Gi', hostPath: '/var/lib/k0s/nifi-database-data' },
                { name: 'nifi-flowfile-pv', capacity: '2Gi', hostPath: '/var/lib/k0s/nifi-flowfile-data' },
                { name: 'nifi-provenance-pv', capacity: '3Gi', hostPath: '/var/lib/k0s/nifi-provenance-data' }
            ];

            for (const pvConfig of pvConfigs) {
                const pvManifest = this.templates.createPersistentVolume({
                    name: pvConfig.name,
                    capacity: pvConfig.capacity,
                    storageClassName: 'local-storage',
                    hostPath: pvConfig.hostPath,
                    accessModes: ['ReadWriteOnce'],
                    reclaimPolicy: 'Retain'
                });

                if (!await this.kubectl.applyYaml(pvManifest, `NiFi PersistentVolume ${pvConfig.name}`)) {
                    return false;
                }
            }

            // Create PersistentVolumeClaims for NiFi data
            const pvcConfigs = [
                { name: 'nifi-content-repository', capacity: '5Gi' },
                { name: 'nifi-database-repository', capacity: '1Gi' },
                { name: 'nifi-flowfile-repository', capacity: '2Gi' },
                { name: 'nifi-provenance-repository', capacity: '3Gi' }
            ];

            for (const pvcConfig of pvcConfigs) {
                const pvcManifest = this.templates.createPersistentVolumeClaim({
                    name: pvcConfig.name,
                    namespace: this.namespace,
                    capacity: pvcConfig.capacity,
                    storageClassName: 'local-storage',
                    accessModes: ['ReadWriteOnce'],
                    labels: { app: 'nifi' }
                });

                if (!await this.kubectl.applyYaml(pvcManifest, `NiFi PersistentVolumeClaim ${pvcConfig.name}`)) {
                    return false;
                }
            }

            this.logger.success('NiFi storage configured');
            return true;
        } catch (error) {
            this.logger.error(`Failed to setup storage: ${error.message}`);
            return false;
        }
    }

    /**
     * Create NiFi service
     */
    async createNiFiService() {
        this.logger.step('Creating NiFi Service...');
        
        try {
            const serviceManifest = this.templates.createService({
                name: 'nifi-service',
                namespace: this.namespace,
                selector: { app: 'nifi' },
                ports: [
                    { name: 'http', port: 8080, targetPort: 8080, protocol: 'TCP' }
                ],
                type: 'ClusterIP',
                labels: { app: 'nifi' }
            });

            if (!await this.kubectl.applyYaml(serviceManifest, 'NiFi Service')) {
                return false;
            }

            this.logger.success('NiFi service created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to create service: ${error.message}`);
            return false;
        }
    }

    /**
     * Deploy NiFi StatefulSet
     */
    async deployNiFi() {
        this.logger.step('Deploying NiFi StatefulSet...');
        
        try {
            const nifiImage = this.imageConfig.NIFI_IMAGE || 'apache/nifi:1.23.2';
            const pullPolicy = this.imageConfig.IMAGE_PULL_POLICY || 'IfNotPresent';

            const statefulSetManifest = this.templates.createStatefulSet({
                name: 'nifi',
                namespace: this.namespace,
                image: nifiImage,
                replicas: 1,
                serviceName: 'nifi-service',
                ports: [
                    { containerPort: 8080, name: 'http' }
                ],
                env: [
                    { name: 'NIFI_WEB_HTTP_PORT', value: '8080' },
                    { name: 'NIFI_WEB_HTTP_HOST', value: '0.0.0.0' },
                    { name: 'SINGLE_USER_CREDENTIALS_USERNAME', value: 'admin' },
                    { name: 'SINGLE_USER_CREDENTIALS_PASSWORD', value: 'adminadminadmin' },
                    { name: 'NIFI_SENSITIVE_PROPS_KEY', value: 'changeme1234567890A' }
                ],
                volumeMounts: [
                    { name: 'nifi-content-repository', mountPath: '/opt/nifi/nifi-current/content_repository' },
                    { name: 'nifi-database-repository', mountPath: '/opt/nifi/nifi-current/database_repository' },
                    { name: 'nifi-flowfile-repository', mountPath: '/opt/nifi/nifi-current/flowfile_repository' },
                    { name: 'nifi-provenance-repository', mountPath: '/opt/nifi/nifi-current/provenance_repository' }
                ],
                volumes: [
                    { name: 'nifi-content-repository', persistentVolumeClaim: { claimName: 'nifi-content-repository' } },
                    { name: 'nifi-database-repository', persistentVolumeClaim: { claimName: 'nifi-database-repository' } },
                    { name: 'nifi-flowfile-repository', persistentVolumeClaim: { claimName: 'nifi-flowfile-repository' } },
                    { name: 'nifi-provenance-repository', persistentVolumeClaim: { claimName: 'nifi-provenance-repository' } }
                ],
                resources: {
                    requests: { memory: '2Gi', cpu: '500m' },
                    limits: { memory: '4Gi', cpu: '2' }
                },
                probes: {
                    readinessProbe: {
                        path: '/nifi/',
                        port: 8080,
                        scheme: 'HTTP',
                        initialDelaySeconds: 60,
                        periodSeconds: 30,
                        timeoutSeconds: 10,
                        successThreshold: 1,
                        failureThreshold: 3
                    },
                    livenessProbe: {
                        path: '/nifi/',
                        port: 8080,
                        scheme: 'HTTP',
                        initialDelaySeconds: 120,
                        periodSeconds: 60,
                        timeoutSeconds: 10,
                        successThreshold: 1,
                        failureThreshold: 3
                    }
                },
                tolerations: [
                    {
                        key: 'node-role.kubernetes.io/master',
                        effect: 'NoSchedule'
                    },
                    {
                        key: 'node-role.kubernetes.io/control-plane',
                        effect: 'NoSchedule'
                    }
                ],
                labels: { app: 'nifi', version: 'v0.3.0' }
            });

            if (!await this.kubectl.applyYaml(statefulSetManifest, 'NiFi StatefulSet')) {
                return false;
            }

            this.logger.success('NiFi StatefulSet created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to deploy NiFi: ${error.message}`);
            return false;
        }
    }

    /**
     * Create NiFi ingress
     */
    async createNiFiIngress() {
        this.logger.step('Creating NiFi Ingress...');
        
        try {
            const ingressManifest = this.templates.createIngress({
                name: 'nifi-ingress',
                namespace: this.namespace,
                annotations: {
                    'kubernetes.io/ingress.class': 'traefik'
                },
                rules: [
                    {
                        host: 'localhost',
                        paths: [
                            {
                                path: '/nifi',
                                pathType: 'Prefix',
                                service: { name: 'nifi-service', port: 8080 }
                            }
                        ]
                    }
                ],
                labels: { app: 'nifi' }
            });

            if (!await this.kubectl.applyYaml(ingressManifest, 'NiFi Ingress')) {
                return false;
            }

            this.logger.success('NiFi ingress created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to create ingress: ${error.message}`);
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
            if (!await this.kubectl.waitForStatefulSet(this.namespace, 'nifi', 600)) {
                this.logger.warn('NiFi StatefulSet not ready within timeout');
                return false;
            }

            this.logger.success('NiFi StatefulSet is ready');

            // Wait for NiFi API to be responsive
            const apiReady = await this.exec.waitFor(
                async () => {
                    const result = await this.kubectl.execInPod(
                        this.namespace,
                        'statefulset/nifi',
                        'curl -f http://localhost:8080/nifi/',
                        true
                    );
                    return result.success;
                },
                60, // 60 attempts
                10000, // 10 second intervals = 10 minutes total
                'NiFi API'
            );

            if (apiReady) {
                this.logger.success('NiFi API is responsive');
                return true;
            } else {
                this.logger.warn('NiFi API may not be fully ready yet, but StatefulSet is complete');
                return false;
            }
        } catch (error) {
            this.logger.error(`Failed waiting for NiFi: ${error.message}`);
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
                'Password': 'adminadminadmin',
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
                () => this.loadCachedImages(),
                () => this.setupNiFiStorage(),
                () => this.createNiFiService(),
                () => this.deployNiFi(),
                () => this.createNiFiIngress(),
                () => this.waitForNiFi()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Verify deployment
            const verified = await this.verifyNiFi();
            const uiTested = await this.testNiFiUI();

            if (verified && uiTested) {
                await this.getNiFiStatus();
                this.logger.newline();
                this.logger.success('NiFi deployment completed successfully!');
                this.logger.info('Apache NiFi is deployed and ready for data flow development');
                this.logger.newline();
                this.logger.config('Next Steps', {
                    'Deploy Registry': 'node deploy-registry.js',
                    'Create Data Flow': 'Access NiFi UI at http://localhost/nifi',
                    'API Access': 'Use NiFi REST API for automation'
                });
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('NiFi deployment completed with warnings');
                this.logger.info('NiFi deployed but may need more time to fully initialize');
                await this.getNiFiStatus();
                return false;
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