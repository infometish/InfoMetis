/**
 * InfoMetis v0.5.0 - Apache Flink Deployment
 * JavaScript deployment module for Flink JobManager and TaskManager
 */

const Logger = require('../lib/logger');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');
const ConfigUtil = require('../lib/fs/config');
const path = require('path');

class FlinkDeployment {
    constructor() {
        this.logger = new Logger('Flink Deployment');
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        this.config = new ConfigUtil(this.logger);
        
        this.manifestsPath = path.resolve(__dirname, '../config/manifests');
        this.flinkManifest = path.join(this.manifestsPath, 'flink-k8s.yaml');
        this.ingressManifest = path.join(this.manifestsPath, 'flink-ingress.yaml');
        
        // Flink required images
        this.requiredImages = [
            'apache/flink:1.18-scala_2.12'
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
        this.logger.step('Ensuring Flink images are available in k0s containerd...');
        
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
     * Deploy Flink JobManager and TaskManager
     */
    async deploy() {
        try {
            this.logger.header('InfoMetis v0.5.0 - Apache Flink Deployment', 'Distributed Stream Processing Engine');
            
            // Ensure namespace exists
            await this.kubectl.ensureNamespace('infometis');
            
            // Ensure required images are available in k0s containerd
            await this.ensureImagesAvailable();
            
            // Deploy main Flink components
            this.logger.step('Deploying Flink JobManager and TaskManager...');
            const fs = require('fs');
            const flinkContent = fs.readFileSync(this.flinkManifest, 'utf8');
            const deployResult = await this.kubectl.applyYaml(flinkContent, 'Flink JobManager and TaskManager');
            if (!deployResult) {
                throw new Error('Failed to deploy Flink components');
            }
            
            // Deploy ingress
            this.logger.step('Configuring Flink ingress...');
            const ingressContent = fs.readFileSync(this.ingressManifest, 'utf8');
            const ingressResult = await this.kubectl.applyYaml(ingressContent, 'Flink Ingress');
            if (!ingressResult) {
                this.logger.warn('Ingress deployment failed, but Flink core components are running');
            }
            
            // Wait for Flink JobManager deployment to be ready
            this.logger.step('Waiting for Flink JobManager to be ready...');
            const jobManagerReady = await this.kubectl.waitForDeployment('infometis', 'flink-jobmanager', 120);
            if (!jobManagerReady) {
                throw new Error('Flink JobManager deployment failed to start within timeout');
            }
            
            // Wait for Flink TaskManager deployment to be ready
            this.logger.step('Waiting for Flink TaskManager to be ready...');
            const taskManagerReady = await this.kubectl.waitForDeployment('infometis', 'flink-taskmanager', 60);
            if (!taskManagerReady) {
                this.logger.warn('Flink TaskManager deployment failed to start, but JobManager is running');
            }
            
            // Verify deployment
            await this.verifyDeployment();
            
            this.logger.success('Flink deployment completed successfully');
            this.logger.newline();
            
            // Show access information
            this.showAccessInfo();
            
            return true;
            
        } catch (error) {
            this.logger.error(`Flink deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Flink deployment
     */
    async verifyDeployment() {
        this.logger.step('Verifying Flink deployment...');
        
        // Check if Flink JobManager pod is running
        const jobManagerRunning = await this.kubectl.arePodsRunning('infometis', 'app=flink-jobmanager');
        if (jobManagerRunning) {
            this.logger.success('✓ Flink JobManager is running');
        } else {
            throw new Error('Flink JobManager is not running');
        }
        
        // Check if Flink TaskManager pod is running
        const taskManagerRunning = await this.kubectl.arePodsRunning('infometis', 'app=flink-taskmanager');
        if (taskManagerRunning) {
            this.logger.success('✓ Flink TaskManager is running');
        } else {
            this.logger.warn('⚠ Flink TaskManager is not running');
        }
        
        // Check services
        try {
            const jobManagerService = await this.kubectl.getService('infometis', 'flink-jobmanager-service');
            if (jobManagerService) {
                this.logger.success('✓ Flink JobManager service is available');
            }
            
            const taskManagerService = await this.kubectl.getService('infometis', 'flink-taskmanager-service');
            if (taskManagerService) {
                this.logger.success('✓ Flink TaskManager service is available');
            }
        } catch (error) {
            this.logger.warn('⚠ Some Flink services not found, but pods are running');
        }
    }

    /**
     * Show access information
     */
    showAccessInfo() {
        this.logger.header('Flink Access Information');
        
        this.logger.info('🌐 Web Access:');
        this.logger.info('   Flink Web UI: http://localhost/flink');
        this.logger.info('   Direct Web UI: http://localhost:8081 (port-forward required)');
        
        this.logger.newline();
        this.logger.info('💻 Job Submission:');
        this.logger.info('   Submit via REST API: http://localhost/flink/jars/upload');
        this.logger.info('   Submit via CLI in pod:');
        this.logger.info('   kubectl exec -it -n infometis deployment/flink-jobmanager -- flink run /path/to/job.jar');
        
        this.logger.newline();
        this.logger.info('📚 Usage Examples:');
        this.logger.info('   # Upload JAR via web UI');
        this.logger.info('   curl -X POST -H "Expect:" -F "jarfile=@/path/to/job.jar" http://localhost/flink/jars/upload');
        this.logger.info('   # List running jobs');
        this.logger.info('   curl http://localhost/flink/jobs');
        this.logger.info('   # Check cluster overview');
        this.logger.info('   curl http://localhost/flink/overview');
        
        this.logger.newline();
        this.logger.info('🔧 Port Forward (for direct access):');
        this.logger.info('   kubectl port-forward -n infometis service/flink-jobmanager-service 8081:8081');
        this.logger.info('   kubectl port-forward -n infometis service/flink-taskmanager-service 6121:6121');
        
        this.logger.newline();
        this.logger.info('📊 Cluster Information:');
        this.logger.info('   JobManager: Coordinates job execution and resource management');
        this.logger.info('   TaskManager: Executes job tasks and manages data streams');
        this.logger.info('   Configuration: /opt/flink/conf/ in containers');
    }

    /**
     * Clean up Flink deployment
     */
    async cleanup() {
        try {
            this.logger.header('Cleaning up Flink deployment');
            
            const resources = [
                { type: 'ingress', name: 'flink-ingress', namespace: 'infometis' },
                { type: 'service', name: 'flink-jobmanager-service', namespace: 'infometis' },
                { type: 'service', name: 'flink-taskmanager-service', namespace: 'infometis' },
                { type: 'deployment', name: 'flink-jobmanager', namespace: 'infometis' },
                { type: 'deployment', name: 'flink-taskmanager', namespace: 'infometis' },
                { type: 'configmap', name: 'flink-config', namespace: 'infometis' }
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
            
            this.logger.success('Flink cleanup completed successfully');
            return true;
            
        } catch (error) {
            this.logger.error(`Flink cleanup failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use in other modules
module.exports = FlinkDeployment;

// CLI usage
if (require.main === module) {
    const deployment = new FlinkDeployment();
    
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
            console.log('Usage: node deploy-flink.js [deploy|cleanup]');
            process.exit(1);
    }
}