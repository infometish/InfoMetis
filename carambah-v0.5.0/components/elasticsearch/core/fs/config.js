/**
 * InfoMetis v0.3.0 - Configuration File Utility
 * Handles loading and parsing of configuration files
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../logger');

class ConfigUtil {
    constructor(logger = null) {
        this.logger = logger || new Logger('Config');
        this.cache = new Map();
    }

    /**
     * Load environment configuration file
     * @param {string} configPath - Path to config file
     * @returns {Promise<object>}
     */
    async loadEnvConfig(configPath) {
        if (this.cache.has(configPath)) {
            return this.cache.get(configPath);
        }

        try {
            if (!fs.existsSync(configPath)) {
                throw new Error(`Config file not found: ${configPath}`);
            }

            const content = fs.readFileSync(configPath, 'utf8');
            const config = {};

            // Parse simple KEY=VALUE format
            content.split('\n').forEach(line => {
                line = line.trim();
                if (line && !line.startsWith('#')) {
                    const [key, ...valueParts] = line.split('=');
                    if (key && valueParts.length > 0) {
                        let value = valueParts.join('=').trim();
                        // Remove quotes if present
                        if ((value.startsWith('"') && value.endsWith('"')) ||
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.slice(1, -1);
                        }
                        config[key.trim()] = value;
                    }
                }
            });

            this.cache.set(configPath, config);
            return config;
        } catch (error) {
            this.logger.error(`Failed to load config file ${configPath}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Load JSON configuration file
     * @param {string} configPath - Path to JSON config file
     * @returns {Promise<object>}
     */
    async loadJsonConfig(configPath) {
        if (this.cache.has(configPath)) {
            return this.cache.get(configPath);
        }

        try {
            if (!fs.existsSync(configPath)) {
                throw new Error(`Config file not found: ${configPath}`);
            }

            const content = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(content);

            this.cache.set(configPath, config);
            return config;
        } catch (error) {
            this.logger.error(`Failed to load JSON config ${configPath}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get project root directory
     * @returns {string}
     */
    getProjectRoot() {
        let currentDir = __dirname;
        
        // Walk up directory tree to find project root (contains package.json or .git)
        while (currentDir !== path.dirname(currentDir)) {
            if (fs.existsSync(path.join(currentDir, 'package.json')) ||
                fs.existsSync(path.join(currentDir, '.git')) ||
                fs.existsSync(path.join(currentDir, 'v0.3.0'))) {
                return currentDir;
            }
            currentDir = path.dirname(currentDir);
        }
        
        // Fallback: assume we're in v0.3.0/lib/fs and go up to project root
        return path.resolve(__dirname, '../../..');
    }

    /**
     * Resolve path relative to project root
     * @param {string} relativePath - Path relative to project root
     * @returns {string}
     */
    resolvePath(relativePath) {
        return path.resolve(this.getProjectRoot(), relativePath);
    }

    /**
     * Load image configuration
     * @returns {Promise<object>}
     */
    async loadImageConfig() {
        const configPath = path.resolve(__dirname, '../../config/image-config.js');
        delete require.cache[require.resolve(configPath)]; // Clear cache for hot reload
        return require(configPath);
    }

    /**
     * Load console configuration from current directory
     * @returns {Promise<object>}
     */
    async loadConsoleConfig() {
        const configPath = path.resolve(__dirname, '../../config/console/console-config.json');
        return await this.loadJsonConfig(configPath);
    }

    /**
     * Save JSON configuration file
     * @param {string} configPath - Path to save config
     * @param {object} config - Configuration object
     * @returns {Promise<void>}
     */
    async saveJsonConfig(configPath, config) {
        try {
            const dir = path.dirname(configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const content = JSON.stringify(config, null, 2);
            fs.writeFileSync(configPath, content, 'utf8');
            
            // Clear cache
            this.cache.delete(configPath);
            
            this.logger.success(`Config saved: ${configPath}`);
        } catch (error) {
            this.logger.error(`Failed to save config ${configPath}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Clear configuration cache
     */
    clearCache() {
        this.cache.clear();
    }
}

module.exports = ConfigUtil;