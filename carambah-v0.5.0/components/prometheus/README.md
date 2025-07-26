# Prometheus Component

This is the Prometheus monitoring component for InfoMetis carambah-v0.5.0, providing comprehensive monitoring and alerting capabilities for the InfoMetis platform.

## Overview

The Prometheus component deploys a complete monitoring stack including:
- **Prometheus Server** (prom/prometheus:v2.47.0) - Time series database and monitoring system
- **Alertmanager** (prom/alertmanager:v0.25.1) - Alert handling and routing
- **Node Exporter** (prom/node-exporter:v1.6.1) - Hardware and OS metrics collector

## Directory Structure

```
prometheus/
├── bin/                                    # Executable scripts
│   ├── deploy-prometheus.js               # Main deployment script
│   └── test-prometheus.sh                 # Testing and verification script
├── core/                                  # Core utility libraries
│   ├── docker/
│   │   └── docker.js                      # Docker operations utility
│   ├── fs/
│   │   └── config.js                      # Configuration file handling
│   ├── kubectl/
│   │   ├── kubectl.js                     # Kubernetes operations utility
│   │   └── templates.js                   # YAML template generation
│   ├── exec.js                            # Process execution utility
│   ├── logger.js                          # Logging utility
│   └── image-config.js                    # Container image configuration
├── environments/
│   └── kubernetes/
│       └── manifests/                     # Kubernetes manifests
│           ├── prometheus-k8s.yaml        # Main Prometheus deployment
│           └── prometheus-ingress.yaml    # Ingress configuration
└── README.md                              # This file
```

## Features

### Monitoring Capabilities
- **Service Discovery**: Automatic discovery of InfoMetis components
- **Metrics Collection**: Comprehensive metrics from all platform components:
  - Kafka cluster metrics
  - Flink job metrics  
  - ksqlDB server metrics
  - Node-level system metrics
  - Kubernetes cluster metrics
- **Alerting Rules**: Pre-configured alerts for critical issues
- **Data Retention**: 15-day metric retention with configurable storage

### Components Monitored
- Prometheus itself
- Node Exporter (system metrics)
- Kafka JMX metrics
- Flink JobManager and TaskManager
- ksqlDB Server
- Elasticsearch
- Grafana
- Alertmanager
- Kubernetes API Server
- Kubernetes Nodes

### Alert Rules
- **System Alerts**: High CPU usage, memory usage, low disk space
- **Service Alerts**: Service availability monitoring for all InfoMetis components
- **Custom Thresholds**: Configurable alert thresholds

## Usage

### Deployment

```bash
# Deploy Prometheus monitoring stack
node bin/deploy-prometheus.js

# Clean up deployment
node bin/deploy-prometheus.js cleanup
```

### Testing

```bash
# Run component verification tests
bash bin/test-prometheus.sh
```

### Access

#### Web Interfaces
- **Prometheus Server**: http://localhost/prometheus
- **Alertmanager**: http://localhost/alertmanager

#### Direct Access (via port-forward)
```bash
# Prometheus Server
kubectl port-forward -n infometis service/prometheus-server-service 9090:9090
# Access: http://localhost:9090

# Alertmanager  
kubectl port-forward -n infometis service/alertmanager-service 9093:9093
# Access: http://localhost:9093
```

## Configuration

### Prometheus Configuration
- **Scrape Interval**: 15 seconds
- **Evaluation Interval**: 15 seconds
- **Storage**: Local persistent volumes
- **External URL**: Configured for Traefik ingress integration

### Alertmanager Configuration
- **Route Configuration**: Grouped by alertname, cluster, and service
- **Receivers**: Webhook-based alert routing
- **Inhibition Rules**: Critical alerts suppress warning alerts

### Storage
- **Prometheus Storage**: 10Gi persistent volume at `/tmp/prometheus-data`
- **Alertmanager Storage**: 2Gi persistent volume at `/tmp/alertmanager-data`

## Example Queries

### System Metrics
```promql
# CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

### Application Metrics
```promql
# Kafka broker count
kafka_server_broker_count

# Flink JobManager CPU load
flink_jobmanager_Status_JVM_CPU_Load

# ksqlDB server status
up{job="ksqldb"}
```

## Dependencies

### Required Images
- prom/prometheus:v2.47.0
- prom/alertmanager:v0.25.1  
- prom/node-exporter:v1.6.1
- busybox:1.35 (for init containers)

### Required Infrastructure
- Kubernetes cluster (k0s)
- Traefik ingress controller
- Local storage provisioner
- InfoMetis namespace

### Service Dependencies
- **Optional**: Other InfoMetis components for comprehensive monitoring
- **Required**: Kubernetes cluster with RBAC enabled

## Integration

### With Grafana
This Prometheus instance serves as the data source for Grafana dashboards, providing:
- Real-time metrics visualization
- Historical data analysis
- Custom dashboard creation
- Alert visualization

### With InfoMetis Platform
- **Service Discovery**: Automatically discovers and monitors all InfoMetis components
- **Namespace Integration**: Deploys to infometis namespace
- **Ingress Integration**: Accessible via Traefik reverse proxy
- **Storage Integration**: Uses InfoMetis local storage class

## Troubleshooting

### Common Issues

1. **Prometheus not starting**
   - Check storage permissions
   - Verify persistent volume availability
   - Check resource limits

2. **No metrics appearing**
   - Verify target discovery in Prometheus UI
   - Check service labels and selectors
   - Verify network connectivity

3. **Alerts not firing**
   - Check alerting rules syntax
   - Verify Alertmanager configuration
   - Check webhook endpoints

### Logs
```bash
# Prometheus Server logs
kubectl logs -n infometis deployment/prometheus-server

# Alertmanager logs  
kubectl logs -n infometis deployment/alertmanager

# Node Exporter logs
kubectl logs -n infometis daemonset/node-exporter
```

## Version Information

- **Component Version**: v0.5.0
- **Prometheus Version**: v2.47.0
- **Alertmanager Version**: v0.25.1
- **Node Exporter Version**: v1.6.1
- **InfoMetis Platform**: carambah-v0.5.0