#!/usr/bin/env node

/**
 * InfoMetis v0.5.0 - Alertmanager Deployment Script
 * Standalone deployment script for Prometheus Alertmanager component
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AlertmanagerDeployment {
    constructor() {
        this.componentDir = path.resolve(__dirname, '..');
        this.manifestPath = path.join(this.componentDir, 'environments/kubernetes/manifests/alertmanager-k8s.yaml');
        this.configPath = path.join(this.componentDir, 'core/alertmanager-config.yml');
        this.imageConfig = require('../core/image-config.js');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async exec(command, options = {}) {
        try {
            const result = execSync(command, { 
                encoding: 'utf8',
                stdio: options.silent ? 'pipe' : 'inherit',
                ...options 
            });
            return { success: true, output: result };
        } catch (error) {
            return { success: false, error: error.message, output: error.stdout };
        }
    }

    async checkPrerequisites() {
        this.log('Checking prerequisites...');
        
        // Check if kubectl is available
        const kubectlCheck = await this.exec('kubectl version --client', { silent: true });
        if (!kubectlCheck.success) {
            throw new Error('kubectl is not available');
        }
        
        // Check if Docker image exists
        const imageCheck = await this.exec(`docker inspect ${this.imageConfig.image}`, { silent: true });
        if (!imageCheck.success) {
            this.log(`Image ${this.imageConfig.image} not found in Docker cache`, 'error');
            this.log('Please ensure the image is loaded: docker pull prom/alertmanager:v0.25.1');
            return false;
        }
        
        this.log('Prerequisites satisfied', 'success');
        return true;
    }

    async ensureNamespace() {
        this.log('Ensuring namespace exists...');
        
        const result = await this.exec('kubectl create namespace infometis --dry-run=client -o yaml | kubectl apply -f -');
        if (result.success) {
            this.log('Namespace infometis ready', 'success');
        } else {
            throw new Error('Failed to create namespace');
        }
    }

    async deployAlertmanager() {
        this.log('Deploying Alertmanager...');
        
        if (!fs.existsSync(this.manifestPath)) {
            throw new Error(`Manifest not found: ${this.manifestPath}`);
        }
        
        const result = await this.exec(`kubectl apply -f ${this.manifestPath}`);
        if (!result.success) {
            throw new Error('Failed to deploy Alertmanager manifest');
        }
        
        this.log('Alertmanager manifest applied', 'success');
    }

    async waitForDeployment() {
        this.log('Waiting for Alertmanager deployment to be ready...');
        
        const result = await this.exec('kubectl wait --for=condition=available --timeout=120s deployment/alertmanager -n infometis');
        if (!result.success) {
            this.log('Alertmanager deployment not ready within timeout', 'error');
            return false;
        }
        
        this.log('Alertmanager deployment is ready', 'success');
        return true;
    }

    async verifyDeployment() {
        this.log('Verifying Alertmanager deployment...');
        
        // Check pod status
        const podResult = await this.exec('kubectl get pods -n infometis -l app=alertmanager', { silent: true });
        if (!podResult.success) {
            throw new Error('Failed to get pod status');
        }
        
        // Check service
        const serviceResult = await this.exec('kubectl get service alertmanager-service -n infometis', { silent: true });
        if (!serviceResult.success) {
            throw new Error('Alertmanager service not found');
        }
        
        this.log('Alertmanager verification completed', 'success');
        return true;
    }

    showAccessInfo() {
        console.log('\n📊 Alertmanager Access Information:');
        console.log('   Web UI: http://localhost/alertmanager (via ingress)');
        console.log('   Direct Access: kubectl port-forward -n infometis service/alertmanager-service 9093:9093');
        console.log('   Health Check: curl http://localhost:9093/-/healthy');
        console.log('   API Access: http://localhost:9093/api/v1/alerts');
        console.log('\n🔧 Configuration:');
        console.log('   Config File: /etc/alertmanager/alertmanager.yml');
        console.log('   Storage Path: /alertmanager');
        console.log('   Webhook Endpoint: http://localhost:5001/webhook');
        console.log('\n📚 Usage:');
        console.log('   - View active alerts in the web UI');
        console.log('   - Configure notification receivers in alertmanager.yml');
        console.log('   - Set up silences for maintenance windows');
        console.log('   - Monitor alert routing and grouping');
    }

    async deploy() {
        try {
            this.log('Starting Alertmanager deployment...', 'info');
            
            if (!await this.checkPrerequisites()) {
                return false;
            }
            
            await this.ensureNamespace();
            await this.deployAlertmanager();
            
            const ready = await this.waitForDeployment();
            if (!ready) {
                this.log('Deployment may not be fully ready, but continuing...', 'error');
            }
            
            await this.verifyDeployment();
            
            this.log('Alertmanager deployment completed successfully!', 'success');
            this.showAccessInfo();
            
            return true;
            
        } catch (error) {
            this.log(`Deployment failed: ${error.message}`, 'error');
            return false;
        }
    }

    async cleanup() {
        try {
            this.log('Cleaning up Alertmanager deployment...', 'info');
            
            const result = await this.exec(`kubectl delete -f ${this.manifestPath} --ignore-not-found=true`);
            if (result.success) {
                this.log('Alertmanager resources cleaned up', 'success');
            } else {
                this.log('Some resources may not have been cleaned up', 'error');
            }
            
            return true;
            
        } catch (error) {
            this.log(`Cleanup failed: ${error.message}`, 'error');
            return false;
        }
    }
}

// CLI usage
if (require.main === module) {
    const deployment = new AlertmanagerDeployment();
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
            console.log('Usage: node deploy-alertmanager.js [deploy|cleanup]');
            console.log('');
            console.log('Commands:');
            console.log('  deploy   - Deploy Alertmanager to Kubernetes');
            console.log('  cleanup  - Remove Alertmanager from Kubernetes');
            process.exit(1);
    }
}

module.exports = AlertmanagerDeployment;