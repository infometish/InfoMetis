/**
 * InfoMetis v0.5.0 - ksqlDB Deployment
 * JavaScript deployment module for ksqlDB Server and CLI
 */

const Logger = require('../lib/logger');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');
const ConfigUtil = require('../lib/fs/config');
const path = require('path');

class KsqlDBDeployment {
    constructor() {
        this.logger = new Logger('ksqlDB Deployment');
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        this.config = new ConfigUtil(this.logger);
        
        this.manifestsPath = path.resolve(__dirname, '../config/manifests');
        this.ksqldbManifest = path.join(this.manifestsPath, 'ksqldb-k8s.yaml');
        this.ingressManifest = path.join(this.manifestsPath, 'ksqldb-ingress.yaml');
        
        // ksqlDB required images
        this.requiredImages = [
            'confluentinc/ksqldb-server:0.29.0',
            'confluentinc/ksqldb-cli:0.29.0'
        ];
    }

    /**
     * Check if image exists in k0s containerd
     */
    async isImageInContainerd(image) {
        try {
            const result = await this.exec.run(
                `docker exec infometis /usr/local/bin/k0s ctr images list | grep "${image.replace(':', ' ')}"`,
                {}, true
            );
            return result.success;
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
        this.logger.step('Ensuring ksqlDB images are available in k0s containerd...');
        
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
     * Deploy ksqlDB Server and CLI
     */
    async deploy() {
        try {
            this.logger.header('InfoMetis v0.5.0 - ksqlDB Deployment', 'SQL-based Stream Processing Platform');
            
            // Ensure namespace exists
            await this.kubectl.ensureNamespace('infometis');
            
            // Ensure required images are available in k0s containerd
            await this.ensureImagesAvailable();
            
            // Deploy main ksqlDB components
            this.logger.step('Deploying ksqlDB Server and CLI...');
            const deployResult = await this.kubectl.applyManifest(this.ksqldbManifest);
            if (!deployResult) {
                throw new Error('Failed to deploy ksqlDB components');
            }
            
            // Deploy ingress
            this.logger.step('Configuring ksqlDB ingress...');
            const ingressResult = await this.kubectl.applyManifest(this.ingressManifest);
            if (!ingressResult) {
                this.logger.warn('Ingress deployment failed, but ksqlDB core components are running');
            }
            
            // Wait for ksqlDB Server to be ready
            this.logger.step('Waiting for ksqlDB Server to be ready...');
            const serverReady = await this.kubectl.waitForPod('infometis', 'app=ksqldb-server', 120);
            if (!serverReady) {
                throw new Error('ksqlDB Server failed to start within timeout');
            }
            
            // Wait for ksqlDB CLI to be ready
            this.logger.step('Waiting for ksqlDB CLI to be ready...');
            const cliReady = await this.kubectl.waitForPod('infometis', 'app=ksqldb-cli', 60);
            if (!cliReady) {
                this.logger.warn('ksqlDB CLI failed to start, but Server is running');
            }
            
            // Verify deployment
            await this.verifyDeployment();
            
            this.logger.success('ksqlDB deployment completed successfully');
            this.logger.newline();
            
            // Show access information
            this.showAccessInfo();
            
            return true;
            
        } catch (error) {
            this.logger.error(`ksqlDB deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify ksqlDB deployment
     */
    async verifyDeployment() {
        this.logger.step('Verifying ksqlDB deployment...');
        
        // Check if ksqlDB Server pod is running
        const serverRunning = await this.kubectl.arePodsRunning('infometis', 'app=ksqldb-server');
        if (serverRunning) {
            this.logger.success('✓ ksqlDB Server is running');
        } else {
            throw new Error('ksqlDB Server is not running');
        }
        
        // Check if ksqlDB CLI pod is running
        const cliRunning = await this.kubectl.arePodsRunning('infometis', 'app=ksqldb-cli');
        if (cliRunning) {
            this.logger.success('✓ ksqlDB CLI is running');
        } else {
            this.logger.warn('⚠ ksqlDB CLI is not running');
        }
        
        // Check services
        const serverService = await this.kubectl.serviceExists('infometis', 'ksqldb-server-service');
        if (serverService) {
            this.logger.success('✓ ksqlDB Server service is available');
        } else {
            throw new Error('ksqlDB Server service not found');
        }
    }

    /**
     * Show access information
     */
    showAccessInfo() {
        this.logger.header('ksqlDB Access Information');
        
        this.logger.info('🌐 Web Access:');
        this.logger.info('   ksqlDB Server API: http://localhost/ksqldb');
        this.logger.info('   Direct Server API: http://localhost:8088 (port-forward required)');
        
        this.logger.newline();
        this.logger.info('💻 CLI Access:');
        this.logger.info('   Connect to CLI pod:');
        this.logger.info('   kubectl exec -it -n infometis deployment/ksqldb-cli -- ksql http://ksqldb-server-service:8088');
        
        this.logger.newline();
        this.logger.info('📚 Usage Examples:');
        this.logger.info('   CREATE STREAM users (id INT, name STRING) WITH (kafka_topic=\'users\', value_format=\'JSON\');');
        this.logger.info('   SELECT * FROM users EMIT CHANGES;');
        this.logger.info('   SHOW STREAMS;');
        
        this.logger.newline();
        this.logger.info('🔧 Port Forward (for direct access):');
        this.logger.info('   kubectl port-forward -n infometis service/ksqldb-server-service 8088:8088');
    }

    /**
     * Clean up ksqlDB deployment
     */
    async cleanup() {
        try {
            this.logger.header('Cleaning up ksqlDB deployment');
            
            // Remove ingress first
            this.logger.step('Removing ksqlDB ingress...');
            await this.kubectl.deleteManifest(this.ingressManifest);
            
            // Remove main deployment
            this.logger.step('Removing ksqlDB Server and CLI...');
            await this.kubectl.deleteManifest(this.ksqldbManifest);
            
            // Wait for pods to terminate
            this.logger.step('Waiting for pods to terminate...');
            await this.kubectl.waitForPodTermination('infometis', 'app=ksqldb-server', 60);
            await this.kubectl.waitForPodTermination('infometis', 'app=ksqldb-cli', 30);
            
            this.logger.success('ksqlDB cleanup completed successfully');
            return true;
            
        } catch (error) {
            this.logger.error(`ksqlDB cleanup failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use in other modules
module.exports = KsqlDBDeployment;

// CLI usage
if (require.main === module) {
    const deployment = new KsqlDBDeployment();
    
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
            console.log('Usage: node deploy-ksqldb.js [deploy|cleanup]');
            process.exit(1);
    }
}