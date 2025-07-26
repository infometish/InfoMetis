/**
 * InfoMetis v0.5.0 - Schema Registry Deployment
 * JavaScript deployment module for Confluent Schema Registry
 */

const Logger = require('../core/logger');
const KubectlUtil = require('../core/kubectl/kubectl');
const ExecUtil = require('../core/exec');
const ConfigUtil = require('../core/fs/config');
const path = require('path');

class SchemaRegistryDeployment {
    constructor() {
        this.logger = new Logger('Schema Registry Deployment');
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        this.config = new ConfigUtil(this.logger);
        
        this.manifestsPath = path.resolve(__dirname, '../environments/kubernetes/manifests');
        this.schemaRegistryManifest = path.join(this.manifestsPath, 'schema-registry-k8s.yaml');
        this.ingressManifest = path.join(this.manifestsPath, 'schema-registry-ingress.yaml');
        
        // Schema Registry required images
        this.requiredImages = [
            'confluentinc/cp-schema-registry:7.5.0'
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
        this.logger.step('Ensuring Schema Registry images are available in k0s containerd...');
        
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
     * Deploy Schema Registry
     */
    async deploy() {
        try {
            this.logger.header('InfoMetis v0.5.0 - Schema Registry Deployment', 'Confluent Schema Management Platform');
            
            // Ensure namespace exists
            await this.kubectl.ensureNamespace('infometis');
            
            // Ensure required images are available in k0s containerd
            await this.ensureImagesAvailable();
            
            // Deploy main Schema Registry components
            this.logger.step('Deploying Schema Registry...');
            const fs = require('fs');
            const schemaRegistryContent = fs.readFileSync(this.schemaRegistryManifest, 'utf8');
            const deployResult = await this.kubectl.applyYaml(schemaRegistryContent, 'Schema Registry');
            if (!deployResult) {
                throw new Error('Failed to deploy Schema Registry components');
            }
            
            // Deploy ingress
            this.logger.step('Configuring Schema Registry ingress...');
            const ingressContent = fs.readFileSync(this.ingressManifest, 'utf8');
            const ingressResult = await this.kubectl.applyYaml(ingressContent, 'Schema Registry Ingress');
            if (!ingressResult) {
                this.logger.warn('Ingress deployment failed, but Schema Registry core components are running');
            }
            
            // Wait for Schema Registry deployment to be ready
            this.logger.step('Waiting for Schema Registry to be ready...');
            const schemaRegistryReady = await this.kubectl.waitForDeployment('infometis', 'schema-registry', 120);
            if (!schemaRegistryReady) {
                throw new Error('Schema Registry deployment failed to start within timeout');
            }
            
            // Verify deployment
            await this.verifyDeployment();
            
            this.logger.success('Schema Registry deployment completed successfully');
            this.logger.newline();
            
            // Show access information
            this.showAccessInfo();
            
            return true;
            
        } catch (error) {
            this.logger.error(`Schema Registry deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Schema Registry deployment
     */
    async verifyDeployment() {
        this.logger.step('Verifying Schema Registry deployment...');
        
        // Check if Schema Registry pod is running
        const schemaRegistryRunning = await this.kubectl.arePodsRunning('infometis', 'app=schema-registry');
        if (schemaRegistryRunning) {
            this.logger.success('✓ Schema Registry is running');
        } else {
            throw new Error('Schema Registry is not running');
        }
        
        // Check services
        try {
            const schemaRegistryService = await this.kubectl.getService('infometis', 'schema-registry-service');
            if (schemaRegistryService) {
                this.logger.success('✓ Schema Registry service is available');
            }
        } catch (error) {
            this.logger.warn('⚠ Schema Registry service not found, but pods are running');
        }
    }

    /**
     * Show access information
     */
    showAccessInfo() {
        this.logger.header('Schema Registry Access Information');
        
        this.logger.info('🌐 Web Access:');
        this.logger.info('   Schema Registry API: http://localhost/schema-registry');
        this.logger.info('   Direct API: http://localhost:8081 (port-forward required)');
        
        this.logger.newline();
        this.logger.info('🔗 Integration:');
        this.logger.info('   Kafka Bootstrap Servers: kafka-service:9092');
        this.logger.info('   Schema Registry URL: http://schema-registry-service:8081');
        
        this.logger.newline();
        this.logger.info('📚 API Examples:');
        this.logger.info('   List subjects: GET /subjects');
        this.logger.info('   Get schema: GET /subjects/{subject}/versions/{version}');
        this.logger.info('   Register schema: POST /subjects/{subject}/versions');
        this.logger.info('   Check compatibility: POST /compatibility/subjects/{subject}/versions/{version}');
        
        this.logger.newline();
        this.logger.info('💻 CLI Usage:');
        this.logger.info('   # List all subjects');
        this.logger.info('   curl http://localhost/schema-registry/subjects');
        this.logger.info('   ');
        this.logger.info('   # Get latest schema for subject');
        this.logger.info('   curl http://localhost/schema-registry/subjects/user-value/versions/latest');
        
        this.logger.newline();
        this.logger.info('🔧 Port Forward (for direct access):');
        this.logger.info('   kubectl port-forward -n infometis service/schema-registry-service 8081:8081');
        
        this.logger.newline();
        this.logger.info('🔄 Schema Evolution:');
        this.logger.info('   • BACKWARD compatibility (default)');
        this.logger.info('   • FORWARD compatibility');
        this.logger.info('   • FULL compatibility');
        this.logger.info('   • NONE - no compatibility checking');
    }

    /**
     * Clean up Schema Registry deployment
     */
    async cleanup() {
        try {
            this.logger.header('Cleaning up Schema Registry deployment');
            
            const resources = [
                { type: 'ingress', name: 'schema-registry-ingress', namespace: 'infometis' },
                { type: 'service', name: 'schema-registry-service', namespace: 'infometis' },
                { type: 'deployment', name: 'schema-registry', namespace: 'infometis' },
                { type: 'configmap', name: 'schema-registry-config', namespace: 'infometis' }
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
            
            this.logger.success('Schema Registry cleanup completed successfully');
            return true;
            
        } catch (error) {
            this.logger.error(`Schema Registry cleanup failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use in other modules
module.exports = SchemaRegistryDeployment;

// CLI usage
if (require.main === module) {
    const deployment = new SchemaRegistryDeployment();
    
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
            console.log('Usage: node deploy-schema-registry.js [deploy|cleanup]');
            process.exit(1);
    }
}