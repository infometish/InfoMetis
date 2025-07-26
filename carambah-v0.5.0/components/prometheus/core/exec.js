/**
 * InfoMetis v0.3.0 - Process Execution Utility
 * Wraps child_process.exec with consistent error handling and logging
 */

const { exec } = require('child_process');
const Logger = require('./logger');

class ExecUtil {
    constructor(logger = null) {
        this.logger = logger || new Logger('ExecUtil');
    }

    /**
     * Execute shell command with promise wrapper
     * @param {string} command - Command to execute
     * @param {object} options - Options for exec
     * @param {boolean} silent - Don't log command execution
     * @returns {Promise<{stdout, stderr, success}>}
     */
    async run(command, options = {}, silent = false) {
        if (!silent) {
            this.logger.step(`Executing: ${command}`);
        }

        return new Promise((resolve, reject) => {
            exec(command, { 
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                timeout: 120000, // 2 minutes timeout
                ...options 
            }, (error, stdout, stderr) => {
                const result = {
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    success: !error,
                    exitCode: error ? error.code : 0
                };

                if (error) {
                    if (!silent) {
                        this.logger.error(`Command failed: ${command}`);
                        this.logger.error(`Exit code: ${error.code}`);
                        if (stderr) this.logger.error(`Error: ${stderr}`);
                    }
                    resolve(result); // Don't reject, return error info
                } else {
                    if (!silent && stdout) {
                        this.logger.raw(stdout);
                    }
                    resolve(result);
                }
            });
        });
    }

    /**
     * Execute command and return success boolean
     * @param {string} command - Command to execute
     * @param {boolean} silent - Don't log execution
     * @returns {Promise<boolean>}
     */
    async check(command, silent = true) {
        const result = await this.run(command, {}, silent);
        return result.success;
    }

    /**
     * Execute command and get stdout or throw error
     * @param {string} command - Command to execute
     * @param {boolean} silent - Don't log execution
     * @returns {Promise<string>}
     */
    async output(command, silent = true) {
        const result = await this.run(command, {}, silent);
        if (!result.success) {
            throw new Error(`Command failed: ${command}\n${result.stderr}`);
        }
        return result.stdout;
    }

    /**
     * Check if command exists in PATH
     * @param {string} command - Command to check
     * @returns {Promise<boolean>}
     */
    async commandExists(command) {
        const checkCmd = process.platform === 'win32' 
            ? `where ${command}` 
            : `which ${command}`;
        return await this.check(checkCmd, true);
    }

    /**
     * Wait for condition with retries
     * @param {function} condition - Async function that returns boolean
     * @param {number} maxAttempts - Maximum retry attempts
     * @param {number} delayMs - Delay between attempts in milliseconds
     * @param {string} description - Description for logging
     * @returns {Promise<boolean>}
     */
    async waitFor(condition, maxAttempts = 30, delayMs = 5000, description = 'condition') {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (await condition()) {
                    this.logger.success(`${description} ready after ${attempt} attempt(s)`);
                    return true;
                }
            } catch (error) {
                this.logger.warn(`${description} check failed: ${error.message}`);
            }

            if (attempt < maxAttempts) {
                this.logger.progress(`Waiting for ${description} (${attempt}/${maxAttempts})...`);
                await this.delay(delayMs);
            }
        }

        this.logger.error(`${description} not ready after ${maxAttempts} attempts`);
        return false;
    }

    /**
     * Simple delay utility
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ExecUtil;