/**
 * InfoMetis v0.3.0 - Cache Management
 * JavaScript implementation of C2-cache-images.sh
 * Downloads and manages Docker images for offline deployment
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const DockerUtil = require('../lib/docker/docker');
const ExecUtil = require('../lib/exec');
const fs = require('fs');
const path = require('path');

class CacheManager {
    constructor() {
        this.logger = new Logger('Cache Manager');
        this.config = new ConfigUtil(this.logger);
        this.docker = new DockerUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        
        this.cacheDir = null;
        this.tempDir = null;
        
        // Container images used in v0.3.0
        this.images = [
            'k0sproject/k0s:latest',
            'traefik:v2.9',
            'apache/nifi:1.23.2',
            'apache/nifi-registry:1.23.2'
        ];
    }

    /**
     * Initialize cache manager with configuration
     */
    async initialize() {
        try {
            this.logger.header('InfoMetis v0.3.0 - Cache Management', 'JavaScript Native Implementation');
            
            // Set up directories
            this.cacheDir = this.config.resolvePath('cache/images');
            this.tempDir = path.join(require('os').tmpdir(), `infometis-v0.3.0-cache-${Date.now()}`);
            
            this.logger.config('Cache Configuration', {
                'Cache Directory': this.cacheDir,
                'Temp Directory': this.tempDir,
                'Images to manage': this.images.length
            });
            
            return true;
        } catch (error) {
            this.logger.error(`Failed to initialize: ${error.message}`);
            return false;
        }
    }

    /**
     * Create cache directory structure
     */
    async createCacheDir() {
        this.logger.step('Creating cache directory...');
        
        try {
            // Create cache directory
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }
            
            // Create temp directory
            if (!fs.existsSync(this.tempDir)) {
                fs.mkdirSync(this.tempDir, { recursive: true });
            }
            
            this.logger.success(`Cache directory ready: ${this.cacheDir}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to create cache directory: ${error.message}`);
            return false;
        }
    }

    /**
     * Get filename for cached image
     */
    getImageFilename(image) {
        return image.replace(/[\/\:]/g, '-') + '.tar';
    }

    /**
     * Get file path for cached image
     */
    getImageFilePath(image) {
        return path.join(this.cacheDir, this.getImageFilename(image));
    }

    /**
     * Cache a single Docker image
     */
    async cacheImage(image) {
        const filename = this.getImageFilename(image);
        const filepath = this.getImageFilePath(image);
        
        this.logger.step(`Processing: ${image}`);
        
        try {
            // Check if already cached
            if (fs.existsSync(filepath)) {
                const stats = fs.statSync(filepath);
                const sizeStr = this.formatFileSize(stats.size);
                this.logger.info(`Already cached: ${filename} (${sizeStr})`);
                return true;
            }
            
            // Check Docker availability
            if (!await this.docker.isAvailable()) {
                throw new Error('Docker not available');
            }
            
            // Pull image
            this.logger.info('Downloading image...');
            const pullResult = await this.exec.run(`docker pull "${image}"`);
            if (!pullResult.success) {
                throw new Error(`Failed to pull image: ${pullResult.stderr}`);
            }
            
            // Save image to cache
            this.logger.info('Saving to cache...');
            const saveResult = await this.exec.run(`docker save "${image}" -o "${filepath}"`);
            if (!saveResult.success) {
                // Clean up partial file
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
                throw new Error(`Failed to save image: ${saveResult.stderr}`);
            }
            
            // Verify file was created and get size
            if (fs.existsSync(filepath)) {
                const stats = fs.statSync(filepath);
                const sizeStr = this.formatFileSize(stats.size);
                this.logger.success(`Cached: ${filename} (${sizeStr})`);
                return true;
            } else {
                throw new Error('Image file was not created');
            }
            
        } catch (error) {
            this.logger.error(`Failed to cache ${image}: ${error.message}`);
            return false;
        }
    }

    /**
     * Load a cached image into Docker and k0s containerd
     */
    async loadImage(image) {
        const filename = this.getImageFilename(image);
        const filepath = this.getImageFilePath(image);
        
        this.logger.step(`Loading: ${image}`);
        
        try {
            // Check if cache file exists
            if (!fs.existsSync(filepath)) {
                throw new Error(`Cache file not found: ${filename}`);
            }
            
            // Check Docker availability
            if (!await this.docker.isAvailable()) {
                throw new Error('Docker not available');
            }
            
            // Load image into Docker
            this.logger.info('Loading into Docker...');
            const loadResult = await this.exec.run(`docker load -i "${filepath}"`);
            if (!loadResult.success) {
                throw new Error(`Failed to load image: ${loadResult.stderr}`);
            }
            
            // Import image into k0s containerd (if k0s container exists)
            const containerCheck = await this.exec.run('docker exec infometis /usr/local/bin/k0s ctr version', {}, true);
            if (containerCheck.success) {
                this.logger.info('Importing into k0s containerd...');
                const importResult = await this.exec.run(`docker save "${image}" | docker exec -i infometis /usr/local/bin/k0s ctr images import -`);
                if (!importResult.success) {
                    this.logger.warn(`Failed to import into k0s containerd: ${importResult.stderr}`);
                    this.logger.info('Image loaded into Docker only');
                }
            } else {
                this.logger.info('k0s container not running - loaded into Docker only');
            }
            
            this.logger.success(`Loaded: ${image}`);
            return true;
            
        } catch (error) {
            this.logger.error(`Failed to load ${image}: ${error.message}`);
            return false;
        }
    }

    /**
     * Format file size in human readable format
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)}${units[unitIndex]}`;
    }

    /**
     * Show cache status for all images
     */
    async showCacheStatus() {
        this.logger.newline();
        this.logger.header('Cache Status');
        
        try {
            // Check if cache directory exists
            if (!fs.existsSync(this.cacheDir)) {
                this.logger.error('Cache directory does not exist');
                return false;
            }
            
            let totalSize = 0;
            let cachedCount = 0;
            
            this.logger.newline();
            
            for (const image of this.images) {
                const filename = this.getImageFilename(image);
                const filepath = this.getImageFilePath(image);
                
                if (fs.existsSync(filepath)) {
                    const stats = fs.statSync(filepath);
                    const sizeStr = this.formatFileSize(stats.size);
                    this.logger.success(`${image} (${sizeStr})`);
                    totalSize += stats.size;
                    cachedCount++;
                } else {
                    this.logger.error(`${image} (not cached)`);
                }
            }
            
            this.logger.newline();
            this.logger.config('Summary', {
                'Cached': `${cachedCount}/${this.images.length} images`,
                'Total size': totalSize > 0 ? this.formatFileSize(totalSize) : 'N/A'
            });
            
            return true;
            
        } catch (error) {
            this.logger.error(`Failed to show cache status: ${error.message}`);
            return false;
        }
    }

    /**
     * Cache all images for offline deployment
     */
    async cacheImages() {
        try {
            if (!await this.initialize()) {
                return false;
            }
            
            this.logger.step('Starting image caching process...');
            this.logger.info('This requires internet connectivity');
            this.logger.newline();
            
            if (!await this.createCacheDir()) {
                return false;
            }
            
            let successCount = 0;
            const totalCount = this.images.length;
            
            for (const image of this.images) {
                if (await this.cacheImage(image)) {
                    successCount++;
                }
                this.logger.newline();
            }
            
            this.logger.newline();
            this.logger.config('Caching Results', {
                'Successful': `${successCount}/${totalCount} images`
            });
            
            if (successCount === totalCount) {
                this.logger.newline();
                this.logger.success('All images cached successfully!');
                this.logger.info('Ready for offline deployment');
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('Some images failed to cache');
                this.logger.info('Offline deployment may not work properly');
                return false;
            }
            
        } catch (error) {
            this.logger.error(`Caching failed: ${error.message}`);
            return false;
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Load all cached images into Docker
     */
    async loadCachedImages() {
        try {
            if (!await this.initialize()) {
                return false;
            }
            
            this.logger.step('Loading cached images into Docker...');
            this.logger.newline();
            
            // Check if cache directory exists
            if (!fs.existsSync(this.cacheDir)) {
                this.logger.error(`Cache directory not found: ${this.cacheDir}`);
                this.logger.info('Run \'cache\' operation first');
                return false;
            }
            
            let successCount = 0;
            const totalCount = this.images.length;
            
            for (const image of this.images) {
                if (await this.loadImage(image)) {
                    successCount++;
                }
                this.logger.newline();
            }
            
            this.logger.newline();
            this.logger.config('Loading Results', {
                'Successful': `${successCount}/${totalCount} images`
            });
            
            if (successCount === totalCount) {
                this.logger.newline();
                this.logger.success('All cached images loaded successfully!');
                return true;
            } else {
                this.logger.newline();
                this.logger.warn('Some images failed to load');
                return false;
            }
            
        } catch (error) {
            this.logger.error(`Loading failed: ${error.message}`);
            return false;
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Show cache status
     */
    async status() {
        try {
            if (!await this.initialize()) {
                return false;
            }
            
            return await this.showCacheStatus();
            
        } catch (error) {
            this.logger.error(`Status check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean up temporary resources
     */
    async cleanup() {
        try {
            if (this.tempDir && fs.existsSync(this.tempDir)) {
                fs.rmSync(this.tempDir, { recursive: true, force: true });
            }
        } catch (error) {
            this.logger.warn(`Cleanup warning: ${error.message}`);
        }
    }

    /**
     * Show usage information
     */
    showUsage() {
        this.logger.newline();
        this.logger.info('Usage: node cache-images.js {cache|load|status}');
        this.logger.newline();
        this.logger.info('Commands:');
        this.logger.info('  cache   - Download and cache images for offline use');
        this.logger.info('  load    - Load cached images into Docker');
        this.logger.info('  status  - Show current cache status');
        this.logger.newline();
    }
}

// Export for use as module
module.exports = CacheManager;

// Allow direct execution
if (require.main === module) {
    const cacheManager = new CacheManager();
    
    // Handle process signals for cleanup
    process.on('SIGINT', async () => {
        console.log('\n\nReceived SIGINT. Cleaning up...');
        await cacheManager.cleanup();
        process.exit(0);
    });
    
    process.on('uncaughtException', async (error) => {
        console.error('Uncaught Exception:', error);
        await cacheManager.cleanup();
        process.exit(1);
    });
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    // Execute based on command
    switch (command) {
        case 'cache':
            cacheManager.cacheImages().then(success => {
                process.exit(success ? 0 : 1);
            }).catch(error => {
                console.error('Fatal error:', error);
                process.exit(1);
            });
            break;
            
        case 'load':
            cacheManager.loadCachedImages().then(success => {
                process.exit(success ? 0 : 1);
            }).catch(error => {
                console.error('Fatal error:', error);
                process.exit(1);
            });
            break;
            
        case 'status':
            cacheManager.status().then(success => {
                process.exit(success ? 0 : 1);
            }).catch(error => {
                console.error('Fatal error:', error);
                process.exit(1);
            });
            break;
            
        default:
            cacheManager.showUsage();
            cacheManager.status().then(() => {
                process.exit(0);
            }).catch(() => {
                process.exit(1);
            });
            break;
    }
}