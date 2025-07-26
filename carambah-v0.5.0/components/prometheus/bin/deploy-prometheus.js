/**
 * InfoMetis v0.5.0 - Prometheus Deployment
 * JavaScript deployment module for Prometheus, Alertmanager, and Node Exporter
 */

const Logger = require('../core/logger');
const KubectlUtil = require('../core/kubectl/kubectl');
const ExecUtil = require('../core/exec');
const ConfigUtil = require('../core/fs/config');
const path = require('path');

class PrometheusDeployment {
    constructor() {
        this.logger = new Logger('Prometheus Deployment');
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        this.config = new ConfigUtil(this.logger);
        
        this.manifestsPath = path.resolve(__dirname, '../environments/kubernetes/manifests');
        this.prometheusManifest = path.join(this.manifestsPath, 'prometheus-k8s.yaml');
        this.ingressManifest = path.join(this.manifestsPath, 'prometheus-ingress.yaml');
        
        // Prometheus required images
        this.requiredImages = [
            'prom/prometheus:v2.47.0',
            'prom/alertmanager:v0.25.1',
            'prom/node-exporter:v1.6.1'
        ];
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
                    `docker exec infometis /usr/local/bin/k0s ctr images list | grep "${pattern}"`,
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
                `docker save "${image}" | docker exec -i infometis /usr/local/bin/k0s ctr images import -`,
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
        this.logger.step('Ensuring Prometheus images are available in k0s containerd...');
        
        for (const image of this.requiredImages) {
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
    }

    /**
     * Deploy Prometheus monitoring stack
     */
    async deploy() {
        try {
            this.logger.header('InfoMetis v0.5.0 - Prometheus Deployment', 'Monitoring and Alerting Platform');
            
            // Ensure namespace exists
            await this.kubectl.ensureNamespace('infometis');
            
            // Ensure required images are available in k0s containerd
            await this.ensureImagesAvailable();
            
            // Deploy main Prometheus components
            this.logger.step('Deploying Prometheus, Alertmanager, and Node Exporter...');
            const fs = require('fs');
            const prometheusContent = fs.readFileSync(this.prometheusManifest, 'utf8');
            const deployResult = await this.kubectl.applyYaml(prometheusContent, 'Prometheus Stack');
            if (!deployResult) {
                throw new Error('Failed to deploy Prometheus components');
            }
            
            // Deploy ingress
            this.logger.step('Configuring Prometheus ingress...');
            const ingressContent = fs.readFileSync(this.ingressManifest, 'utf8');
            const ingressResult = await this.kubectl.applyYaml(ingressContent, 'Prometheus Ingress');
            if (!ingressResult) {
                this.logger.warn('Ingress deployment failed, but Prometheus core components are running');
            }
            
            // Wait for Prometheus Server deployment to be ready
            this.logger.step('Waiting for Prometheus Server to be ready...');
            const prometheusReady = await this.kubectl.waitForDeployment('infometis', 'prometheus-server', 120);
            if (!prometheusReady) {
                throw new Error('Prometheus Server deployment failed to start within timeout');
            }
            
            // Wait for Alertmanager deployment to be ready
            this.logger.step('Waiting for Alertmanager to be ready...');
            const alertmanagerReady = await this.kubectl.waitForDeployment('infometis', 'alertmanager', 60);
            if (!alertmanagerReady) {
                this.logger.warn('Alertmanager deployment failed to start, but Prometheus Server is running');
            }
            
            // Wait for Node Exporter to be ready
            this.logger.step('Waiting for Node Exporter to be ready...');
            const nodeExporterReady = await this.kubectl.waitForDaemonSet('infometis', 'node-exporter', 60);
            if (!nodeExporterReady) {
                this.logger.warn('Node Exporter DaemonSet failed to start, but Prometheus Server is running');
            }
            
            // Verify deployment
            await this.verifyDeployment();
            
            this.logger.success('Prometheus deployment completed successfully');
            this.logger.newline();
            
            // Show access information
            this.showAccessInfo();
            
            return true;
            
        } catch (error) {
            this.logger.error(`Prometheus deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Prometheus deployment
     */
    async verifyDeployment() {
        this.logger.step('Verifying Prometheus deployment...');
        
        // Check if Prometheus Server pod is running
        const prometheusRunning = await this.kubectl.arePodsRunning('infometis', 'app=prometheus-server');
        if (prometheusRunning) {
            this.logger.success('✓ Prometheus Server is running');
        } else {
            throw new Error('Prometheus Server is not running');
        }
        
        // Check if Alertmanager pod is running
        const alertmanagerRunning = await this.kubectl.arePodsRunning('infometis', 'app=alertmanager');
        if (alertmanagerRunning) {
            this.logger.success('✓ Alertmanager is running');
        } else {
            this.logger.warn('⚠ Alertmanager is not running');
        }
        
        // Check if Node Exporter pods are running
        const nodeExporterRunning = await this.kubectl.arePodsRunning('infometis', 'app=node-exporter');
        if (nodeExporterRunning) {
            this.logger.success('✓ Node Exporter is running');
        } else {
            this.logger.warn('⚠ Node Exporter is not running');
        }
        
        // Check services
        try {
            const prometheusService = await this.kubectl.getService('infometis', 'prometheus-server-service');
            if (prometheusService) {
                this.logger.success('✓ Prometheus Server service is available');
            }
            
            const alertmanagerService = await this.kubectl.getService('infometis', 'alertmanager-service');
            if (alertmanagerService) {
                this.logger.success('✓ Alertmanager service is available');
            }
        } catch (error) {
            this.logger.warn('⚠ Some services not found, but pods are running');
        }
    }

    /**
     * Show access information
     */
    showAccessInfo() {
        this.logger.header('Prometheus Access Information');
        
        this.logger.info('🌐 Web Access:');
        this.logger.info('   Prometheus Server: http://localhost/prometheus');
        this.logger.info('   Alertmanager: http://localhost/alertmanager');
        this.logger.info('   Direct Prometheus: http://localhost:9090 (port-forward required)');
        this.logger.info('   Direct Alertmanager: http://localhost:9093 (port-forward required)');
        
        this.logger.newline();
        this.logger.info('📊 Monitoring Features:');
        this.logger.info('   • InfoMetis service discovery and monitoring');
        this.logger.info('   • Kafka cluster metrics');
        this.logger.info('   • Flink job metrics');
        this.logger.info('   • ksqlDB server metrics');
        this.logger.info('   • Node-level system metrics');
        this.logger.info('   • Custom alerting rules');
        
        this.logger.newline();
        this.logger.info('🔧 Port Forward (for direct access):');
        this.logger.info('   kubectl port-forward -n infometis service/prometheus-server-service 9090:9090');
        this.logger.info('   kubectl port-forward -n infometis service/alertmanager-service 9093:9093');
        
        this.logger.newline();
        this.logger.info('📚 Usage Examples:');
        this.logger.info('   Query Kafka metrics: kafka_server_broker_count');
        this.logger.info('   Query Node metrics: node_cpu_seconds_total');
        this.logger.info('   Query Flink metrics: flink_jobmanager_Status_JVM_CPU_Load');
        this.logger.info('   Alert on high CPU: increase(node_cpu_seconds_total[5m]) > 0.8');
    }

    /**
     * Clean up Prometheus deployment
     */
    async cleanup() {
        try {
            this.logger.header('Cleaning up Prometheus deployment');
            
            const resources = [
                { type: 'ingress', name: 'prometheus-server-ingress', namespace: 'infometis' },
                { type: 'ingress', name: 'alertmanager-ingress', namespace: 'infometis' },
                { type: 'service', name: 'prometheus-server-service', namespace: 'infometis' },
                { type: 'service', name: 'alertmanager-service', namespace: 'infometis' },
                { type: 'service', name: 'node-exporter-service', namespace: 'infometis' },
                { type: 'deployment', name: 'prometheus-server', namespace: 'infometis' },
                { type: 'deployment', name: 'alertmanager', namespace: 'infometis' },
                { type: 'daemonset', name: 'node-exporter', namespace: 'infometis' },
                { type: 'configmap', name: 'prometheus-config', namespace: 'infometis' },
                { type: 'configmap', name: 'alertmanager-config', namespace: 'infometis' },
                { type: 'pvc', name: 'prometheus-storage-claim', namespace: 'infometis' },
                { type: 'pvc', name: 'alertmanager-storage-claim', namespace: 'infometis' }
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
            
            this.logger.success('Prometheus cleanup completed successfully');
            return true;
            
        } catch (error) {
            this.logger.error(`Prometheus cleanup failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use in other modules
module.exports = PrometheusDeployment;

// CLI usage
if (require.main === module) {
    const deployment = new PrometheusDeployment();
    
    const command = process.argv[2] || 'deploy';
    
    switch (command) {
        case 'deploy':
            deployment.deploy().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        case 'cleanup':
            deployment.cleanup().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        default:
            console.log('Usage: node deploy-prometheus.js [deploy|cleanup]');
            process.exit(1);
    }
}