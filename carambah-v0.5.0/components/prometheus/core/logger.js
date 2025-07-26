/**
 * InfoMetis v0.3.0 - Logging Utility
 * Provides consistent logging matching v0.1.0 and v0.2.0 style (no colors)
 */

class Logger {
    constructor(moduleName = 'InfoMetis') {
        this.moduleName = moduleName;
    }

    /**
     * Header for major sections
     */
    header(title, subtitle = '') {
        console.log('');
        console.log(`🚀 ${title}`);
        console.log('='.repeat(title.length + 3));
        if (subtitle) {
            console.log(subtitle);
        }
        console.log('');
    }

    /**
     * Success messages
     */
    success(message) {
        console.log(`✅ ${message}`);
    }

    /**
     * Error messages
     */
    error(message) {
        console.log(`❌ ${message}`);
    }

    /**
     * Warning messages
     */
    warn(message) {
        console.log(`⚠️  ${message}`);
    }

    /**
     * Info messages
     */
    info(message) {
        console.log(`ℹ️  ${message}`);
    }

    /**
     * Progress messages
     */
    progress(message) {
        console.log(`⏳ ${message}`);
    }

    /**
     * Step messages
     */
    step(message) {
        console.log(`📋 ${message}`);
    }

    /**
     * Configuration display
     */
    config(title, items) {
        console.log(`📋 ${title}:`);
        for (const [key, value] of Object.entries(items)) {
            console.log(`  ${key}: ${value}`);
        }
        console.log('');
    }

    /**
     * Plain console output (for kubectl output, etc.)
     */
    raw(message) {
        console.log(message);
    }

    /**
     * Empty line
     */
    newline() {
        console.log('');
    }
}

module.exports = Logger;