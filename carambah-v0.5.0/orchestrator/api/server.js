/**
 * Orchestrator REST API Server
 * Provides HTTP interface for component management
 */

const http = require('http');
const url = require('url');
const ComponentManager = require('./component-manager');
const Logger = require('../lib/logger');

class OrchestratorServer {
    constructor(port = 3000) {
        this.port = port;
        this.logger = new Logger('Orchestrator API');
        this.componentManager = new ComponentManager();
        this.server = null;
    }

    /**
     * Handle HTTP requests
     */
    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        const method = req.method;

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight OPTIONS requests
        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        try {
            // Routes
            if (path === '/health' && method === 'GET') {
                await this.handleHealth(req, res);
            } else if (path === '/components' && method === 'GET') {
                await this.handleGetComponents(req, res);
            } else if (path.startsWith('/components/') && method === 'POST') {
                await this.handleDeployComponent(req, res, parsedUrl);
            } else if (path.startsWith('/components/') && method === 'DELETE') {
                await this.handleRemoveComponent(req, res, parsedUrl);
            } else if (path.startsWith('/components/') && path.endsWith('/status') && method === 'GET') {
                await this.handleComponentStatus(req, res, parsedUrl);
            } else if (path === '/stacks' && method === 'GET') {
                await this.handleGetStacks(req, res);
            } else if (path.startsWith('/stacks/') && method === 'POST') {
                await this.handleDeployStack(req, res, parsedUrl);
            } else if (path.startsWith('/stacks/') && method === 'DELETE') {
                await this.handleRemoveStack(req, res, parsedUrl);
            } else if (path === '/cache/images' && method === 'POST') {
                await this.handleCacheImages(req, res);
            } else if (path === '/cache/images' && method === 'PUT') {
                await this.handleLoadImages(req, res);
            } else {
                await this.handle404(req, res);
            }
        } catch (error) {
            this.logger.error(`Request handling error: ${error.message}`);
            await this.handleError(req, res, error);
        }
    }

    /**
     * Health check endpoint
     */
    async handleHealth(req, res) {
        const response = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '0.5.0'
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Get available components
     */
    async handleGetComponents(req, res) {
        const components = this.componentManager.getAvailableComponents();
        const response = {
            components: components.map(name => ({
                name,
                endpoints: {
                    deploy: `/components/${name}`,
                    remove: `/components/${name}`,
                    status: `/components/${name}/status`
                }
            }))
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Deploy a component
     */
    async handleDeployComponent(req, res, parsedUrl) {
        const pathParts = parsedUrl.pathname.split('/');
        const componentName = pathParts[2];

        this.logger.info(`API request to deploy component: ${componentName}`);
        
        const result = await this.componentManager.deployComponent(componentName);
        
        const response = {
            component: componentName,
            action: 'deploy',
            success: result,
            timestamp: new Date().toISOString()
        };

        const statusCode = result ? 200 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Remove a component
     */
    async handleRemoveComponent(req, res, parsedUrl) {
        const pathParts = parsedUrl.pathname.split('/');
        const componentName = pathParts[2];

        this.logger.info(`API request to remove component: ${componentName}`);
        
        const result = await this.componentManager.removeComponent(componentName);
        
        const response = {
            component: componentName,
            action: 'remove',
            success: result,
            timestamp: new Date().toISOString()
        };

        const statusCode = result ? 200 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Get component status
     */
    async handleComponentStatus(req, res, parsedUrl) {
        const pathParts = parsedUrl.pathname.split('/');
        const componentName = pathParts[2];

        const status = await this.componentManager.getComponentStatus(componentName);
        
        const response = {
            component: componentName,
            status,
            timestamp: new Date().toISOString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Get available stack configurations
     */
    async handleGetStacks(req, res) {
        const stacks = this.componentManager.getStackConfigurations();
        const response = {
            stacks: Object.keys(stacks).map(name => ({
                name,
                components: stacks[name],
                endpoints: {
                    deploy: `/stacks/${name}`,
                    remove: `/stacks/${name}`
                }
            }))
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Deploy a stack
     */
    async handleDeployStack(req, res, parsedUrl) {
        const pathParts = parsedUrl.pathname.split('/');
        const stackName = pathParts[2];

        this.logger.info(`API request to deploy stack: ${stackName}`);
        
        const result = await this.componentManager.deployPredefinedStack(stackName);
        
        const response = {
            stack: stackName,
            action: 'deploy',
            success: result,
            timestamp: new Date().toISOString()
        };

        const statusCode = result ? 200 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Remove a stack
     */
    async handleRemoveStack(req, res, parsedUrl) {
        const pathParts = parsedUrl.pathname.split('/');
        const stackName = pathParts[2];

        this.logger.info(`API request to remove stack: ${stackName}`);
        
        const result = await this.componentManager.removePredefinedStack(stackName);
        
        const response = {
            stack: stackName,
            action: 'remove',
            success: result,
            timestamp: new Date().toISOString()
        };

        const statusCode = result ? 200 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Cache images
     */
    async handleCacheImages(req, res) {
        this.logger.info('API request to cache images');
        
        const result = await this.componentManager.cacheImages();
        
        const response = {
            action: 'cache_images',
            success: result,
            timestamp: new Date().toISOString()
        };

        const statusCode = result ? 200 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Load cached images
     */
    async handleLoadImages(req, res) {
        this.logger.info('API request to load cached images');
        
        const result = await this.componentManager.loadCachedImages();
        
        const response = {
            action: 'load_images',
            success: result,
            timestamp: new Date().toISOString()
        };

        const statusCode = result ? 200 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Handle 404 errors
     */
    async handle404(req, res) {
        const response = {
            error: 'Not Found',
            message: `Endpoint ${req.url} not found`,
            availableEndpoints: [
                'GET /health',
                'GET /components',
                'POST /components/{name}',
                'DELETE /components/{name}',
                'GET /components/{name}/status',
                'GET /stacks',
                'POST /stacks/{name}',
                'DELETE /stacks/{name}',
                'POST /cache/images',
                'PUT /cache/images'
            ]
        };

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Handle errors
     */
    async handleError(req, res, error) {
        const response = {
            error: 'Internal Server Error',
            message: error.message,
            timestamp: new Date().toISOString()
        };

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
    }

    /**
     * Start the server
     */
    async start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    this.logger.error(`Failed to start server: ${error.message}`);
                    reject(error);
                } else {
                    this.logger.success(`Orchestrator API server started on port ${this.port}`);
                    this.logger.info(`API documentation available at http://localhost:${this.port}/health`);
                    resolve();
                }
            });
        });
    }

    /**
     * Stop the server
     */
    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    this.logger.info('Orchestrator API server stopped');
                    resolve();
                });
            });
        }
    }
}

module.exports = OrchestratorServer;

// Allow direct execution
if (require.main === module) {
    const server = new OrchestratorServer(process.env.PORT || 3000);
    
    // Handle process signals
    process.on('SIGINT', async () => {
        console.log('\nReceived interrupt signal. Shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });

    server.start().catch(error => {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    });
}