/**
 * Carambah v0.5.0 - Kafka REST Proxy Configuration
 * Configuration settings for Kafka REST Proxy component
 */

module.exports = {
    // Component metadata
    component: {
        name: 'kafka-rest',
        displayName: 'Kafka REST Proxy',
        version: '7.5.0',
        description: 'Confluent Platform Kafka REST Proxy for HTTP-based Kafka access'
    },

    // Container configuration
    container: {
        image: 'confluentinc/cp-kafka-rest:7.5.0',
        imagePullPolicy: 'Never',
        port: 8082,
        resources: {
            requests: {
                memory: '256Mi',
                cpu: '200m'
            },
            limits: {
                memory: '512Mi',
                cpu: '500m'
            }
        }
    },

    // Kubernetes configuration
    kubernetes: {
        namespace: 'infometis',
        labels: {
            app: 'kafka-rest-proxy',
            component: 'kafka-rest',
            'part-of': 'carambah'
        },
        replicas: 1
    },

    // Service configuration
    service: {
        name: 'kafka-rest-service',
        port: 8082,
        targetPort: 8082,
        type: 'ClusterIP'
    },

    // Ingress configuration
    ingress: {
        name: 'kafka-rest-ingress',
        path: '/kafka',
        pathType: 'Prefix',
        middleware: 'kafka-rest-stripprefix',
        stripPrefix: '/kafka'
    },

    // Environment variables
    environment: {
        KAFKA_REST_HOST_NAME: 'kafka-rest-proxy',
        KAFKA_REST_BOOTSTRAP_SERVERS: 'kafka-service:9092',
        KAFKA_REST_LISTENERS: 'http://0.0.0.0:8082',
        KAFKA_REST_SCHEMA_REGISTRY_URL: 'http://schema-registry-service:8081'
    },

    // Dependencies
    dependencies: {
        required: [
            {
                name: 'kafka-service',
                type: 'service',
                port: 9092,
                description: 'Kafka broker service'
            }
        ],
        optional: [
            {
                name: 'schema-registry-service', 
                type: 'service',
                port: 8081,
                description: 'Schema Registry service for Avro support'
            }
        ]
    },

    // Health check configuration
    healthCheck: {
        readiness: {
            httpGet: {
                path: '/',
                port: 8082
            },
            initialDelaySeconds: 30,
            timeoutSeconds: 10,
            periodSeconds: 30
        },
        liveness: {
            httpGet: {
                path: '/',
                port: 8082
            },
            initialDelaySeconds: 60,
            timeoutSeconds: 10,
            periodSeconds: 30
        }
    },

    // API endpoints
    endpoints: {
        internal: 'http://kafka-rest-service:8082',
        external: 'http://localhost/kafka',
        healthCheck: 'http://kafka-rest-service:8082/',
        topics: 'http://kafka-rest-service:8082/topics',
        consumers: 'http://kafka-rest-service:8082/consumers',
        brokers: 'http://kafka-rest-service:8082/brokers'
    },

    // Deployment timeouts
    timeouts: {
        deployment: 180, // seconds
        readiness: 30,   // seconds
        liveness: 10     // seconds
    }
};