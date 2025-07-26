/**
 * ksqlDB CLI Component Configuration
 * Configuration for ksqlDB CLI client deployment and usage
 */

module.exports = {
    // Container image configuration
    image: {
        name: 'confluentinc/ksqldb-cli',
        tag: '0.29.0',
        pullPolicy: 'Never'
    },

    // Kubernetes deployment configuration
    deployment: {
        name: 'ksqldb-cli',
        namespace: 'infometis',
        replicas: 1,
        labels: {
            app: 'ksqldb-cli',
            component: 'ksqldb-cli'
        }
    },

    // Service configuration
    service: {
        name: 'ksqldb-cli-service',
        type: 'ClusterIP',
        port: 8088
    },

    // Resource limits
    resources: {
        limits: {
            cpu: '500m',
            memory: '512Mi'
        },
        requests: {
            cpu: '100m',
            memory: '128Mi'
        }
    },

    // ksqlDB server connection
    server: {
        url: 'http://ksqldb-server-service:8088',
        timeout: 30000
    },

    // CLI connection examples
    examples: {
        // Basic connection to ksqlDB server
        connect: 'kubectl exec -it -n infometis deployment/ksqldb-cli -- ksql http://ksqldb-server-service:8088',
        
        // Common ksqlDB CLI commands
        commands: [
            'SHOW STREAMS;',
            'SHOW TABLES;',
            'SHOW TOPICS;',
            'DESCRIBE STREAM stream_name;',
            'SELECT * FROM stream_name EMIT CHANGES;'
        ],

        // Stream creation examples
        streams: [
            'CREATE STREAM users (id INT, name STRING) WITH (kafka_topic=\'users\', value_format=\'JSON\');',
            'CREATE TABLE user_stats AS SELECT id, COUNT(*) as activity_count FROM users GROUP BY id;'
        ]
    },

    // Health check configuration
    health: {
        enabled: true,
        path: '/info',
        port: 8088,
        initialDelaySeconds: 30,
        periodSeconds: 10
    }
};