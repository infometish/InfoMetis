#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class V040ToComponentsMigration {
    constructor() {
        this.v040Path = path.join(__dirname, '../../v0.4.0');
        this.componentsPath = path.join(__dirname, '../components');
        this.orchestratorPath = path.join(__dirname, '../orchestrator');
    }
    
    async migrate() {
        console.log('🔄 Starting v0.4.0 to Components migration...');
        
        try {
            // Verify source exists
            if (!fs.existsSync(this.v040Path)) {
                throw new Error(`v0.4.0 directory not found at: ${this.v040Path}`);
            }
            
            // Create components structure
            await this.createComponentsStructure();
            
            // Migrate individual components
            await this.migrateKafka();
            await this.migrateElasticsearch();
            await this.migrateGrafana();
            await this.migrateNifi();
            await this.migrateNifiRegistry();
            await this.migrateTraefik();
            
            // Migrate orchestrator
            await this.migrateOrchestrator();
            
            // Generate component specs
            await this.generateComponentSpecs();
            
            // Create package.json files
            await this.createPackageJsonFiles();
            
            console.log('✅ Migration completed successfully!');
            console.log('\nNext steps:');
            console.log('1. Review generated component specifications');
            console.log('2. Test individual component deployments');
            console.log('3. Update any custom configurations');
            console.log('4. Run component tests');
            
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    }
    
    async createComponentsStructure() {
        const components = ['kafka', 'elasticsearch', 'grafana', 'nifi', 'nifi-registry', 'traefik'];
        
        for (const component of components) {
            const componentPath = path.join(this.componentsPath, component);
            const structure = [
                'core',
                'environments/kubernetes/manifests',
                'environments/docker-compose', 
                'environments/standalone',
                'lib',
                'api',
                'bin',
                'tests'
            ];
            
            for (const dir of structure) {
                const fullPath = path.join(componentPath, dir);
                fs.mkdirSync(fullPath, { recursive: true });
            }
        }
        
        console.log('📁 Created component directory structure');
    }
    
    async migrateKafka() {
        console.log('📦 Migrating Kafka component...');
        
        // Copy manifests
        this.copyFile(
            'config/manifests/kafka-k8s.yaml',
            'components/kafka/environments/kubernetes/manifests/kafka-k8s.yaml'
        );
        
        // Copy deployment script
        this.copyFile(
            'implementation/deploy-kafka.js',
            'components/kafka/environments/kubernetes/deploy-k8s.js'
        );
        
        // Copy utilities
        this.copyDirectory('lib', 'components/kafka/lib');
    }
    
    async migrateElasticsearch() {
        console.log('🔍 Migrating Elasticsearch component...');
        
        this.copyFile(
            'config/manifests/elasticsearch-k8s.yaml',
            'components/elasticsearch/environments/kubernetes/manifests/elasticsearch-k8s.yaml'
        );
        
        this.copyFile(
            'implementation/deploy-elasticsearch.js',
            'components/elasticsearch/environments/kubernetes/deploy-k8s.js'
        );
        
        this.copyDirectory('lib', 'components/elasticsearch/lib');
    }
    
    async migrateGrafana() {
        console.log('📊 Migrating Grafana component...');
        
        this.copyFile(
            'config/manifests/grafana-k8s.yaml',
            'components/grafana/environments/kubernetes/manifests/grafana-k8s.yaml'
        );
        
        this.copyFile(
            'implementation/deploy-grafana.js',
            'components/grafana/environments/kubernetes/deploy-k8s.js'
        );
        
        this.copyDirectory('lib', 'components/grafana/lib');
    }
    
    async migrateNifi() {
        console.log('🌊 Migrating NiFi component...');
        
        // Copy multiple manifests
        const manifests = [
            'nifi-k8s.yaml',
            'nifi-pv.yaml', 
            'nifi-ingress.yaml',
            'local-storage-class.yaml'
        ];
        
        for (const manifest of manifests) {
            this.copyFile(
                `config/manifests/${manifest}`,
                `components/nifi/environments/kubernetes/manifests/${manifest}`
            );
        }
        
        this.copyFile(
            'implementation/deploy-nifi.js',
            'components/nifi/environments/kubernetes/deploy-k8s.js'
        );
        
        this.copyDirectory('lib', 'components/nifi/lib');
    }
    
    async migrateNifiRegistry() {
        console.log('📋 Migrating NiFi Registry component...');
        
        this.copyFile(
            'config/manifests/nifi-registry-k8s.yaml',
            'components/nifi-registry/environments/kubernetes/manifests/nifi-registry-k8s.yaml'
        );
        
        this.copyFile(
            'implementation/deploy-registry.js',
            'components/nifi-registry/environments/kubernetes/deploy-k8s.js'
        );
        
        this.copyDirectory('lib', 'components/nifi-registry/lib');
    }
    
    async migrateTraefik() {
        console.log('🚦 Migrating Traefik component...');
        
        this.copyFile(
            'config/manifests/traefik-deployment.yaml',
            'components/traefik/environments/kubernetes/manifests/traefik-deployment.yaml'
        );
        
        this.copyFile(
            'implementation/deploy-traefik.js',
            'components/traefik/environments/kubernetes/deploy-k8s.js'
        );
        
        this.copyDirectory('lib', 'components/traefik/lib');
    }
    
    async migrateOrchestrator() {
        console.log('🎛️ Migrating Orchestrator...');
        
        // Copy console files
        this.copyDirectory('console', 'orchestrator/console');
        
        // Copy config
        this.copyFile(
            'config/console/console-config.json',
            'orchestrator/console/console-config.json'
        );
        
        // Copy utilities
        this.copyDirectory('lib', 'orchestrator/lib');
        
        // Copy tools
        this.copyFile(
            'implementation/cache-images.js',
            'orchestrator/tools/cache-images.js'
        );
        
        this.copyFile(
            'implementation/deploy-k0s-cluster.js',
            'orchestrator/tools/deploy-k0s-cluster.js'
        );
    }
    
    copyFile(sourcePath, destPath) {
        const fullSourcePath = path.join(this.v040Path, sourcePath);
        const fullDestPath = path.join(__dirname, '..', destPath);
        
        if (fs.existsSync(fullSourcePath)) {
            fs.mkdirSync(path.dirname(fullDestPath), { recursive: true });
            fs.copyFileSync(fullSourcePath, fullDestPath);
        } else {
            console.warn(`⚠️ Source file not found: ${sourcePath}`);
        }
    }
    
    copyDirectory(sourceDir, destDir) {
        const fullSourcePath = path.join(this.v040Path, sourceDir);
        const fullDestPath = path.join(__dirname, '..', destDir);
        
        if (fs.existsSync(fullSourcePath)) {
            this.copyRecursive(fullSourcePath, fullDestPath);
        } else {
            console.warn(`⚠️ Source directory not found: ${sourceDir}`);
        }
    }
    
    copyRecursive(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        
        const items = fs.readdirSync(src);
        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            
            if (fs.statSync(srcPath).isDirectory()) {
                this.copyRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    
    async generateComponentSpecs() {
        console.log('📋 Generating component specifications...');
        
        const components = [
            { name: 'kafka', port: 9092, category: 'streaming' },
            { name: 'elasticsearch', port: 9200, category: 'search' },
            { name: 'grafana', port: 3000, category: 'monitoring' },
            { name: 'nifi', port: 8080, category: 'data-flow' },
            { name: 'nifi-registry', port: 18080, category: 'data-flow' },
            { name: 'traefik', port: 80, category: 'ingress' }
        ];
        
        for (const comp of components) {
            const spec = this.generateComponentSpec(comp);
            const specPath = path.join(__dirname, '..', 'components', comp.name, 'component-spec.json');
            fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
        }
    }
    
    generateComponentSpec(component) {
        return {
            component: {
                name: component.name,
                displayName: this.capitalize(component.name),
                version: "1.0.0",
                description: `InfoMetis ${this.capitalize(component.name)} component`,
                category: component.category,
                provider: "infometis"
            },
            environments: {
                kubernetes: {
                    supported: true,
                    minVersion: "1.20",
                    manifests: "environments/kubernetes/manifests/",
                    deployer: "environments/kubernetes/deploy-k8s.js"
                },
                "docker-compose": {
                    supported: true,
                    compose: "environments/docker-compose/docker-compose.yml",
                    deployer: "environments/docker-compose/deploy-compose.js"
                },
                standalone: {
                    supported: true,
                    dockerfile: "environments/standalone/Dockerfile",
                    deployer: "environments/standalone/deploy-standalone.js"
                }
            },
            networking: {
                ports: [
                    {
                        name: component.name,
                        port: component.port,
                        protocol: "TCP",
                        required: true
                    }
                ]
            }
        };
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    async createPackageJsonFiles() {
        console.log('📦 Creating package.json files...');
        
        const components = ['kafka', 'elasticsearch', 'grafana', 'nifi', 'nifi-registry', 'traefik'];
        
        for (const component of components) {
            const packageJson = {
                name: `@infometis/${component}`,
                version: "1.0.0",
                description: `InfoMetis ${this.capitalize(component)} Component`,
                main: `core/${component}-component.js`,
                bin: {
                    [`infometis-${component}`]: "bin/cli.js"
                },
                keywords: [component, "infometis", "kubernetes", "docker"],
                author: "InfoMetis Team",
                license: "MIT"
            };
            
            const packagePath = path.join(__dirname, '..', 'components', component, 'package.json');
            fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    const migration = new V040ToComponentsMigration();
    migration.migrate().catch(console.error);
}

module.exports = V040ToComponentsMigration;