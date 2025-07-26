# InfoMetis Kafka Component

This directory contains the Kafka component for the InfoMetis analytics platform, providing a modern Apache Kafka deployment with KRaft mode (Zookeeper-free), REST API, and web UI management interface.

## Overview

The Kafka component is based on **confluentinc/cp-kafka:7.5.0** and provides:

- **Apache Kafka Broker**: Single-node Kafka deployment using KRaft mode
- **REST Proxy**: HTTP/REST interface for Kafka operations (confluentinc/cp-kafka-rest:7.5.0)
- **Web UI**: Management dashboard for Kafka clusters (provectuslabs/kafka-ui:latest)
- **Schema Registry**: Schema management for structured data (confluent/cp-schema-registry)

## Directory Structure

```
kafka/
├── README.md                           # This file
├── bin/                               # Deployment and utility scripts
│   └── deploy-kafka.js               # Main deployment script
├── core/                             # Core configuration and utility files
│   ├── config/                       # Configuration files
│   │   └── image-config.js          # Container image version definitions
│   └── lib/                         # Shared utility libraries
│       ├── exec.js                  # Command execution utilities
│       ├── logger.js                # Logging utilities
│       ├── fs/
│       │   └── config.js           # Configuration file loader
│       └── kubectl/
│           ├── kubectl.js          # Kubernetes API utilities
│           └── templates.js        # YAML template helpers
└── environments/
    └── kubernetes/
        └── manifests/                # Kubernetes deployment manifests
            ├── kafka-k8s.yaml       # Main Kafka deployment with KRaft mode
            └── schema-registry-k8s.yaml  # Schema Registry deployment
```

## Key Features

### Self-Contained Component
- **Independent operation**: All required utilities and configurations included
- **No external dependencies**: Includes logging, kubectl utilities, and execution helpers
- **Container image configuration**: Built-in image version management
- **Portable deployment**: Can be deployed independently or as part of InfoMetis platform

### KRaft Mode Configuration
- **Zookeeper-free**: Uses KRaft mode for consensus and metadata management
- **Single-node deployment**: Optimized for development and testing environments
- **Persistent storage**: 10GB PersistentVolume for data persistence
- **Resource limits**: Memory and CPU constraints for controlled resource usage

### Network Access
- **Internal cluster access**: `kafka-service:9092`
- **NodePort access**: `localhost:30092` for external connections
- **REST API**: Available at `http://localhost/kafka`
- **Web UI**: Available at `http://localhost/kafka-ui`

### Environment Variables
Key Kafka configuration through environment variables:
- `KAFKA_NODE_ID=1`
- `KAFKA_PROCESS_ROLES=broker,controller`
- `KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093`
- `KAFKA_LOG_RETENTION_HOURS=168` (7 days)
- `KAFKA_NUM_PARTITIONS=1`
- `KAFKA_DEFAULT_REPLICATION_FACTOR=1`

## Deployment

### Prerequisites
- Kubernetes cluster (k0s recommended)
- InfoMetis namespace (`infometis`)
- Traefik ingress controller for web access

### Quick Deployment
```bash
cd bin/
node deploy-kafka.js
```

### Manual Deployment
```bash
kubectl apply -f environments/kubernetes/manifests/kafka-k8s.yaml
kubectl apply -f environments/kubernetes/manifests/schema-registry-k8s.yaml
```

## Access Information

### Kafka Broker
- **Bootstrap servers**: `kafka-service:9092` (internal)
- **External access**: `localhost:30092` (NodePort)
- **Protocol**: PLAINTEXT (no authentication)

### REST API
- **Endpoint**: `http://localhost/kafka`
- **Test command**: `curl http://localhost/kafka/topics`
- **Documentation**: [Confluent REST Proxy API](https://docs.confluent.io/platform/current/kafka-rest/api.html)

### Web UI Dashboard
- **URL**: `http://localhost/kafka-ui`
- **Features**: Topic management, consumer group monitoring, message browsing
- **Configuration**: Automatic discovery of Kafka cluster

### Schema Registry
- **Endpoint**: `http://localhost/schema-registry` (if deployed)
- **Bootstrap servers**: Connected to `kafka-service:9092`
- **Topic**: `_schemas` for schema storage

## Storage

- **Persistent Volume**: 10GB local storage
- **Mount path**: `/var/lib/kafka/data`
- **Reclaim policy**: Delete (data removed when PV is deleted)
- **Storage class**: `local-storage`

## Resource Requirements

### Kafka Broker
- **Memory**: 1Gi request, 2Gi limit
- **CPU**: 500m request, 1000m limit

### REST Proxy
- **Memory**: 256Mi request, 512Mi limit
- **CPU**: 200m request, 500m limit

### UI Dashboard
- **Memory**: 256Mi request, 512Mi limit
- **CPU**: 200m request, 500m limit

## Health Checks

- **Readiness probes**: TCP socket checks on port 9092
- **Liveness probes**: TCP socket checks with appropriate delays
- **HTTP health checks**: For REST proxy and UI components

## Integration

This Kafka component is designed to integrate with other InfoMetis components:

- **Flink**: Stream processing engine for real-time analytics
- **ksqlDB**: SQL-based stream processing
- **Prometheus**: Metrics collection and monitoring
- **Grafana**: Visualization dashboards

## Development Notes

- **Image pull policy**: `Never` (uses local container images)
- **Tolerations**: Configured for single-node k0s deployments
- **Init containers**: Automatic volume permission setup
- **Security context**: Runs as user 1000 with proper ownership

## Version Information

- **Kafka Version**: 7.5.0 (Confluent Platform)
- **Architecture**: KRaft mode (Kafka Raft metadata mode)
- **Deployment target**: Kubernetes 1.21+
- **Component version**: InfoMetis v0.5.0