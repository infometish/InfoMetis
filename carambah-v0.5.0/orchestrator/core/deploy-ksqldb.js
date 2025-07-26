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
            const fs = require('fs');
            const ksqldbContent = fs.readFileSync(this.ksqldbManifest, 'utf8');
            const deployResult = await this.kubectl.applyYaml(ksqldbContent, 'ksqlDB Server and CLI');
            if (!deployResult) {
                throw new Error('Failed to deploy ksqlDB components');
            }
            
            // Deploy ingress
            this.logger.step('Configuring ksqlDB ingress...');
            const ingressContent = fs.readFileSync(this.ingressManifest, 'utf8');
            const ingressResult = await this.kubectl.applyYaml(ingressContent, 'ksqlDB Ingress');
            if (!ingressResult) {
                this.logger.warn('Ingress deployment failed, but ksqlDB core components are running');
            }
            
            // Wait for ksqlDB Server deployment to be ready
            this.logger.step('Waiting for ksqlDB Server to be ready...');
            const serverReady = await this.kubectl.waitForDeployment('infometis', 'ksqldb-server', 120);
            if (!serverReady) {
                throw new Error('ksqlDB Server deployment failed to start within timeout');
            }
            
            // Wait for ksqlDB CLI deployment to be ready
            this.logger.step('Waiting for ksqlDB CLI to be ready...');
            const cliReady = await this.kubectl.waitForDeployment('infometis', 'ksqldb-cli', 60);
            if (!cliReady) {
                this.logger.warn('ksqlDB CLI deployment failed to start, but Server is running');
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
        try {
            const serverService = await this.kubectl.getService('infometis', 'ksqldb-server-service');
            if (serverService) {
                this.logger.success('✓ ksqlDB Server service is available');
            }
        } catch (error) {
            this.logger.warn('⚠ ksqlDB Server service not found, but pods are running');
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
            
            const resources = [
                { type: 'ingress', name: 'ksqldb-server-ingress', namespace: 'infometis' },
                { type: 'service', name: 'ksqldb-server-service', namespace: 'infometis' },
                { type: 'service', name: 'ksqldb-cli-service', namespace: 'infometis' },
                { type: 'deployment', name: 'ksqldb-server', namespace: 'infometis' },
                { type: 'deployment', name: 'ksqldb-cli', namespace: 'infometis' },
                { type: 'configmap', name: 'ksqldb-server-config', namespace: 'infometis' }
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