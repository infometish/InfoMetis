const fs = require('fs');
const path = require('path');

class KafkaComponent {
    constructor(environment = 'auto', config = {}) {
        this.environment = environment;
        this.config = config;
        this.spec = this.loadComponentSpec();
        
        if (this.environment === 'auto') {
            this.environment = this.detectEnvironment();
        }
    }
    
    loadComponentSpec() {
        const specPath = path.join(__dirname, '..', 'component-spec.json');
        return JSON.parse(fs.readFileSync(specPath, 'utf8'));
    }
    
    async detectEnvironment() {
        const KubernetesDeployer = require('../environments/kubernetes/deploy-k8s.js');
        const DockerComposeDeployer = require('../environments/docker-compose/deploy-compose.js');
        
        // Check for Kubernetes
        try {
            const kubectl = new (require('../lib/kubectl/kubectl.js'))();
            await kubectl.version();
            return 'kubernetes';
        } catch (e) {
            // Kubernetes not available
        }
        
        // Check for Docker Compose
        try {
            const { exec } = require('../lib/exec.js');
            await exec('docker-compose --version');
            return 'docker-compose';
        } catch (e) {
            // Docker Compose not available
        }
        
        // Default to standalone
        return 'standalone';
    }
    
    async deploy(environmentConfig = {}) {
        const deployer = this.getEnvironmentDeployer();
        const mergedConfig = { ...this.config, ...environmentConfig };
        
        console.log(`🚀 Deploying Kafka component to ${this.environment} environment...`);
        return await deployer.deploy(mergedConfig);
    }
    
    async validate() {
        const deployer = this.getEnvironmentDeployer();
        return await deployer.validate();
    }
    
    async getStatus() {
        const deployer = this.getEnvironmentDeployer();
        return await deployer.getStatus();
    }
    
    async cleanup() {
        const deployer = this.getEnvironmentDeployer();
        return await deployer.cleanup();
    }
    
    getEnvironmentDeployer() {
        switch(this.environment) {
            case 'kubernetes':
                const KubernetesDeployer = require('../environments/kubernetes/deploy-k8s.js');
                return new KubernetesDeployer(this.spec, this.config);
            case 'docker-compose':
                const DockerComposeDeployer = require('../environments/docker-compose/deploy-compose.js');
                return new DockerComposeDeployer(this.spec, this.config);
            case 'standalone':
                const StandaloneDeployer = require('../environments/standalone/deploy-standalone.js');
                return new StandaloneDeployer(this.spec, this.config);
            default:
                throw new Error(`Unsupported environment: ${this.environment}`);
        }
    }
    
    getComponentInfo() {
        return {
            name: this.spec.component.name,
            version: this.spec.component.version,
            environment: this.environment,
            status: 'initialized'
        };
    }
}

module.exports = KafkaComponent;