/**
 * InfoMetis v0.3.0 - Logging Utility
 * Provides consistent logging and output formatting across all modules
 */

class Logger {
    constructor(moduleName = 'InfoMetis') {
        this.moduleName = moduleName;
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m'
        };
    }

    /**
     * Format message with emoji and color
     */
    format(emoji, color, message) {
        const timestamp = new Date().toISOString().substr(11, 8);
        const colorCode = this.colors[color] || '';
        const reset = this.colors.reset;
        return `${colorCode}${emoji} ${message}${reset}`;
    }

    /**
     * Header for major sections
     */
    header(title, subtitle = '') {
        console.log('');
        console.log(this.format('🎯', 'bright', title));
        console.log('='.repeat(title.length + 2));
        if (subtitle) {
            console.log(subtitle);
        }
        console.log('');
    }

    /**
     * Success messages
     */
    success(message) {
        console.log(this.format('✅', 'green', message));
    }

    /**
     * Error messages
     */
    error(message) {
        console.log(this.format('❌', 'red', message));
    }

    /**
     * Warning messages
     */
    warn(message) {
        console.log(this.format('⚠️ ', 'yellow', message));
    }

    /**
     * Info messages
     */
    info(message) {
        console.log(this.format('ℹ️ ', 'blue', message));
    }

    /**
     * Progress messages
     */
    progress(message) {
        console.log(this.format('⏳', 'cyan', message));
    }

    /**
     * Step messages
     */
    step(message) {
        console.log(this.format('📋', 'magenta', message));
    }

    /**
     * Configuration display
     */
    config(title, items) {
        console.log(this.format('📋', 'blue', `${title}:`));
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