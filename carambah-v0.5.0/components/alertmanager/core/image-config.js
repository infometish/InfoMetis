/**
 * InfoMetis v0.5.0 - Alertmanager Image Configuration
 * Container image configuration for Prometheus Alertmanager component
 */

module.exports = {
    // Alertmanager container image
    image: "prom/alertmanager:v0.25.1",
    
    // Image pull policy for cached deployments
    imagePullPolicy: "Never",
    
    // Related images for complete monitoring stack
    relatedImages: [
        "prom/prometheus:v2.47.0",    // Prometheus server
        "prom/node-exporter:v1.6.1", // Node exporter
        "busybox:1.35"                // Init container
    ],
    
    // Container configuration
    container: {
        name: "alertmanager",
        port: 9093,
        protocol: "TCP",
        resources: {
            requests: {
                cpu: "100m",
                memory: "128Mi"
            },
            limits: {
                cpu: "500m", 
                memory: "512Mi"
            }
        }
    },
    
    // Volume configuration
    volumes: {
        config: {
            name: "alertmanager-config",
            mountPath: "/etc/alertmanager/"
        },
        storage: {
            name: "alertmanager-storage", 
            mountPath: "/alertmanager",
            size: "2Gi"
        }
    },
    
    // Command line arguments
    args: [
        "--config.file=/etc/alertmanager/alertmanager.yml",
        "--storage.path=/alertmanager",
        "--web.external-url=http://localhost/alertmanager",
        "--web.route-prefix=/"
    ],
    
    // Health check configuration
    healthCheck: {
        livenessProbe: {
            httpGet: {
                path: "/-/healthy",
                port: 9093
            },
            initialDelaySeconds: 30,
            periodSeconds: 30
        },
        readinessProbe: {
            httpGet: {
                path: "/-/ready", 
                port: 9093
            },
            initialDelaySeconds: 30,
            periodSeconds: 5
        }
    }
};