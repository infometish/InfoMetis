#!/usr/bin/env node
/**
 * ksqlDB CLI Component Deployment Script
 * Deploys ksqlDB CLI client for interactive SQL querying of Kafka streams
 */

const path = require('path');
const fs = require('fs');

class KsqlDBCLIDeployment {
    constructor() {
        this.componentName = 'ksqlDB CLI';
        this.namespace = 'infometis';
        this.manifestPath = path.resolve(__dirname, '../environments/kubernetes/manifests/ksqldb-cli.yaml');
        this.configPath = path.resolve(__dirname, '../core/ksqldb-cli-config.js');
        
        // Load configuration
        this.config = require(this.configPath);
        
        // Required images
        this.requiredImages = [
            'confluentinc/ksqldb-cli:0.29.0'
        ];
    }

    /**
     * Log message with timestamp
     */
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    /**
     * Execute command
     */
    async exec(command) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const args = command.split(' ');
            const cmd = args.shift();
            
            const proc = spawn(cmd, args, { stdio: 'pipe' });
            let stdout = '';
            let stderr = '';
            
            proc.stdout.on('data', (data) => stdout += data.toString());
            proc.stderr.on('data', (data) => stderr += data.toString());
            
            proc.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, stdout, stderr });
                } else {
                    resolve({ success: false, stdout, stderr, code });
                }
            });
            
            proc.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Check if image exists in containerd
     */
    async isImageInContainerd(image) {
        try {
            const patterns = [
                image,
                `library/${image}`,
                image.replace(':', ' ')
            ];
            
            for (const pattern of patterns) {
                const result = await this.exec(
                    `docker exec infometis /usr/local/bin/k0s ctr images list | grep "${pattern}"`
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
            const dockerCheck = await this.exec(`docker inspect "${image}"`);
            if (!dockerCheck.success) {
                throw new Error(`Image not in Docker cache: ${image}`);
            }

            // Transfer to k0s containerd
            this.log(`📤 Transferring ${image} to k0s containerd...`);
            const transferResult = await this.exec(
                `docker save "${image}" | docker exec -i infometis /usr/local/bin/k0s ctr images import -`
            );
            
            if (!transferResult.success) {
                throw new Error(`Failed to transfer ${image}: ${transferResult.stderr}`);
            }
            
            this.log(`✅ Transferred ${image} to k0s containerd`, 'success');
            return true;
            
        } catch (error) {
            this.log(`❌ Failed to transfer ${image}: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Ensure required images are available
     */
    async ensureImagesAvailable() {
        this.log('Ensuring ksqlDB CLI images are available in k0s containerd...');
        
        for (const image of this.requiredImages) {
            if (await this.isImageInContainerd(image)) {
                this.log(`✅ ${image} already in k0s containerd`, 'success');
                continue;
            }
            
            if (!await this.transferImageToContainerd(image)) {
                throw new Error(`Failed to ensure ${image} is available in k0s containerd`);
            }
        }
    }

    /**
     * Apply Kubernetes manifest
     */
    async applyManifest() {
        try {
            if (!fs.existsSync(this.manifestPath)) {
                throw new Error(`Manifest not found: ${this.manifestPath}`);
            }

            this.log('Applying ksqlDB CLI Kubernetes manifest...');
            const result = await this.exec(`kubectl apply -f "${this.manifestPath}"`);
            
            if (!result.success) {
                throw new Error(`Failed to apply manifest: ${result.stderr}`);
            }
            
            this.log('✅ Kubernetes manifest applied successfully', 'success');
            return true;
        } catch (error) {
            this.log(`❌ Failed to apply manifest: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Wait for deployment to be ready
     */
    async waitForDeployment(timeout = 120) {
        this.log(`Waiting for ${this.componentName} deployment to be ready...`);
        
        const startTime = Date.now();
        while (Date.now() - startTime < timeout * 1000) {
            const result = await this.exec(
                `kubectl get deployment ksqldb-cli -n ${this.namespace} -o jsonpath='{.status.readyReplicas}'`
            );
            
            if (result.success && result.stdout.trim() === '1') {
                this.log('✅ ksqlDB CLI deployment is ready', 'success');
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        this.log(`⚠️ ksqlDB CLI deployment not ready within ${timeout}s timeout`, 'warn');
        return false;
    }

    /**
     * Verify deployment
     */
    async verifyDeployment() {
        this.log('Verifying ksqlDB CLI deployment...');
        
        // Check if pods are running
        const podsResult = await this.exec(
            `kubectl get pods -n ${this.namespace} -l app=ksqldb-cli -o jsonpath='{.items[0].status.phase}'`
        );
        
        if (podsResult.success && podsResult.stdout.trim() === 'Running') {
            this.log('✅ ksqlDB CLI pod is running', 'success');
        } else {
            throw new Error('ksqlDB CLI pod is not running');
        }
        
        // Check service
        const serviceResult = await this.exec(
            `kubectl get service ksqldb-cli-service -n ${this.namespace}`
        );
        
        if (serviceResult.success) {
            this.log('✅ ksqlDB CLI service is available', 'success');
        } else {
            this.log('⚠️ ksqlDB CLI service not found', 'warn');
        }
    }

    /**
     * Show access information
     */
    showAccessInfo() {
        this.log('\n=== ksqlDB CLI Access Information ===');
        
        console.log('\n💻 CLI Access:');
        console.log('   Connect to ksqlDB via CLI pod:');
        console.log('   kubectl exec -it -n infometis deployment/ksqldb-cli -- ksql http://ksqldb-server-service:8088');
        
        console.log('\n📚 Example Commands:');
        this.config.examples.commands.forEach(cmd => {
            console.log(`   ${cmd}`);
        });
        
        console.log('\n🔧 Stream Examples:');
        this.config.examples.streams.forEach(example => {
            console.log(`   ${example}`);
        });
        
        console.log('\n⚠️ Prerequisites:');
        console.log('   - ksqlDB Server must be running (ksqldb-server deployment)');
        console.log('   - Kafka cluster must be available');
        console.log('   - Schema Registry should be running for Avro support');
        console.log();
    }

    /**
     * Deploy ksqlDB CLI
     */
    async deploy() {
        try {
            this.log(`🚀 Starting ${this.componentName} deployment`);
            
            // Ensure images are available
            await this.ensureImagesAvailable();
            
            // Apply Kubernetes manifest
            if (!await this.applyManifest()) {
                throw new Error('Failed to apply Kubernetes manifest');
            }
            
            // Wait for deployment to be ready
            const ready = await this.waitForDeployment();
            if (!ready) {
                this.log('⚠️ Deployment may not be fully ready, but continuing...', 'warn');
            }
            
            // Verify deployment
            await this.verifyDeployment();
            
            this.log(`🎉 ${this.componentName} deployment completed successfully`, 'success');
            
            // Show access information
            this.showAccessInfo();
            
            return true;
            
        } catch (error) {
            this.log(`❌ ${this.componentName} deployment failed: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Clean up deployment
     */
    async cleanup() {
        try {
            this.log(`🧹 Cleaning up ${this.componentName} deployment`);
            
            const result = await this.exec(`kubectl delete -f "${this.manifestPath}" --ignore-not-found=true`);
            
            if (result.success) {
                this.log(`✅ ${this.componentName} cleanup completed`, 'success');
                return true;
            } else {
                this.log(`⚠️ Cleanup completed with warnings: ${result.stderr}`, 'warn');
                return true; // Don't fail on cleanup warnings
            }
            
        } catch (error) {
            this.log(`❌ ${this.componentName} cleanup failed: ${error.message}`, 'error');
            return false;
        }
    }
}

// CLI execution
if (require.main === module) {
    const deployment = new KsqlDBCLIDeployment();
    
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
            console.log('Usage: node deploy-ksqldb-cli.js [deploy|cleanup]');
            process.exit(1);
    }
}

module.exports = KsqlDBCLIDeployment;