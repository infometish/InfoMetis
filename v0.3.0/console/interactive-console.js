/**
 * InfoMetis v0.3.0 - Interactive Console
 * Menu-driven console interface for JavaScript deployment functions
 */

const readline = require('readline');
const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');

// Import deployment modules
const ConsoleCore = require('./console-core');
const K0sClusterDeployment = require('../implementation/deploy-k0s-cluster');
const TraefikDeployment = require('../implementation/deploy-traefik');
const NiFiDeployment = require('../implementation/deploy-nifi');
const RegistryDeployment = require('../implementation/deploy-registry');

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
                    
                case 'deployNiFi':
                    result = await this.nifi.deploy();
                    break;
                    
                case 'deployRegistry':
                    result = await this.registry.deploy();
                    break;
                    
                case 'cleanup':
                    result = await this.k0s.cleanup();
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
            
            return result;
        } catch (error) {
            this.logger.error(`Error executing ${functionName}: ${error.message}`);
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