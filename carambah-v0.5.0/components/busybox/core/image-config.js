// Busybox Component Configuration
// Used as init container for permission fixes and utility operations

module.exports = {
    component: 'busybox',
    version: '1.35',
    description: 'Lightweight Linux toolkit for init containers and debugging',
    
    image: {
        name: 'busybox',
        tag: '1.35',
        fullName: 'busybox:1.35',
        pullPolicy: 'Never', // Use cached image
        size: '4.5MB',
        cached: true
    },
    
    // Common init container patterns
    initContainerPatterns: {
        permissionFix: {
            name: 'fix-permissions',
            command: ['sh', '-c', 'chown -R ${TARGET_UID}:${TARGET_GID} ${TARGET_PATH}'],
            securityContext: {
                runAsUser: 0
            },
            description: 'Fix directory permissions for main container'
        },
        
        directorySetup: {
            name: 'setup-directories',
            command: ['sh', '-c', 'mkdir -p ${DIRECTORIES} && chown -R ${TARGET_UID}:${TARGET_GID} ${BASE_PATH}'],
            securityContext: {
                runAsUser: 0
            },
            description: 'Create directories and set permissions'
        },
        
        dataInit: {
            name: 'data-init',
            command: ['sh', '-c', 'mkdir -p ${DATA_PATH} && chmod -R 755 ${DATA_PATH}'],
            securityContext: {
                runAsUser: 0
            },
            description: 'Initialize data directories with proper permissions'
        }
    },
    
    // Debug utilities
    debugUtils: {
        interactive: {
            command: ['sh'],
            description: 'Interactive shell for debugging'
        },
        
        networkTest: {
            command: ['sh', '-c', 'ping -c 3 ${TARGET_HOST} && nslookup ${TARGET_HOST}'],
            description: 'Network connectivity testing'
        },
        
        volumeInspect: {
            command: ['sh', '-c', 'ls -la ${MOUNT_PATH} && df -h ${MOUNT_PATH}'],
            description: 'Volume inspection and space check'
        }
    },
    
    // Common volume mount patterns
    volumeMounts: {
        dataDirectory: {
            name: 'data-volume',
            mountPath: '/data',
            description: 'Data directory mount'
        },
        
        configDirectory: {
            name: 'config-volume', 
            mountPath: '/config',
            description: 'Configuration directory mount'
        },
        
        logDirectory: {
            name: 'log-volume',
            mountPath: '/logs',
            description: 'Log directory mount'
        }
    },
    
    // Security contexts
    securityContexts: {
        root: {
            runAsUser: 0,
            description: 'Root user for permission operations'
        },
        
        nonRoot: {
            runAsUser: 1000,
            runAsGroup: 1000,
            description: 'Non-root user for safe operations'
        }
    },
    
    // Usage examples
    usageExamples: [
        {
            name: 'Kafka Init Container',
            purpose: 'Create Kafka data directory with correct permissions',
            command: "mkdir -p /var/lib/kafka/data && chown -R 1000:1000 /var/lib/kafka",
            targetUser: '1000:1000'
        },
        {
            name: 'Elasticsearch Init Container', 
            purpose: 'Fix Elasticsearch data directory permissions',
            command: "chown -R 1000:1000 /usr/share/elasticsearch/data",
            targetUser: '1000:1000'
        },
        {
            name: 'Prometheus Init Container',
            purpose: 'Fix Prometheus data directory permissions',
            command: "chown -R 65534:65534 /prometheus",
            targetUser: '65534:65534'
        }
    ]
};