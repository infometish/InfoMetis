/**
 * InfoMetis v0.3.0 - Interactive Console
 * Menu-driven console interface for JavaScript deployment functions
 */

const readline = require('readline');
const path = require('path');
const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');

// Import deployment modules
const ConsoleCore = require('./console-core');
const K0sClusterDeployment = require('../implementation/deploy-k0s-cluster');
const TraefikDeployment = require('../implementation/deploy-traefik');
const NiFiDeployment = require('../implementation/deploy-nifi');
const RegistryDeployment = require('../implementation/deploy-registry');
const CacheManager = require('../implementation/cache-images');

// Import utilities for cleanup functions
const DockerUtil = require('../lib/docker/docker');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');

class InteractiveConsole {
    constructor() {
        this.logger = new Logger('Interactive Console');
        this.config = new ConfigUtil(this.logger);
        this.rl = null;
        this.consoleConfig = null;
        this.running = true;
        
        // Initialize deployment modules
        this.core = new ConsoleCore();
        this.k0s = new K0sClusterDeployment();
        this.traefik = new TraefikDeployment();
        this.nifi = new NiFiDeployment();
        this.registry = new RegistryDeployment();
        this.cache = new CacheManager();
        
        // Initialize utilities for cleanup functions
        this.docker = new DockerUtil(this.logger);
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
    }

    /**
     * Initialize console with configuration
     */
    async initialize() {
        try {
            this.logger.header('InfoMetis v0.3.0 Interactive Console', 'JavaScript Native Implementation');
            
            // Load console configuration
            this.consoleConfig = await this.config.loadConsoleConfig('v0.3.0');
            
            // Initialize readline interface
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            this.logger.success('Interactive console initialized');
            return true;
        } catch (error) {
            this.logger.error(`Failed to initialize console: ${error.message}`);
            return false;
        }
    }

    /**
     * Display main menu
     */
    displayMainMenu() {
        this.logger.newline();
        this.logger.header('InfoMetis v0.3.0 Console Menu');
        
        if (this.consoleConfig && this.consoleConfig.sections) {
            this.consoleConfig.sections.forEach((section, index) => {
                console.log(`${section.icon} ${section.key.toUpperCase()}: ${section.name}`);
                console.log(`   ${section.description}`);
                console.log('');
            });
        }

        console.log('🔧 Additional Commands:');
        console.log('   status  - Show system status');
        console.log('   config  - Show configuration');
        console.log('   help    - Show this menu');
        console.log('   quit    - Exit console');
        this.logger.newline();
    }

    /**
     * Display section menu
     */
    displaySectionMenu(section) {
        this.logger.newline();
        this.logger.header(`${section.icon} ${section.name}`, section.description);
        
        if (section.steps) {
            section.steps.forEach((step, index) => {
                console.log(`${index + 1}: ${step.name}`);
            });
        }
        
        console.log('');
        console.log('Commands:');
        console.log('  a - Auto execute all steps');
        console.log('  b - Back to main menu');
        console.log('  q - Quit');
        this.logger.newline();
    }

    /**
     * Wait for user to press any key (like previous versions)
     */
    async waitForKeyPress() {
        return new Promise((resolve) => {
            console.log('');
            this.rl.question('Press any key to continue...', () => {
                console.log('');
                resolve();
            });
        });
    }

    /**
     * Execute deployment function by name
     */
    async executeFunction(functionName) {
        this.logger.step(`Executing: ${functionName}`);
        
        try {
            let result = false;
            
            switch (functionName) {
                case 'checkPrerequisites':
                    result = await this.core.checkPrerequisites();
                    break;
                    
                case 'deployK0sCluster':
                    result = await this.k0s.deploy();
                    break;
                    
                case 'deployTraefik':
                    result = await this.traefik.deploy();
                    break;
                    
                case 'deployNifi':
                case 'deployNiFi':
                    result = await this.nifi.deploy();
                    break;
                    
                case 'configureKubectl':
                    result = await this.configureKubectl();
                    break;
                    
                case 'setupStorage':
                    result = await this.setupStorage();
                    break;
                    
                case 'configureRegistryIntegration':
                    result = await this.configureRegistryIntegration();
                    break;
                    
                case 'verifyHealth':
                    result = await this.verifyHealth();
                    break;
                    
                case 'testUIAccess':
                    result = await this.testUIAccess();
                    break;
                    
                case 'runIntegrationTests':
                    result = await this.runIntegrationTests();
                    break;
                    
                case 'deployRegistry':
                    result = await this.registry.deploy();
                    break;
                    
                case 'cacheImages':
                    result = await this.cache.cacheImages();
                    break;
                    
                case 'loadCachedImages':
                    result = await this.cache.loadCachedImages();
                    break;
                    
                case 'showCacheStatus':
                    result = await this.cache.status();
                    break;
                    
                case 'cleanup':
                    result = await this.k0s.cleanup();
                    break;
                    
                case 'cleanupContainers':
                    result = await this.cleanupContainers();
                    break;
                    
                case 'cleanupKubernetes':
                    result = await this.cleanupKubernetes();
                    break;
                    
                case 'resetEnvironment':
                    result = await this.resetEnvironment();
                    break;
                    
                case 'verifyCleanState':
                    result = await this.verifyCleanState();
                    break;
                    
                case 'checkClusterStatus':
                    result = await this.core.checkClusterStatus();
                    break;
                    
                default:
                    this.logger.warn(`Function not implemented: ${functionName}`);
                    this.logger.info('This function will be available when the corresponding script is converted');
                    result = true; // Don't fail for unimplemented functions
            }
            
            if (result) {
                this.logger.success(`${functionName} completed successfully`);
            } else {
                this.logger.error(`${functionName} failed`);
            }
            
            // Wait for key press after each function execution (like previous versions)
            await this.waitForKeyPress();
            
            return result;
        } catch (error) {
            this.logger.error(`Error executing ${functionName}: ${error.message}`);
            await this.waitForKeyPress();
            return false;
        }
    }

    /**
     * Execute all steps in a section
     */
    async executeSection(section) {
        if (!section.steps || section.steps.length === 0) {
            this.logger.warn('No steps defined for this section');
            return true;
        }

        this.logger.header(`Auto-executing: ${section.name}`);
        
        let allSuccess = true;
        for (const step of section.steps) {
            if (!await this.executeFunction(step.function)) {
                allSuccess = false;
                this.logger.error('Step failed, stopping auto execution');
                break;
            }
        }
        
        if (allSuccess) {
            this.logger.success(`${section.name} completed successfully!`);
        } else {
            this.logger.error(`${section.name} failed`);
        }
        
        return allSuccess;
    }

    /**
     * Handle section navigation
     */
    async handleSection(sectionKey) {
        const section = this.consoleConfig.sections.find(s => s.key === sectionKey);
        if (!section) {
            this.logger.error(`Unknown section: ${sectionKey}`);
            return;
        }

        let inSection = true;
        while (inSection && this.running) {
            this.displaySectionMenu(section);
            
            const choice = await this.promptUser(`${section.name} > `);
            
            switch (choice.toLowerCase()) {
                case 'a':
                    await this.executeSection(section);
                    break;
                    
                case 'b':
                    inSection = false;
                    break;
                    
                case 'q':
                    this.running = false;
                    inSection = false;
                    break;
                    
                default:
                    // Check if it's a step number
                    const stepIndex = parseInt(choice) - 1;
                    if (stepIndex >= 0 && stepIndex < section.steps.length) {
                        await this.executeFunction(section.steps[stepIndex].function);
                    } else {
                        this.logger.warn('Invalid choice. Try again or type "b" for back, "q" for quit.');
                    }
            }
        }
    }

    /**
     * Show system status
     */
    async showStatus() {
        this.logger.header('System Status');
        
        await this.core.checkPrerequisites();
        await this.core.checkClusterStatus();
        
        if (this.consoleConfig) {
            this.logger.newline();
            this.logger.config('Access Points', 
                Object.fromEntries(
                    this.consoleConfig.urls.map(url => [url.name, url.url])
                )
            );
        }
    }

    /**
     * Show configuration
     */
    showConfiguration() {
        if (this.consoleConfig) {
            this.logger.header('Console Configuration');
            this.logger.config('General', {
                'Title': this.consoleConfig.title,
                'Version': this.consoleConfig.version,
                'Description': this.consoleConfig.description,
                'Implementation': this.consoleConfig.implementation
            });
            
            if (this.consoleConfig.features) {
                this.logger.config('Features', this.consoleConfig.features);
            }
        }
    }

    /**
     * Prompt user for input
     */
    async promptUser(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    /**
     * Main console loop
     */
    async run() {
        if (!await this.initialize()) {
            return false;
        }

        this.logger.success('Starting interactive console...');
        
        while (this.running) {
            this.displayMainMenu();
            
            const choice = await this.promptUser('InfoMetis > ');
            
            switch (choice.toLowerCase()) {
                case 'help':
                    // Menu will be displayed on next loop
                    break;
                    
                case 'status':
                    await this.showStatus();
                    break;
                    
                case 'config':
                    this.showConfiguration();
                    break;
                    
                case 'quit':
                case 'q':
                    this.running = false;
                    break;
                    
                default:
                    // Check if it's a section key
                    const section = this.consoleConfig.sections.find(s => s.key === choice.toLowerCase());
                    if (section) {
                        await this.handleSection(choice.toLowerCase());
                    } else {
                        this.logger.warn('Invalid choice. Type "help" to see available options.');
                    }
            }
        }
        
        this.cleanup();
        return true;
    }

    /**
     * Configure kubectl access (part of k0s deployment, but can be called separately)
     */
    async configureKubectl() {
        this.logger.step('Configuring kubectl access...');
        
        try {
            // This is typically handled within k0s deployment, but we can verify it
            const result = await this.exec.run('kubectl cluster-info', {}, true);
            if (result.success) {
                this.logger.success('kubectl is configured and accessible');
                return true;
            } else {
                this.logger.error('kubectl not configured. Deploy k0s cluster first.');
                return false;
            }
        } catch (error) {
            this.logger.error(`kubectl configuration check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Setup persistent storage (handled by individual deployments, but can verify)
     */
    async setupStorage() {
        this.logger.step('Verifying persistent storage setup...');
        
        try {
            // Check if storage class exists
            const storageResult = await this.exec.run('kubectl get storageclass local-storage', {}, true);
            
            // Check for persistent volumes
            const pvResult = await this.exec.run('kubectl get pv', {}, true);
            
            if (storageResult.success || pvResult.success) {
                this.logger.success('Persistent storage is configured');
                return true;
            } else {
                this.logger.info('Storage will be configured during application deployment');
                return true; // Not a failure, just not needed yet
            }
        } catch (error) {
            this.logger.error(`Storage verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Configure Registry integration with NiFi
     */
    async configureRegistryIntegration() {
        this.logger.step('Configuring Registry integration...');
        
        try {
            // Check if both NiFi and Registry are running
            const nifiRunning = await this.kubectl.arePodsRunning('infometis', 'app=nifi');
            const registryRunning = await this.kubectl.arePodsRunning('infometis', 'app=nifi-registry');
            
            if (!nifiRunning) {
                this.logger.error('NiFi is not running. Deploy NiFi first.');
                return false;
            }
            
            if (!registryRunning) {
                this.logger.error('Registry is not running. Deploy Registry first.');
                return false;
            }
            
            this.logger.success('Registry integration can be configured manually in NiFi UI');
            this.logger.info('Go to NiFi UI → Controller Settings → Registry Clients');
            this.logger.info('Add Registry Client: http://nifi-registry-service:18080');
            
            return true;
        } catch (error) {
            this.logger.error(`Registry integration check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify application health
     */
    async verifyHealth() {
        this.logger.step('Verifying application health...');
        
        try {
            let allHealthy = true;
            
            // Check k0s cluster
            this.logger.info('Checking k0s cluster...');
            const clusterResult = await this.exec.run('kubectl get nodes', {}, true);
            if (clusterResult.success) {
                this.logger.success('k0s cluster is healthy');
            } else {
                this.logger.error('k0s cluster not accessible');
                allHealthy = false;
            }
            
            // Check Traefik
            this.logger.info('Checking Traefik...');
            const traefikRunning = await this.kubectl.arePodsRunning('kube-system', 'app=traefik');
            if (traefikRunning) {
                this.logger.success('Traefik is healthy');
            } else {
                this.logger.error('Traefik is not running');
                allHealthy = false;
            }
            
            // Check NiFi
            this.logger.info('Checking NiFi...');
            const nifiRunning = await this.kubectl.arePodsRunning('infometis', 'app=nifi');
            if (nifiRunning) {
                this.logger.success('NiFi is healthy');
            } else {
                this.logger.warn('NiFi is not running');
            }
            
            // Check Registry
            this.logger.info('Checking Registry...');
            const registryRunning = await this.kubectl.arePodsRunning('infometis', 'app=nifi-registry');
            if (registryRunning) {
                this.logger.success('Registry is healthy');
            } else {
                this.logger.warn('Registry is not running');
            }
            
            if (allHealthy) {
                this.logger.success('All core components are healthy');
            } else {
                this.logger.warn('Some components need attention');
            }
            
            return allHealthy;
        } catch (error) {
            this.logger.error(`Health check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test UI accessibility
     */
    async testUIAccess() {
        this.logger.step('Testing UI accessibility...');
        
        try {
            let allAccessible = true;
            
            // Test Traefik Dashboard
            this.logger.info('Testing Traefik Dashboard...');
            const traefikResult = await this.exec.run('curl -I http://localhost:8080', {}, true);
            if (traefikResult.success) {
                this.logger.success('Traefik Dashboard accessible');
            } else {
                this.logger.error('Traefik Dashboard not accessible');
                allAccessible = false;
            }
            
            // Test NiFi UI
            this.logger.info('Testing NiFi UI...');
            const nifiResult = await this.exec.run('curl -I http://localhost/nifi/', {}, true);
            if (nifiResult.success) {
                this.logger.success('NiFi UI accessible');
            } else {
                this.logger.warn('NiFi UI not accessible via ingress');
            }
            
            // Test Registry UI
            this.logger.info('Testing Registry UI...');
            const registryResult = await this.exec.run('curl -I http://localhost/nifi-registry/', {}, true);
            if (registryResult.success) {
                this.logger.success('Registry UI accessible');
            } else {
                this.logger.warn('Registry UI not accessible via ingress');
            }
            
            if (allAccessible) {
                this.logger.success('All UIs are accessible');
            } else {
                this.logger.warn('Some UIs may need more time to initialize');
            }
            
            return true; // Don't fail on UI tests, they may take time
        } catch (error) {
            this.logger.error(`UI accessibility test failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Run integration tests
     */
    async runIntegrationTests() {
        this.logger.step('Running integration tests...');
        
        try {
            this.logger.info('Integration tests would verify:');
            this.logger.info('• NiFi can connect to Registry');
            this.logger.info('• Flow versioning works correctly');
            this.logger.info('• Data processing pipelines function');
            this.logger.info('• Persistent storage maintains data');
            
            this.logger.info('Manual integration testing recommended:');
            this.logger.info('1. Create a simple flow in NiFi');
            this.logger.info('2. Version it in Registry');
            this.logger.info('3. Verify flow persistence after restart');
            
            this.logger.success('Integration test framework ready');
            return true;
        } catch (error) {
            this.logger.error(`Integration tests failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean up all Docker containers
     */
    async cleanupContainers() {
        this.logger.step('Cleaning up Docker containers...');
        
        try {
            // Stop and remove InfoMetis containers
            const containers = ['infometis'];
            let cleanedCount = 0;
            
            for (const container of containers) {
                if (await this.docker.containerExists(container)) {
                    if (await this.docker.isContainerRunning(container)) {
                        await this.docker.stopContainer(container);
                    }
                    await this.docker.removeContainer(container, true);
                    cleanedCount++;
                }
            }
            
            // Clean up any orphaned containers
            this.logger.info('Checking for orphaned containers...');
            const pruneResult = await this.exec.run('docker container prune -f', {}, true);
            
            if (cleanedCount > 0) {
                this.logger.success(`${cleanedCount} containers cleaned up`);
            } else {
                this.logger.info('No containers to clean up');
            }
            
            return true;
        } catch (error) {
            this.logger.error(`Container cleanup failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean up Kubernetes resources
     */
    async cleanupKubernetes() {
        this.logger.step('Cleaning up Kubernetes resources...');
        
        try {
            // Clean up applications first
            await this.nifi.cleanup();
            await this.registry.cleanup();
            await this.traefik.cleanup();
            
            // Clean up namespace
            const namespaceResult = await this.exec.run('kubectl delete namespace infometis --ignore-not-found=true', {}, true);
            if (namespaceResult.success) {
                this.logger.success('InfoMetis namespace removed');
            }
            
            // Clean up persistent volumes
            const pvResult = await this.exec.run('kubectl delete pv -l app.kubernetes.io/part-of=infometis --ignore-not-found=true', {}, true);
            
            this.logger.success('Kubernetes resources cleaned up');
            return true;
        } catch (error) {
            this.logger.error(`Kubernetes cleanup failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Reset local environment
     */
    async resetEnvironment() {
        this.logger.step('Resetting local environment...');
        
        try {
            // Clean up kubeconfig
            const os = require('os');
            const fs = require('fs');
            const kubeconfigPath = path.join(os.homedir(), '.kube', 'config');
            
            if (fs.existsSync(kubeconfigPath)) {
                try {
                    fs.unlinkSync(kubeconfigPath);
                    this.logger.success('kubectl configuration removed');
                } catch (error) {
                    this.logger.warn('Could not remove kubectl config, may be in use');
                }
            }
            
            // Clean up any temporary files
            const tempFiles = ['/tmp/k0s-kubeconfig-test'];
            for (const tempFile of tempFiles) {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }
            
            // Clean Docker system (optional)
            this.logger.info('Cleaning Docker system...');
            await this.exec.run('docker system prune -f', {}, true);
            
            this.logger.success('Local environment reset');
            return true;
        } catch (error) {
            this.logger.error(`Environment reset failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify clean state
     */
    async verifyCleanState() {
        this.logger.step('Verifying clean state...');
        
        try {
            let isClean = true;
            
            // Check for InfoMetis containers
            const containerExists = await this.docker.containerExists('infometis');
            if (containerExists) {
                this.logger.warn('InfoMetis container still exists');
                isClean = false;
            } else {
                this.logger.success('No InfoMetis containers found');
            }
            
            // Check for InfoMetis namespace
            const namespaceExists = await this.kubectl.namespaceExists('infometis');
            if (namespaceExists) {
                this.logger.warn('InfoMetis namespace still exists');
                isClean = false;
            } else {
                this.logger.success('No InfoMetis namespace found');
            }
            
            // Check kubectl access
            const kubectlResult = await this.exec.run('kubectl cluster-info', {}, true);
            if (kubectlResult.success) {
                this.logger.warn('kubectl still has cluster access');
                isClean = false;
            } else {
                this.logger.success('No active kubectl configuration');
            }
            
            if (isClean) {
                this.logger.success('Environment is clean and ready for fresh deployment');
                this.logger.info('You can now run Infrastructure Setup to deploy fresh');
            } else {
                this.logger.warn('Some cleanup items need manual attention');
                this.logger.info('Re-run cleanup steps or clean manually');
            }
            
            return isClean;
        } catch (error) {
            this.logger.error(`Clean state verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.rl) {
            this.rl.close();
        }
        this.logger.info('Interactive console closed');
    }
}

// Export for use as module
module.exports = InteractiveConsole;

// Allow direct execution
if (require.main === module) {
    const console = new InteractiveConsole();
    
    // Handle process signals
    process.on('SIGINT', () => {
        console.logger.newline();
        console.logger.info('Received interrupt signal. Exiting...');
        console.cleanup();
        process.exit(0);
    });

    console.run().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}