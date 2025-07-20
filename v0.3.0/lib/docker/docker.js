/**
 * InfoMetis v0.3.0 - Docker Utility
 * Wrapper for Docker operations with error handling and validation
 */

const ExecUtil = require('../exec');
const Logger = require('../logger');

class DockerUtil {
    constructor(logger = null) {
        this.logger = logger || new Logger('Docker');
        this.exec = new ExecUtil(this.logger);
    }

    /**
     * Check if Docker is available and running
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        if (!await this.exec.commandExists('docker')) {
            this.logger.error('Docker not found in PATH');
            return false;
        }

        // Test Docker daemon connectivity
        const result = await this.exec.run('docker info', {}, true);
        if (!result.success) {
            this.logger.error('Docker daemon is not running');
            return false;
        }

        return true;
    }

    /**
     * Check if container exists
     * @param {string} containerName - Container name
     * @returns {Promise<boolean>}
     */
    async containerExists(containerName) {
        const result = await this.exec.run(`docker ps -aq -f name=${containerName}`, {}, true);
        return result.success && result.stdout.trim().length > 0;
    }

    /**
     * Check if container is running
     * @param {string} containerName - Container name
     * @returns {Promise<boolean>}
     */
    async isContainerRunning(containerName) {
        const result = await this.exec.run(`docker ps -q -f name=${containerName}`, {}, true);
        return result.success && result.stdout.trim().length > 0;
    }

    /**
     * Start existing container
     * @param {string} containerName - Container name
     * @returns {Promise<boolean>}
     */
    async startContainer(containerName) {
        this.logger.step(`Starting container: ${containerName}`);
        const result = await this.exec.run(`docker start ${containerName}`);
        
        if (result.success) {
            this.logger.success(`Container ${containerName} started`);
            return true;
        } else {
            this.logger.error(`Failed to start container ${containerName}: ${result.stderr}`);
            return false;
        }
    }

    /**
     * Stop container
     * @param {string} containerName - Container name
     * @returns {Promise<boolean>}
     */
    async stopContainer(containerName) {
        this.logger.step(`Stopping container: ${containerName}`);
        const result = await this.exec.run(`docker stop ${containerName}`);
        
        if (result.success) {
            this.logger.success(`Container ${containerName} stopped`);
            return true;
        } else {
            this.logger.error(`Failed to stop container ${containerName}: ${result.stderr}`);
            return false;
        }
    }

    /**
     * Remove container
     * @param {string} containerName - Container name
     * @param {boolean} force - Force removal
     * @returns {Promise<boolean>}
     */
    async removeContainer(containerName, force = false) {
        this.logger.step(`Removing container: ${containerName}`);
        const forceFlag = force ? ' -f' : '';
        const result = await this.exec.run(`docker rm${forceFlag} ${containerName}`);
        
        if (result.success) {
            this.logger.success(`Container ${containerName} removed`);
            return true;
        } else {
            this.logger.error(`Failed to remove container ${containerName}: ${result.stderr}`);
            return false;
        }
    }

    /**
     * Run container with comprehensive options
     * @param {object} options - Container run options
     * @returns {Promise<boolean>}
     */
    async runContainer(options) {
        const {
            name,
            image,
            detached = true,
            privileged = false,
            hostname = null,
            volumes = [],
            ports = [],
            environment = [],
            networkMode = null,
            restartPolicy = null,
            securityOptions = [],
            cgroupns = null,
            tmpfs = [],
            pid = null,
            ipc = null,
            additionalFlags = []
        } = options;

        this.logger.step(`Creating container: ${name}`);

        // Build docker run command
        let cmd = 'docker run';
        
        if (detached) cmd += ' -d';
        if (privileged) cmd += ' --privileged';
        if (hostname) cmd += ` --hostname "${hostname}"`;
        if (networkMode) cmd += ` --network=${networkMode}`;
        if (restartPolicy) cmd += ` --restart=${restartPolicy}`;
        if (cgroupns) cmd += ` --cgroupns=${cgroupns}`;
        if (pid) cmd += ` --pid=${pid}`;
        if (ipc) cmd += ` --ipc=${ipc}`;

        cmd += ` --name "${name}"`;

        // Add volumes
        volumes.forEach(volume => {
            if (typeof volume === 'string') {
                cmd += ` --volume "${volume}"`;
            } else {
                cmd += ` --volume "${volume.source}:${volume.target}${volume.options ? ':' + volume.options : ''}"`;
            }
        });

        // Add ports
        ports.forEach(port => {
            if (typeof port === 'string') {
                cmd += ` --publish ${port}`;
            } else {
                cmd += ` --publish ${port.host}:${port.container}`;
            }
        });

        // Add environment variables
        environment.forEach(env => {
            if (typeof env === 'string') {
                cmd += ` --env "${env}"`;
            } else {
                cmd += ` --env "${env.name}=${env.value}"`;
            }
        });

        // Add security options
        securityOptions.forEach(opt => {
            cmd += ` --security-opt=${opt}`;
        });

        // Add tmpfs mounts
        tmpfs.forEach(mount => {
            cmd += ` --tmpfs=${mount}`;
        });

        // Add additional flags
        additionalFlags.forEach(flag => {
            cmd += ` ${flag}`;
        });

        cmd += ` "${image}"`;

        // Execute the command
        const result = await this.exec.run(cmd);
        
        if (result.success) {
            this.logger.success(`Container ${name} created and started`);
            return true;
        } else {
            this.logger.error(`Failed to create container ${name}: ${result.stderr}`);
            return false;
        }
    }

    /**
     * Load cached image from tar file
     * @param {string} imagePath - Path to image tar file
     * @param {string} imageName - Image name for logging
     * @returns {Promise<boolean>}
     */
    async loadImage(imagePath, imageName) {
        const fs = require('fs');
        
        if (!fs.existsSync(imagePath)) {
            this.logger.warn(`Cached image not found: ${imagePath}`);
            this.logger.info(`${imageName} will be pulled from registry`);
            return false;
        }

        this.logger.step(`Loading cached image: ${imageName}`);
        const result = await this.exec.run(`docker load -i "${imagePath}"`, {}, true);
        
        if (result.success) {
            this.logger.success(`${imageName} image loaded`);
            return true;
        } else {
            this.logger.warn(`Failed to load ${imageName} image: ${result.stderr}`);
            return false;
        }
    }

    /**
     * Execute command in running container
     * @param {string} containerName - Container name
     * @param {string} command - Command to execute
     * @param {boolean} interactive - Use interactive mode
     * @param {boolean} silent - Don't log execution
     * @returns {Promise<{success: boolean, stdout: string, stderr: string}>}
     */
    async execInContainer(containerName, command, interactive = false, silent = false) {
        const interactiveFlag = interactive ? '-it' : '';
        const dockerCmd = `docker exec ${interactiveFlag} ${containerName} ${command}`;
        return await this.exec.run(dockerCmd, {}, silent);
    }

    /**
     * Get container logs
     * @param {string} containerName - Container name
     * @param {number} lines - Number of lines to retrieve
     * @returns {Promise<string>}
     */
    async getContainerLogs(containerName, lines = 50) {
        const result = await this.exec.run(`docker logs --tail ${lines} ${containerName}`, {}, true);
        return result.success ? result.stdout : '';
    }

    /**
     * Get container status information
     * @param {string} containerName - Container name
     * @returns {Promise<object|null>}
     */
    async getContainerInfo(containerName) {
        const result = await this.exec.run(`docker inspect ${containerName}`, {}, true);
        
        if (result.success) {
            try {
                const info = JSON.parse(result.stdout);
                return info[0] || null;
            } catch (error) {
                this.logger.error(`Failed to parse container info: ${error.message}`);
            }
        }
        
        return null;
    }

    /**
     * Wait for container to be ready
     * @param {string} containerName - Container name
     * @param {number} maxAttempts - Maximum retry attempts
     * @param {number} delayMs - Delay between attempts
     * @returns {Promise<boolean>}
     */
    async waitForContainer(containerName, maxAttempts = 30, delayMs = 2000) {
        return await this.exec.waitFor(
            async () => {
                return await this.isContainerRunning(containerName);
            },
            maxAttempts,
            delayMs,
            `container ${containerName}`
        );
    }
}

module.exports = DockerUtil;