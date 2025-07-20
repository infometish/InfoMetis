/**
 * InfoMetis v0.3.0 - k0s Cluster Deployment
 * JavaScript implementation of k0s cluster setup
 * Creates k0s Kubernetes cluster in Docker container
 */

const Logger = require('../lib/logger');
const ConfigUtil = require('../lib/fs/config');
const DockerUtil = require('../lib/docker/docker');
const KubectlUtil = require('../lib/kubectl/kubectl');
const ExecUtil = require('../lib/exec');
const path = require('path');

class K0sClusterDeployment {
    constructor() {
        this.logger = new Logger('k0s Cluster');
        this.config = new ConfigUtil(this.logger);
        this.docker = new DockerUtil(this.logger);
        this.kubectl = new KubectlUtil(this.logger);
        this.exec = new ExecUtil(this.logger);
        
        this.clusterName = 'infometis';
        this.namespace = 'infometis';
        this.cacheDir = null;
    }

    /**
     * Initialize deployment with configuration loading
     */
    async initialize() {
        try {
            this.logger.header('InfoMetis v0.3.0 - k0s Cluster Deployment', 'JavaScript Native Implementation');
            
            // Set up cache directory path
            this.cacheDir = this.config.resolvePath('cache/images');
            
            this.logger.config('Cluster Configuration', {
                'Cluster Name': this.clusterName,
                'Namespace': this.namespace,
                'Cache Directory': this.cacheDir
            });
            
            return true;
        } catch (error) {
            this.logger.error(`Failed to initialize: ${error.message}`);
            return false;
        }
    }

    /**
     * Check prerequisites for k0s deployment
     */
    async checkPrerequisites() {
        this.logger.step('Checking prerequisites...');
        
        try {
            // Check Docker availability
            if (!await this.docker.isAvailable()) {
                throw new Error('Docker is not available or daemon not running');
            }
            this.logger.success('Docker is available');

            // Check kubectl availability
            if (!await this.exec.commandExists('kubectl')) {
                throw new Error('kubectl is not installed or not in PATH');
            }
            this.logger.success('kubectl is available');

            this.logger.success('Prerequisites check passed');
            return true;
        } catch (error) {
            this.logger.error(`Prerequisites check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Load cached k0s image
     */
    async loadCachedImages() {
        this.logger.step('Loading cached images...');
        
        const k0sImagePath = path.join(this.cacheDir, 'k0sproject-k0s-latest.tar');
        await this.docker.loadImage(k0sImagePath, 'k0s');
        
        // Note: If image loading fails, Docker will pull from registry during container creation
        return true;
    }

    /**
     * Create k0s cluster container
     */
    async createK0sContainer() {
        this.logger.step('Creating k0s cluster container...');
        
        try {
            // Check if container already exists
            if (await this.docker.isContainerRunning(this.clusterName)) {
                this.logger.info('k0s container already running');
                return true;
            }

            if (await this.docker.containerExists(this.clusterName)) {
                this.logger.step('Starting existing k0s container...');
                return await this.docker.startContainer(this.clusterName);
            }

            // Create new k0s container with comprehensive configuration
            const workspaceDir = this.config.resolvePath('.');
            
            const containerOptions = {
                name: this.clusterName,
                image: 'k0sproject/k0s:latest',
                detached: true,
                privileged: true,
                hostname: this.clusterName,
                networkMode: 'host',
                pid: 'host',
                ipc: 'host',
                cgroupns: 'host',
                restartPolicy: 'unless-stopped',
                
                volumes: [
                    '/var/lib/k0s',
                    '/var/lib/containerd',
                    '/var/lib/etcd',
                    '/run/k0s',
                    { source: '/sys/fs/cgroup', target: '/sys/fs/cgroup', options: 'rw' },
                    { source: workspaceDir, target: '/workspace', options: 'rw' }
                ],
                
                ports: [
                    { host: 6443, container: 6443 }, // Kubernetes API
                    { host: 80, container: 80 },     // HTTP
                    { host: 443, container: 443 },   // HTTPS
                    { host: 8080, container: 8080 }  // Traefik Dashboard
                ],
                
                securityOptions: [
                    'apparmor:unconfined',
                    'seccomp:unconfined'
                ],
                
                tmpfs: [
                    '/tmp',
                    '/var/logs',
                    '/var/run',
                    '/var/lib/containerd/io.containerd.grpc.v1.cri/sandboxes',
                    '/var/lib/containerd/io.containerd.runtime.v2.task/k8s.io',
                    '/var/lib/containerd/tmpmounts',
                    '/var/lib/kubelet/pods',
                    '/var/lib/kubelet/plugins',
                    '/var/lib/kubelet/plugins_registry',
                    '/var/lib/k0s/run',
                    '/run/k0s',
                    '/run/containerd',
                    '/run/dockershim.sock',
                    '/var/run/secrets/kubernetes.io/serviceaccount',
                    '/var/lib/calico',
                    '/var/run/calico',
                    '/var/lib/cni',
                    '/var/run/netns',
                    '/var/lib/dockershim',
                    '/var/run/docker.sock',
                    '/var/run/docker',
                    '/var/lib/docker',
                    '/var/lib/containers',
                    '/tmp/k0s'
                ]
            };

            if (!await this.docker.runContainer(containerOptions)) {
                throw new Error('Failed to create k0s container');
            }

            // Wait for container to be running
            if (!await this.docker.waitForContainer(this.clusterName, 30, 2000)) {
                throw new Error('k0s container did not start within timeout');
            }

            this.logger.success('k0s container created and started');
            return true;
        } catch (error) {
            this.logger.error(`Failed to create k0s container: ${error.message}`);
            return false;
        }
    }

    /**
     * Wait for k0s API server to be ready
     */
    async waitForK0sAPI() {
        this.logger.progress('Waiting for k0s API server to be ready...');
        this.logger.info('This may take up to 2 minutes for k0s to initialize...');
        
        try {
            // Wait for k0s process to start inside container
            await this.exec.delay(10000); // 10 second initial delay
            
            // Wait for API server to be responsive
            const apiReady = await this.exec.waitFor(
                async () => {
                    const result = await this.docker.execInContainer(
                        this.clusterName,
                        'k0s kubectl get nodes',
                        false,
                        true
                    );
                    return result.success;
                },
                36, // 36 attempts
                5000, // 5 second intervals = 3 minutes total
                'k0s API server'
            );

            if (apiReady) {
                this.logger.success('k0s API server is ready');
                return true;
            } else {
                this.logger.error('k0s API server not ready within timeout');
                return false;
            }
        } catch (error) {
            this.logger.error(`Failed waiting for k0s API: ${error.message}`);
            return false;
        }
    }

    /**
     * Configure kubectl to access k0s cluster
     */
    async configureKubectl() {
        this.logger.step('Configuring kubectl access...');
        
        try {
            // Copy kubeconfig from k0s container
            const kubeconfigResult = await this.docker.execInContainer(
                this.clusterName,
                'k0s kubeconfig admin',
                false,
                true
            );

            if (!kubeconfigResult.success) {
                throw new Error('Failed to get kubeconfig from k0s');
            }

            // Write kubeconfig to local file
            const os = require('os');
            const fs = require('fs');
            const kubeconfigPath = path.join(os.homedir(), '.kube', 'config');
            const kubeconfigDir = path.dirname(kubeconfigPath);
            
            // Ensure .kube directory exists
            if (!fs.existsSync(kubeconfigDir)) {
                fs.mkdirSync(kubeconfigDir, { recursive: true });
            }

            // Update kubeconfig to use localhost
            let kubeconfig = kubeconfigResult.stdout;
            kubeconfig = kubeconfig.replace(/server: https:\/\/.*:6443/, 'server: https://localhost:6443');
            
            fs.writeFileSync(kubeconfigPath, kubeconfig);
            this.logger.success('kubectl configured for k0s cluster');

            // Test kubectl access
            const testResult = await this.exec.run('kubectl get nodes', {}, true);
            if (testResult.success) {
                this.logger.success('kubectl access confirmed');
                this.logger.raw(testResult.stdout);
                return true;
            } else {
                throw new Error('kubectl access test failed');
            }
        } catch (error) {
            this.logger.error(`Failed to configure kubectl: ${error.message}`);
            return false;
        }
    }

    /**
     * Create infometis namespace
     */
    async createNamespace() {
        this.logger.step('Creating infometis namespace...');
        
        try {
            // Create namespace using kubectl utility
            if (!await this.kubectl.ensureNamespace(this.namespace)) {
                throw new Error('Failed to create namespace');
            }

            this.logger.success('Namespace created');
            return true;
        } catch (error) {
            this.logger.error(`Failed to create namespace: ${error.message}`);
            return false;
        }
    }

    /**
     * Remove master node taint to allow scheduling
     */
    async removeMasterTaint() {
        this.logger.step('Removing master node taint...');
        
        try {
            // Remove control-plane taint to allow pod scheduling on single node
            const result = await this.exec.run(
                'kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true'
            );

            // This command is expected to sometimes fail if taint doesn't exist, so we don't check success
            this.logger.success('Master taint removal attempted');
            return true;
        } catch (error) {
            this.logger.warn(`Taint removal had issues (expected): ${error.message}`);
            return true; // Non-critical failure
        }
    }

    /**
     * Get cluster status information
     */
    async getClusterStatus() {
        this.logger.newline();
        this.logger.header('Cluster Status');
        
        try {
            // Get nodes status
            const nodesResult = await this.exec.run('kubectl get nodes', {}, false);
            this.logger.newline();
            
            // Get cluster info
            const clusterResult = await this.exec.run('kubectl cluster-info', {}, false);
            this.logger.newline();
            
            this.logger.config('Access Points', {
                'Cluster API': 'https://localhost:6443',
                'kubectl': 'kubectl get nodes',
                'Container': `docker exec -it ${this.clusterName} k0s kubectl get nodes`
            });

        } catch (error) {
            this.logger.error(`Failed to get cluster status: ${error.message}`);
        }
    }

    /**
     * Deploy complete k0s cluster workflow
     */
    async deploy() {
        try {
            if (!await this.initialize()) {
                return false;
            }

            // Execute deployment workflow
            const steps = [
                () => this.checkPrerequisites(),
                () => this.loadCachedImages(),
                () => this.createK0sContainer(),
                () => this.waitForK0sAPI(),
                () => this.configureKubectl(),
                () => this.createNamespace(),
                () => this.removeMasterTaint()
            ];

            for (const step of steps) {
                if (!await step()) {
                    this.logger.error('Deployment step failed, aborting');
                    return false;
                }
            }

            // Show final status
            await this.getClusterStatus();
            
            this.logger.newline();
            this.logger.success('k0s Cluster deployment completed successfully!');
            this.logger.newline();
            this.logger.config('Next Steps', {
                'Deploy Traefik': 'node deploy-traefik.js',
                'Deploy NiFi': 'node deploy-nifi.js',
                'Full Foundation': 'node deploy-foundation.js'
            });
            
            return true;

        } catch (error) {
            this.logger.error(`Deployment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean up k0s cluster
     */
    async cleanup() {
        this.logger.header('k0s Cluster Cleanup');
        
        try {
            if (await this.docker.containerExists(this.clusterName)) {
                if (await this.docker.isContainerRunning(this.clusterName)) {
                    await this.docker.stopContainer(this.clusterName);
                }
                await this.docker.removeContainer(this.clusterName, true);
                this.logger.success('k0s container removed');
            } else {
                this.logger.info('No k0s container to remove');
            }

            return true;
        } catch (error) {
            this.logger.error(`Cleanup failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use as module
module.exports = K0sClusterDeployment;

// Allow direct execution
if (require.main === module) {
    const deployment = new K0sClusterDeployment();
    
    // Handle command line arguments
    const args = process.argv.slice(2);
    if (args.includes('cleanup')) {
        deployment.cleanup().then(success => {
            process.exit(success ? 0 : 1);
        });
    } else {
        deployment.deploy().then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}