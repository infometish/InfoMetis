/**
 * InfoMetis v0.3.0 - NiFi Components Cleanup
 * Selective cleanup script for NiFi application components only
 * Leaves infrastructure (K0s, Traefik) intact for faster testing iterations
 */

const Logger = require('../lib/logger');
const KubernetesUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');

class NiFiCleanup {
    constructor() {
        this.logger = new Logger('NiFi Cleanup');
        this.kubectl = new KubernetesUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
    }

    /**
     * Clean up NiFi application components
     */
    async cleanupNiFiComponents() {
        try {
            this.logger.header('InfoMetis v0.3.0 - NiFi Components Cleanup', 'Targeted Application Cleanup');
            
            // Check if cluster is available
            if (!await this.kubectl.isClusterReady()) {
                this.logger.warn('Kubernetes cluster not available - skipping NiFi cleanup');
                return true;
            }

            let hasErrors = false;

            // 1. Delete NiFi StatefulSet
            this.logger.step('Removing NiFi StatefulSet...');
            if (await this.kubectl.resourceExists('statefulset', 'nifi', 'infometis')) {
                const result = await this.kubectl.deleteResource('statefulset', 'nifi', 'infometis');
                if (result) {
                    this.logger.success('NiFi StatefulSet removed');
                } else {
                    this.logger.error('Failed to remove NiFi StatefulSet');
                    hasErrors = true;
                }
            } else {
                this.logger.info('NiFi StatefulSet not found');
            }

            // 2. Delete NiFi Registry Deployment
            this.logger.step('Removing NiFi Registry Deployment...');
            if (await this.kubectl.resourceExists('deployment', 'nifi-registry', 'infometis')) {
                const result = await this.kubectl.deleteResource('deployment', 'nifi-registry', 'infometis');
                if (result) {
                    this.logger.success('NiFi Registry Deployment removed');
                } else {
                    this.logger.error('Failed to remove NiFi Registry Deployment');
                    hasErrors = true;
                }
            } else {
                this.logger.info('NiFi Registry Deployment not found');
            }

            // 3. Delete NiFi Services
            this.logger.step('Removing NiFi Services...');
            const services = ['nifi-service', 'nifi-registry-service'];
            for (const service of services) {
                if (await this.kubectl.resourceExists('service', service, 'infometis')) {
                    const result = await this.kubectl.deleteResource('service', service, 'infometis');
                    if (result) {
                        this.logger.success(`Service ${service} removed`);
                    } else {
                        this.logger.error(`Failed to remove service ${service}`);
                        hasErrors = true;
                    }
                } else {
                    this.logger.info(`Service ${service} not found`);
                }
            }

            // 4. Delete Ingress Routes
            this.logger.step('Removing Ingress Routes...');
            const ingresses = ['nifi-ingress', 'nifi-registry-ingress'];
            for (const ingress of ingresses) {
                if (await this.kubectl.resourceExists('ingress', ingress, 'infometis')) {
                    const result = await this.kubectl.deleteResource('ingress', ingress, 'infometis');
                    if (result) {
                        this.logger.success(`Ingress ${ingress} removed`);
                    } else {
                        this.logger.error(`Failed to remove ingress ${ingress}`);
                        hasErrors = true;
                    }
                } else {
                    this.logger.info(`Ingress ${ingress} not found`);
                }
            }

            // 5. Wait for pods to terminate
            this.logger.step('Waiting for NiFi pods to terminate...');
            await this.waitForPodsTermination();

            // 6. Option to clean persistent volumes
            this.logger.newline();
            this.logger.warn('Persistent volumes are preserved for data safety');
            this.logger.info('To also remove persistent data, run: kubectl delete pvc --all -n infometis');
            this.logger.newline();

            // Summary
            if (hasErrors) {
                this.logger.error('NiFi cleanup completed with errors');
                this.logger.info('Infrastructure components (K0s, Traefik) remain available');
                return false;
            } else {
                this.logger.success('NiFi components cleaned up successfully');
                this.logger.info('Infrastructure ready for fresh NiFi deployment');
                return true;
            }

        } catch (error) {
            this.logger.error(`NiFi cleanup failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Wait for all NiFi pods to terminate
     */
    async waitForPodsTermination() {
        try {
            const maxWait = 60; // 60 seconds max wait
            const checkInterval = 2; // Check every 2 seconds
            let waited = 0;

            while (waited < maxWait) {
                const result = await this.exec.run('kubectl get pods -n infometis --no-headers 2>/dev/null', {}, true);
                
                if (!result.success || result.stdout.trim() === '') {
                    this.logger.success('All NiFi pods terminated');
                    return true;
                }

                const runningPods = result.stdout.trim().split('\n').length;
                this.logger.info(`Waiting for ${runningPods} pod(s) to terminate... (${waited}s/${maxWait}s)`);

                await new Promise(resolve => setTimeout(resolve, checkInterval * 1000));
                waited += checkInterval;
            }

            this.logger.warn('Timeout waiting for pod termination - some pods may still be terminating');
            return false;

        } catch (error) {
            this.logger.warn(`Error waiting for pod termination: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean persistent volumes (optional - destructive operation)
     */
    async cleanupPersistentVolumes() {
        try {
            this.logger.header('Cleaning Persistent Volumes', 'DESTRUCTIVE OPERATION - ALL DATA WILL BE LOST');
            
            const pvcs = ['nifi-content-repository', 'nifi-database-repository', 'nifi-flowfile-repository', 'nifi-provenance-repository'];
            
            for (const pvc of pvcs) {
                if (await this.kubectl.resourceExists('pvc', pvc, 'infometis')) {
                    const result = await this.kubectl.deleteResource('pvc', pvc, 'infometis');
                    if (result) {
                        this.logger.success(`PVC ${pvc} removed`);
                    } else {
                        this.logger.error(`Failed to remove PVC ${pvc}`);
                    }
                } else {
                    this.logger.info(`PVC ${pvc} not found`);
                }
            }

            this.logger.success('Persistent volumes cleaned up');
            return true;

        } catch (error) {
            this.logger.error(`PVC cleanup failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Show current NiFi component status
     */
    async showStatus() {
        try {
            this.logger.header('NiFi Components Status');

            if (!await this.kubectl.isClusterReady()) {
                this.logger.error('Kubernetes cluster not available');
                return false;
            }

            // Check namespace
            if (!await this.kubectl.resourceExists('namespace', 'infometis')) {
                this.logger.info('InfoMetis namespace not found - no NiFi components deployed');
                return true;
            }

            // Show pods
            this.logger.step('Pods:');
            await this.exec.run('kubectl get pods -n infometis');

            // Show services
            this.logger.step('Services:');
            await this.exec.run('kubectl get services -n infometis');

            // Show persistent volumes
            this.logger.step('Persistent Volume Claims:');
            await this.exec.run('kubectl get pvc -n infometis');

            return true;

        } catch (error) {
            this.logger.error(`Status check failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use as module
module.exports = NiFiCleanup;

// Allow direct execution
if (require.main === module) {
    const cleanup = new NiFiCleanup();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'cleanup';
    
    // Execute based on command
    switch (command) {
        case 'cleanup':
            cleanup.cleanupNiFiComponents().then(success => {
                process.exit(success ? 0 : 1);
            }).catch(error => {
                console.error('Fatal error:', error);
                process.exit(1);
            });
            break;
            
        case 'clean-volumes':
            cleanup.cleanupPersistentVolumes().then(success => {
                process.exit(success ? 0 : 1);
            }).catch(error => {
                console.error('Fatal error:', error);
                process.exit(1);
            });
            break;
            
        case 'status':
            cleanup.showStatus().then(success => {
                process.exit(success ? 0 : 1);
            }).catch(error => {
                console.error('Fatal error:', error);
                process.exit(1);
            });
            break;
            
        default:
            console.log('Usage: node cleanup-nifi.js {cleanup|clean-volumes|status}');
            console.log('');
            console.log('Commands:');
            console.log('  cleanup       - Remove NiFi components (preserves data)');
            console.log('  clean-volumes - Remove persistent volumes (DESTROYS DATA)');
            console.log('  status        - Show current NiFi component status');
            process.exit(0);
            break;
    }
}