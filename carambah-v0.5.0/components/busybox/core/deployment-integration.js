// Busybox Deployment Integration
// Utilities for integrating busybox init containers into deployments

const path = require('path');
const fs = require('fs');

class BusyboxIntegration {
    constructor(imageConfig, logger) {
        this.imageConfig = imageConfig;
        this.logger = logger;
        this.busyboxImage = this.getBusyboxImage();
    }
    
    /**
     * Get the busybox image reference from image config
     */
    getBusyboxImage() {
        if (this.imageConfig && this.imageConfig.images) {
            return this.imageConfig.images.find(img => img.includes('busybox')) || 'busybox:1.35';
        }
        return 'busybox:1.35';
    }
    
    /**
     * Generate init container for permission fixes
     */
    generatePermissionInitContainer(name, targetPath, targetUid = '1000', targetGid = '1000') {
        return {
            name: name,
            image: this.busyboxImage,
            imagePullPolicy: 'Never',
            command: ['sh', '-c', `chown -R ${targetUid}:${targetGid} ${targetPath}`],
            volumeMounts: [{
                name: `${name.replace(/-/g, '_')}_volume`,
                mountPath: targetPath
            }],
            securityContext: {
                runAsUser: 0
            }
        };
    }
    
    /**
     * Generate init container for directory setup
     */
    generateDirectorySetupInitContainer(name, basePath, directories, targetUid = '1000', targetGid = '1000') {
        const directoriesStr = directories.map(dir => `${basePath}/${dir}`).join(' ');
        
        return {
            name: name,
            image: this.busyboxImage,
            imagePullPolicy: 'Never',
            command: ['sh', '-c', `mkdir -p ${directoriesStr} && chown -R ${targetUid}:${targetGid} ${basePath}`],
            volumeMounts: [{
                name: `${name.replace(/-/g, '_')}_volume`,
                mountPath: basePath
            }],
            securityContext: {
                runAsUser: 0
            }
        };
    }
    
    /**
     * Replace busybox image references in manifest content
     */
    replaceImageReferences(manifestContent) {
        return manifestContent.replace(/image: busybox:1\.35/g, `image: ${this.busyboxImage}`);
    }
    
    /**
     * Check if busybox image is available in containerd
     */
    async isImageAvailable(docker) {
        try {
            const images = await docker.listImages();
            return images.some(image => 
                image.RepoTags && 
                image.RepoTags.some(tag => tag.includes('busybox:1.35'))
            );
        } catch (error) {
            this.logger?.warning(`Could not check image availability: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Get common init container patterns
     */
    getInitContainerPatterns() {
        return {
            kafka: {
                name: 'kafka-init',
                purpose: 'Create Kafka data directory and set permissions',
                command: ['sh', '-c', 'mkdir -p /var/lib/kafka/data && chown -R 1000:1000 /var/lib/kafka'],
                volumeMount: '/var/lib/kafka',
                targetUser: '1000:1000'
            },
            
            elasticsearch: {
                name: 'fix-permissions',
                purpose: 'Fix Elasticsearch data directory permissions',
                command: ['sh', '-c', 'chown -R 1000:1000 /usr/share/elasticsearch/data'],
                volumeMount: '/usr/share/elasticsearch/data',
                targetUser: '1000:1000'
            },
            
            prometheus: {
                name: 'prometheus-data-permission-fix',
                purpose: 'Fix Prometheus data directory permissions',
                command: ['chown', '-R', '65534:65534', '/prometheus'],
                volumeMount: '/prometheus/',
                targetUser: '65534:65534'
            },
            
            grafana: {
                name: 'grafana-init',
                purpose: 'Setup Grafana data directory permissions',
                command: ['sh', '-c', 'chown -R 472:472 /var/lib/grafana'],
                volumeMount: '/var/lib/grafana',
                targetUser: '472:472'
            },
            
            nifiRegistry: {
                name: 'nifi-registry-init',
                purpose: 'Setup NiFi Registry data permissions',
                command: ['sh', '-c', 'chown -R 1000:1000 /opt/nifi-registry/nifi-registry-current/database'],
                volumeMount: '/opt/nifi-registry/nifi-registry-current/database',
                targetUser: '1000:1000'
            }
        };
    }
    
    /**
     * Generate debug pod for troubleshooting
     */
    generateDebugPodManifest(namespace = 'default', podName = 'busybox-debug') {
        return `
apiVersion: v1
kind: Pod
metadata:
  name: ${podName}
  namespace: ${namespace}
  labels:
    app: busybox-debug
    component: debugging
spec:
  containers:
  - name: debug
    image: ${this.busyboxImage}
    imagePullPolicy: Never
    command: ['sleep', '3600']
    resources:
      requests:
        cpu: 10m
        memory: 16Mi
      limits:
        cpu: 100m
        memory: 64Mi
  restartPolicy: Never
`;
    }
    
    /**
     * Log busybox integration info
     */
    logIntegrationInfo() {
        if (this.logger) {
            this.logger.info(`Using busybox image: ${this.busyboxImage}`);
            this.logger.info('Busybox will be used for init containers and debugging');
        }
    }
}

module.exports = BusyboxIntegration;