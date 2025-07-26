/**
 * InfoMetis v0.3.0 - Kubectl Utility
 * Wrapper for kubectl operations with error handling and validation
 */

const ExecUtil = require('../exec');
const Logger = require('../logger');

class KubectlUtil {
    constructor(logger = null) {
        this.logger = logger || new Logger('Kubectl');
        this.exec = new ExecUtil(this.logger);
    }

    /**
     * Check if kubectl is available and configured
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        if (!await this.exec.commandExists('kubectl')) {
            this.logger.error('kubectl not found in PATH');
            return false;
        }

        // Test kubectl connectivity
        const result = await this.exec.run('kubectl cluster-info', {}, true);
        if (!result.success) {
            this.logger.error('kubectl not configured or cluster not accessible');
            return false;
        }

        return true;
    }

    /**
     * Check if namespace exists
     * @param {string} namespace - Namespace name
     * @returns {Promise<boolean>}
     */
    async namespaceExists(namespace) {
        const result = await this.exec.run(`kubectl get namespace ${namespace}`, {}, true);
        return result.success;
    }

    /**
     * Create namespace if it doesn't exist
     * @param {string} namespace - Namespace name
     * @returns {Promise<boolean>}
     */
    async ensureNamespace(namespace) {
        if (await this.namespaceExists(namespace)) {
            this.logger.info(`Namespace '${namespace}' already exists`);
            return true;
        }

        this.logger.step(`Creating namespace '${namespace}'...`);
        const result = await this.exec.run(`kubectl create namespace ${namespace}`);
        
        if (result.success) {
            this.logger.success(`Namespace '${namespace}' created`);
            return true;
        } else {
            this.logger.error(`Failed to create namespace '${namespace}': ${result.stderr}`);
            return false;
        }
    }

    /**
     * Apply YAML manifest
     * @param {string} yamlContent - YAML content to apply
     * @param {string} description - Description for logging
     * @returns {Promise<boolean>}
     */
    async applyYaml(yamlContent, description = 'manifest') {
        this.logger.step(`Applying ${description}...`);
        
        // Write YAML to temp file
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        
        const tempFile = path.join(os.tmpdir(), `infometis-${Date.now()}.yaml`);
        
        try {
            fs.writeFileSync(tempFile, yamlContent);
            
            const result = await this.exec.run(`kubectl apply -f ${tempFile}`);
            
            if (result.success) {
                this.logger.success(`${description} applied successfully`);
                return true;
            } else {
                this.logger.error(`Failed to apply ${description}: ${result.stderr}`);
                return false;
            }
        } finally {
            // Clean up temp file
            try {
                fs.unlinkSync(tempFile);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Check if pods are running for a label selector
     * @param {string} namespace - Namespace to check
     * @param {string} labelSelector - Label selector (e.g., 'app=nifi')
     * @returns {Promise<boolean>}
     */
    async arePodsRunning(namespace, labelSelector) {
        const result = await this.exec.run(
            `kubectl get pods -n ${namespace} -l ${labelSelector} --no-headers`, 
            {}, 
            true
        );
        
        if (!result.success) {
            return false;
        }

        const lines = result.stdout.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            return false;
        }

        // Check if all pods are running
        return lines.every(line => line.includes('Running'));
    }

    /**
     * Wait for deployment to be ready
     * @param {string} namespace - Namespace
     * @param {string} deploymentName - Deployment name
     * @param {number} timeoutSeconds - Timeout in seconds
     * @returns {Promise<boolean>}
     */
    async waitForDeployment(namespace, deploymentName, timeoutSeconds = 120) {
        this.logger.progress(`Waiting for deployment '${deploymentName}' to be ready...`);
        
        const result = await this.exec.run(
            `kubectl wait --for=condition=available deployment/${deploymentName} -n ${namespace} --timeout=${timeoutSeconds}s`
        );
        
        return result.success;
    }

    /**
     * Wait for StatefulSet to be ready
     * @param {string} namespace - Namespace
     * @param {string} statefulSetName - StatefulSet name
     * @param {number} timeoutSeconds - Timeout in seconds
     * @returns {Promise<boolean>}
     */
    async waitForStatefulSet(namespace, statefulSetName, timeoutSeconds = 300) {
        this.logger.progress(`Waiting for StatefulSet '${statefulSetName}' to be ready...`);
        
        const result = await this.exec.run(
            `kubectl wait --for=condition=ready pod -l app=${statefulSetName} -n ${namespace} --timeout=${timeoutSeconds}s`
        );
        
        return result.success;
    }

    /**
     * Wait for DaemonSet to be ready
     * @param {string} namespace - Namespace
     * @param {string} daemonSetName - DaemonSet name
     * @param {number} timeoutSeconds - Timeout in seconds
     * @returns {Promise<boolean>}
     */
    async waitForDaemonSet(namespace, daemonSetName, timeoutSeconds = 120) {
        this.logger.progress(`Waiting for DaemonSet '${daemonSetName}' to be ready...`);
        
        const result = await this.exec.run(
            `kubectl wait --for=condition=ready pod -l app=${daemonSetName} -n ${namespace} --timeout=${timeoutSeconds}s`
        );
        
        return result.success;
    }

    /**
     * Get service information
     * @param {string} namespace - Namespace
     * @param {string} serviceName - Service name
     * @returns {Promise<object|null>}
     */
    async getService(namespace, serviceName) {
        const result = await this.exec.run(
            `kubectl get service ${serviceName} -n ${namespace} -o json`, 
            {}, 
            true
        );
        
        if (result.success) {
            try {
                return JSON.parse(result.stdout);
            } catch (error) {
                this.logger.error(`Failed to parse service JSON: ${error.message}`);
            }
        }
        
        return null;
    }

    /**
     * Execute command in pod
     * @param {string} namespace - Namespace
     * @param {string} podSelector - Pod selector (deployment/name or pod/name)
     * @param {string} command - Command to execute
     * @param {boolean} silent - Don't log execution
     * @returns {Promise<{success: boolean, stdout: string, stderr: string}>}
     */
    async execInPod(namespace, podSelector, command, silent = false) {
        const kubectlCmd = `kubectl exec -n ${namespace} ${podSelector} -- ${command}`;
        return await this.exec.run(kubectlCmd, {}, silent);
    }

    /**
     * Get cluster information
     * @returns {Promise<object>}
     */
    async getClusterInfo() {
        const result = await this.exec.run('kubectl cluster-info --output json', {}, true);
        
        if (result.success) {
            try {
                return JSON.parse(result.stdout);
            } catch (error) {
                this.logger.warn(`Failed to parse cluster info JSON: ${error.message}`);
            }
        }
        
        return null;
    }
}

module.exports = KubectlUtil;