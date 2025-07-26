#!/usr/bin/env node

/**
 * InfoMetis v0.5.0 - Node Exporter Deployment Script
 * JavaScript deployment module for Node Exporter system metrics collection
 * Extracted from Prometheus deployment for standalone use
 */

const Logger = require('../../../lib/logger');
const KubectlUtil = require('../../../lib/kubectl/kubectl');
const ExecUtil = require('../../../lib/exec');
const path = require('path');
const fs = require('fs');

class NodeExporterDeployment {
    constructor() {
        this.logger = new Logger('Node Exporter Deployment');
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        
        this.manifestsPath = path.resolve(__dirname, '../environments/kubernetes/manifests');
        this.nodeExporterManifest = path.join(this.manifestsPath, 'node-exporter.yaml');
        
        // Node Exporter required image
        this.requiredImage = 'prom/node-exporter:v1.6.1';
    }

    /**
     * Check if image exists in k0s containerd
     */
    async isImageInContainerd(image) {
        try {
            const patterns = [
                image,
                `library/${image}`,
                image.replace(':', ' ')
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
     * Ensure required image is available in k0s containerd
     */
    async ensureImageAvailable() {
        this.logger.step('Ensuring Node Exporter image is available in k0s containerd...');
        
        // Check if image exists in containerd
        if (await this.isImageInContainerd(this.requiredImage)) {
            this.logger.success(`✓ ${this.requiredImage} already in k0s containerd`);
            return true;
        }
        
        // Transfer from Docker to containerd
        if (!await this.transferImageToContainerd(this.requiredImage)) {
            throw new Error(`Failed to ensure ${this.requiredImage} is available in k0s containerd`);
        }
        
        return true;
    }

    /**
     * Deploy Node Exporter
     */
    async deploy() {
        try {
            this.logger.header('InfoMetis v0.5.0 - Node Exporter Deployment', 'System Metrics Collection');
            
            // Ensure namespace exists
            await this.kubectl.ensureNamespace('infometis');
            
            // Ensure required image is available in k0s containerd
            await this.ensureImageAvailable();
            
            // Deploy Node Exporter
            this.logger.step('Deploying Node Exporter DaemonSet...');
            const nodeExporterContent = fs.readFileSync(this.nodeExporterManifest, 'utf8');
            const deployResult = await this.kubectl.applyYaml(nodeExporterContent, 'Node Exporter');
            if (!deployResult) {
                throw new Error('Failed to deploy Node Exporter');
            }
            
            // Wait for Node Exporter to be ready
            this.logger.step('Waiting for Node Exporter to be ready...');
            const nodeExporterReady = await this.kubectl.waitForDaemonSet('infometis', 'node-exporter', 60);
            if (!nodeExporterReady) {
                throw new Error('Node Exporter DaemonSet failed to start within timeout');
            }
            
            // Verify deployment
            await this.verifyDeployment();
            
            this.logger.success('Node Exporter deployment completed successfully');
            this.logger.newline();
            
            // Show access information
            this.showAccessInfo();
            
            return true;
            
        } catch (error) {
            this.logger.error(`Node Exporter deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify Node Exporter deployment
     */
    async verifyDeployment() {
        this.logger.step('Verifying Node Exporter deployment...');
        
        // Check if Node Exporter pods are running
        const nodeExporterRunning = await this.kubectl.arePodsRunning('infometis', 'app=node-exporter');
        if (nodeExporterRunning) {
            this.logger.success('✓ Node Exporter pods are running');
        } else {
            throw new Error('Node Exporter pods are not running');
        }
        
        // Check service
        try {
            const nodeExporterService = await this.kubectl.getService('infometis', 'node-exporter-service');
            if (nodeExporterService) {
                this.logger.success('✓ Node Exporter service is available');
            }
        } catch (error) {
            this.logger.warn('⚠ Node Exporter service not found, but pods are running');
        }
        
        // Get DaemonSet status
        try {
            const dsStatus = await this.exec.run(
                'kubectl get daemonset node-exporter -n infometis -o json',
                {}, true
            );
            
            if (dsStatus.success) {
                const ds = JSON.parse(dsStatus.stdout);
                const desired = ds.status.desiredNumberScheduled || 0;
                const ready = ds.status.numberReady || 0;
                this.logger.success(`✓ Node Exporter DaemonSet: ${ready}/${desired} nodes ready`);
            }
        } catch (error) {
            this.logger.warn('⚠ Could not get DaemonSet status details');
        }
    }

    /**
     * Show access information
     */
    showAccessInfo() {
        this.logger.header('Node Exporter Access Information');
        
        this.logger.info('📊 Metrics Endpoint:');
        this.logger.info('   Service: node-exporter-service.infometis.svc.cluster.local:9100');
        this.logger.info('   Metrics Path: /metrics');
        this.logger.info('   Direct Access: http://localhost:9100 (port-forward required)');
        
        this.logger.newline();
        this.logger.info('🔧 Port Forward (for direct access):');
        this.logger.info('   kubectl port-forward -n infometis daemonset/node-exporter 9100:9100');
        
        this.logger.newline();
        this.logger.info('📈 Available Metrics:');
        this.logger.info('   • CPU usage: node_cpu_seconds_total');
        this.logger.info('   • Memory usage: node_memory_MemTotal_bytes, node_memory_MemAvailable_bytes');
        this.logger.info('   • Disk usage: node_filesystem_size_bytes, node_filesystem_avail_bytes');
        this.logger.info('   • Network traffic: node_network_receive_bytes_total, node_network_transmit_bytes_total');
        this.logger.info('   • Load average: node_load1, node_load5, node_load15');
        this.logger.info('   • System uptime: node_time_seconds - node_boot_time_seconds');
        
        this.logger.newline();
        this.logger.info('🔗 Prometheus Integration:');
        this.logger.info('   Add to prometheus.yml scrape_configs:');
        this.logger.info('   - job_name: "node-exporter"');
        this.logger.info('     static_configs:');
        this.logger.info('       - targets: ["node-exporter-service:9100"]');
    }

    /**
     * Clean up Node Exporter deployment
     */
    async cleanup() {
        try {
            this.logger.header('Cleaning up Node Exporter deployment');
            
            const resources = [
                { type: 'service', name: 'node-exporter-service', namespace: 'infometis' },
                { type: 'daemonset', name: 'node-exporter', namespace: 'infometis' }
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
            
            this.logger.success('Node Exporter cleanup completed successfully');
            return true;
            
        } catch (error) {
            this.logger.error(`Node Exporter cleanup failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use in other modules
module.exports = NodeExporterDeployment;

// CLI usage
if (require.main === module) {
    const deployment = new NodeExporterDeployment();
    
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
            console.log('Usage: node deploy-node-exporter.js [deploy|cleanup]');
            process.exit(1);
    }
}