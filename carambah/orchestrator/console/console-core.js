/**
 * InfoMetis v0.4.0 - Console Core
 * Native JavaScript implementation of console functionality
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');

class ConsoleCore {
    constructor() {
        this.logger = new Logger('InfoMetis v0.4.0');
        this.config = new ConfigUtil(this.logger);
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        
        this.consoleConfig = null;
        this.imageConfig = null;
    }

    /**
     * Initialize console with configuration loading
     */
    async initialize() {
        try {
            this.logger.header('InfoMetis v0.4.0 Console', 'Elasticsearch Integration Platform');
            
            // Load configurations
            this.consoleConfig = await this.config.loadConsoleConfig('v0.4.0');
            this.imageConfig = await this.config.loadImageConfig();
            
            this.logger.success('Console initialized successfully');
            return true;
        } catch (error) {
            this.logger.error(`Failed to initialize console: ${error.message}`);
            return false;
        }
    }

    /**
     * Check system prerequisites
     */
    async checkPrerequisites() {
        this.logger.header('Checking Prerequisites');
        
        const checks = [
            { name: 'Node.js', check: () => process.version },
            { name: 'Docker', check: () => this.exec.commandExists('docker') }
        ];

        let allPassed = true;

        for (const { name, check } of checks) {
            try {
                const result = await check();
                if (result) {
                    this.logger.success(`${name}: Available`);
                    if (typeof result === 'string') {
                        this.logger.info(`  Version: ${result}`);
                    }
                } else {
                    this.logger.error(`${name}: Not available`);
                    allPassed = false;
                }
            } catch (error) {
                this.logger.error(`${name}: Check failed - ${error.message}`);
                allPassed = false;
            }
        }

        return allPassed;
    }

    /**
     * Display configuration information
     */
    displayConfig() {
        if (this.imageConfig) {
            this.logger.config('Container Images', {
                'NiFi': this.imageConfig.NIFI_IMAGE || 'apache/nifi:1.23.2',
                'Registry': this.imageConfig.NIFI_REGISTRY_IMAGE || 'apache/nifi-registry:1.23.2',
                'k0s': this.imageConfig.K0S_IMAGE || 'k0sproject/k0s:latest',
                'Traefik': this.imageConfig.TRAEFIK_IMAGE || 'traefik:latest'
            });
        }

        if (this.consoleConfig) {
            this.logger.config('Console Configuration', {
                'Title': this.consoleConfig.title,
                'Version': this.consoleConfig.version,
                'Sections': this.consoleConfig.sections.length
            });
        }
    }

    /**
     * Execute a deployment step (JavaScript function)
     * @param {function} stepFunction - Function to execute
     * @param {string} description - Description of the step
     * @returns {Promise<boolean>}
     */
    async executeStep(stepFunction, description) {
        this.logger.step(description);
        
        try {
            const result = await stepFunction();
            if (result) {
                this.logger.success(`${description} - Completed`);
                return true;
            } else {
                this.logger.error(`${description} - Failed`);
                return false;
            }
        } catch (error) {
            this.logger.error(`${description} - Error: ${error.message}`);
            return false;
        }
    }

    /**
     * Example: Check cluster status (converted from bash equivalent)
     */
    async checkClusterStatus() {
        return await this.executeStep(async () => {
            // Check if kubectl is available
            if (!await this.kubectl.isAvailable()) {
                return false;
            }

            // Check if infometis namespace exists
            const namespaceExists = await this.kubectl.namespaceExists('infometis');
            if (namespaceExists) {
                this.logger.info('InfoMetis namespace found');
                
                // Check for running pods
                const podsRunning = await this.kubectl.arePodsRunning('infometis', 'app=nifi');
                if (podsRunning) {
                    this.logger.info('NiFi pods are running');
                }
                
                return true;
            } else {
                this.logger.info('InfoMetis namespace not found (fresh environment)');
                return true; // Not an error for fresh installs
            }
        }, 'Checking cluster status');
    }

    /**
     * Example: Deploy namespace (converted from bash equivalent)
     */
    async deployNamespace() {
        return await this.executeStep(async () => {
            return await this.kubectl.ensureNamespace('infometis');
        }, 'Deploying InfoMetis namespace');
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        this.config.clearCache();
        this.logger.info('Console cleanup completed');
    }
}

module.exports = ConsoleCore;