/**
 * InfoMetis v0.4.0 - Efficient Image Cache Management
 * Simplified caching using Docker's built-in image cache
 * No intermediate tar files - direct Docker to containerd transfer
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const DockerUtil = require('../lib/docker/docker');
const ExecUtil = require('../lib/exec');

class CacheManager {
    constructor() {
        this.logger = new Logger('Cache Manager');
        this.config = new ConfigUtil(this.logger);
        this.docker = new DockerUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        this.images = [];
    }

    /**
     * Initialize cache manager with configuration
     */
    async initialize() {
        try {
            this.logger.header('InfoMetis v0.4.0 - Image Cache Management', 'Efficient Docker-based Caching');
            
            // Load image configuration
            const imageConfig = await this.config.loadImageConfig();
            this.images = imageConfig.images;
            
            this.logger.config('Cache Configuration', {
                'Images to manage': this.images.length,
                'Cache method': 'Docker native cache',
                'Storage': 'No intermediate files'
            });
            
            return true;
        } catch (error) {
            this.logger.error(`Failed to initialize: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if image is available in Docker cache
     */
    async isImageCached(image) {
        try {
            const result = await this.exec.run(`docker inspect "${image}"`, {}, true);
            return result.success;
        } catch (error) {
            return false;
        }
    }

    /**
     * Cache (pull) a single Docker image
     */
    async cacheImage(image) {        
        this.logger.step(`Processing: ${image}`);
        
        try {
            // Check if already in Docker cache
            if (await this.isImageCached(image)) {
                this.logger.info(`✓ Already cached in Docker`);
                return true;
            }
            
            // Check Docker availability
            if (!await this.docker.isAvailable()) {
                throw new Error('Docker not available');
            }
            
            // Pull image (no timeout - let large images download fully)
            this.logger.info('⬇️ Downloading from registry...');
            const pullResult = await this.exec.run(`docker pull "${image}"`, { timeout: 0 });
            if (!pullResult.success) {
                throw new Error(`Failed to pull image: ${pullResult.stderr}`);
            }
            
            this.logger.success(`✓ Cached in Docker: ${image}`);
            return true;
            
        } catch (error) {
            this.logger.error(`✗ Failed to cache ${image}: ${error.message}`);
            return false;
        }
    }

    /**
     * Transfer cached image from Docker to k0s containerd
     */
    async transferToContainerd(image) {
        this.logger.step(`Transferring to k0s: ${image}`);
        
        try {
            // Check if k0s container is running
            const containerCheck = await this.exec.run('docker exec infometis /usr/local/bin/k0s ctr version', {}, true);
            if (!containerCheck.success) {
                this.logger.info('ℹ️ k0s container not running - skipping containerd transfer');
                return true;
            }

            // Check if image is in Docker cache
            if (!await this.isImageCached(image)) {
                throw new Error(`Image not in Docker cache: ${image}`);
            }

            // Direct pipe from Docker to k0s containerd
            this.logger.info('📤 Transferring to k0s containerd...');
            const transferResult = await this.exec.run(
                `docker save "${image}" | docker exec -i infometis /usr/local/bin/k0s ctr images import -`,
                { timeout: 0 }
            );
            
            if (!transferResult.success) {
                throw new Error(`Failed to transfer to containerd: ${transferResult.stderr}`);
            }
            
            this.logger.success(`✓ Transferred to k0s containerd: ${image}`);
            return true;
            
        } catch (error) {
            this.logger.error(`✗ Failed to transfer ${image}: ${error.message}`);
            return false;
        }
    }

    /**
     * Cache all configured images
     */
    async cacheImages() {
        if (!await this.initialize()) {
            return false;
        }

        this.logger.step('Starting image caching process...');
        this.logger.info('ℹ️ Using Docker native cache - no intermediate files created');

        let successful = 0;
        let failed = 0;

        for (const image of this.images) {
            if (await this.cacheImage(image)) {
                successful++;
            } else {
                failed++;
            }
        }

        // Show results
        this.logger.newline();
        this.logger.header('Caching Results');
        this.logger.info(`Successful: ${successful}/${this.images.length} images`);
        
        if (failed > 0) {
            this.logger.warn(`Failed: ${failed} images`);
            this.logger.warn('Some images failed to cache');
            return false;
        } else {
            this.logger.success('All images cached successfully');
            return true;
        }
    }

    /**
     * Transfer all cached images to k0s containerd
     */
    async transferAllToContainerd() {
        this.logger.header('Transferring Images to k0s Containerd');

        let successful = 0;
        let failed = 0;

        for (const image of this.images) {
            if (await this.transferToContainerd(image)) {
                successful++;
            } else {
                failed++;
            }
        }

        // Show results
        this.logger.newline();
        this.logger.header('Transfer Results');
        this.logger.info(`Successful: ${successful}/${this.images.length} images`);
        
        if (failed > 0) {
            this.logger.warn(`Failed: ${failed} images`);
            return false;
        } else {
            this.logger.success('All images transferred to k0s containerd');
            return true;
        }
    }

    /**
     * Get safe filename for an image
     */
    getSafeFilename(image) {
        return image.replace(/[\/\:]/g, '_') + '.tar';
    }

    /**
     * Save cached Docker images to tar files
     */
    async saveToTar() {
        if (!await this.initialize()) {
            return false;
        }

        this.logger.header('Saving Docker Images to TAR Files');
        this.logger.info('ℹ️ Note: Images must be cached in Docker first (use option 3: Cache Docker images)');
        this.logger.newline();
        
        // Create cache directory if it doesn't exist
        const cacheDir = '../cache';
        await this.exec.run(`mkdir -p "${cacheDir}"`, {}, true);
        
        let successful = 0;
        let failed = 0;
        let skipped = 0;

        for (const image of this.images) {
            const filename = this.getSafeFilename(image);
            const tarPath = `${cacheDir}/${filename}`;
            
            this.logger.step(`Saving: ${image}`);
            
            try {
                // Check if image is in Docker cache
                if (!await this.isImageCached(image)) {
                    this.logger.warn(`✗ Image not cached in Docker: ${image}`);
                    failed++;
                    continue;
                }

                // Check if tar file already exists
                const tarCheck = await this.exec.run(`ls "${tarPath}"`, {}, true);
                if (tarCheck.success) {
                    this.logger.info(`ℹ️ TAR file already exists: ${filename}`);
                    skipped++;
                    continue;
                }

                // Save image to tar
                this.logger.info(`💾 Saving to: ${filename}`);
                const saveResult = await this.exec.run(`docker save "${image}" -o "${tarPath}"`, { timeout: 0 });
                
                if (!saveResult.success) {
                    throw new Error(`Failed to save image: ${saveResult.stderr}`);
                }
                
                this.logger.success(`✓ Saved: ${filename}`);
                successful++;
                
            } catch (error) {
                this.logger.error(`✗ Failed to save ${image}: ${error.message}`);
                failed++;
            }
        }

        // Show results
        this.logger.newline();
        this.logger.header('Save to TAR Results');
        this.logger.info(`Saved: ${successful} images`);
        this.logger.info(`Skipped: ${skipped} images (already exist)`);
        
        if (failed > 0) {
            this.logger.warn(`Failed: ${failed} images`);
            return false;
        } else {
            this.logger.success('All cached images saved to TAR files');
            return true;
        }
    }

    /**
     * Load images from tar files to Docker cache
     */
    async loadFromTar() {
        if (!await this.initialize()) {
            return false;
        }

        this.logger.header('Loading Images from TAR Files to Docker');
        
        const cacheDir = '../cache';
        
        // Check if cache directory exists
        const cacheDirCheck = await this.exec.run(`ls "${cacheDir}"`, {}, true);
        if (!cacheDirCheck.success) {
            this.logger.error(`Cache directory not found: ${cacheDir}`);
            return false;
        }
        
        let successful = 0;
        let failed = 0;
        let skipped = 0;

        for (const image of this.images) {
            const filename = this.getSafeFilename(image);
            const tarPath = `${cacheDir}/${filename}`;
            
            this.logger.step(`Loading: ${image}`);
            
            try {
                // Check if image is already in Docker cache
                if (await this.isImageCached(image)) {
                    this.logger.info(`ℹ️ Already cached in Docker`);
                    skipped++;
                    continue;
                }

                // Check if tar file exists
                const tarCheck = await this.exec.run(`ls "${tarPath}"`, {}, true);
                if (!tarCheck.success) {
                    this.logger.warn(`✗ TAR file not found: ${filename}`);
                    failed++;
                    continue;
                }

                // Load image from tar
                this.logger.info(`📦 Loading from: ${filename}`);
                const loadResult = await this.exec.run(`docker load -i "${tarPath}"`, { timeout: 0 });
                
                if (!loadResult.success) {
                    throw new Error(`Failed to load image: ${loadResult.stderr}`);
                }
                
                this.logger.success(`✓ Loaded: ${image}`);
                successful++;
                
            } catch (error) {
                this.logger.error(`✗ Failed to load ${image}: ${error.message}`);
                failed++;
            }
        }

        // Show results
        this.logger.newline();
        this.logger.header('Load from TAR Results');
        this.logger.info(`Loaded: ${successful} images`);
        this.logger.info(`Skipped: ${skipped} images (already cached)`);
        
        if (failed > 0) {
            this.logger.warn(`Failed: ${failed} images`);
            return false;
        } else {
            this.logger.success('All images loaded from TAR files to Docker');
            return true;
        }
    }

    /**
     * Show cache status
     */
    async showCacheStatus() {
        if (!await this.initialize()) {
            return false;
        }

        this.logger.header('Docker Cache Status');

        for (const image of this.images) {
            const cached = await this.isImageCached(image);
            if (cached) {
                this.logger.success(`✓ ${image}`);
            } else {
                this.logger.warn(`✗ ${image} (not cached)`);
            }
        }

        return true;
    }

    /**
     * Clean Docker cache - remove all InfoMetis images
     */
    async cleanCache() {
        if (!await this.initialize()) {
            return false;
        }

        this.logger.header('Cleaning Docker Image Cache');
        this.logger.info('🧹 Removing InfoMetis images from Docker cache...');

        let successful = 0;
        let failed = 0;
        let skipped = 0;

        for (const image of this.images) {
            this.logger.step(`Checking: ${image}`);
            
            try {
                // Check if image exists
                if (!await this.isImageCached(image)) {
                    this.logger.info(`ℹ️ Not cached - skipping`);
                    skipped++;
                    continue;
                }

                // Remove image
                this.logger.info('🗑️ Removing from Docker cache...');
                const removeResult = await this.exec.run(`docker rmi "${image}"`, {}, true);
                
                if (removeResult.success) {
                    this.logger.success(`✓ Removed: ${image}`);
                    successful++;
                } else {
                    // Try force removal if regular removal fails
                    this.logger.info('🔨 Attempting force removal...');
                    const forceResult = await this.exec.run(`docker rmi -f "${image}"`, {}, true);
                    
                    if (forceResult.success) {
                        this.logger.success(`✓ Force removed: ${image}`);
                        successful++;
                    } else {
                        this.logger.warn(`⚠️ Could not remove: ${image} (may be in use)`);
                        failed++;
                    }
                }
                
            } catch (error) {
                this.logger.error(`✗ Failed to remove ${image}: ${error.message}`);
                failed++;
            }
        }

        // Show results
        this.logger.newline();
        this.logger.header('Cleanup Results');
        this.logger.info(`Removed: ${successful} images`);
        this.logger.info(`Skipped: ${skipped} images (not cached)`);
        
        if (failed > 0) {
            this.logger.warn(`Failed: ${failed} images (may be in use by containers)`);
            this.logger.info('💡 Tip: Stop containers using these images and try again');
        }
        
        if (successful > 0) {
            this.logger.success('Docker cache cleanup completed');
            return true;
        } else {
            this.logger.info('No images were removed');
            return true;
        }
    }
}

// Export for use in other modules
module.exports = CacheManager;

// CLI usage
if (require.main === module) {
    const cacheManager = new CacheManager();
    
    const command = process.argv[2] || 'cache';
    
    switch (command) {
        case 'cache':
            cacheManager.cacheImages().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        case 'transfer':
            cacheManager.transferAllToContainerd().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        case 'status':
            cacheManager.showCacheStatus().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        case 'clean':
            cacheManager.cleanCache().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        case 'save':
            cacheManager.saveToTar().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        case 'load':
            cacheManager.loadFromTar().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        default:
            console.log('Usage: node cache-images.js [cache|transfer|status|clean|save|load]');
            console.log('  cache    - Download and cache images in Docker');
            console.log('  transfer - Transfer cached images to k0s containerd');
            console.log('  status   - Show cache status');
            console.log('  clean    - Remove cached images from Docker');
            console.log('  save     - Save cached Docker images to TAR files');
            console.log('  load     - Load images from TAR files to Docker cache');
            process.exit(1);
    }
}