# Schema Registry Component

## Overview

The Schema Registry component provides Confluent Schema Registry (confluentinc/cp-schema-registry:7.5.0) for Kafka schema management and evolution within the InfoMetis platform.

## Description

Schema Registry is a centralized service for managing and evolving data schemas in Kafka-based applications. It provides:

- **Schema Management**: Store, retrieve, and evolve Avro, JSON Schema, and Protobuf schemas
- **Schema Evolution**: Support for backward, forward, and full compatibility checking
- **REST API**: RESTful interface for schema operations and management
- **Integration**: Seamless integration with Kafka producers and consumers
- **Version Control**: Track schema versions and enforce compatibility rules

## Component Structure

```
schema-registry/
├── README.md                           # This file
├── bin/                               # Deployment scripts
│   └── deploy-schema-registry.js      # Main deployment script
├── core/                              # Core utilities and configuration
│   ├── docker/                        # Docker utilities
│   ├── fs/                           # File system utilities
│   ├── kubectl/                      # Kubernetes utilities
│   ├── exec.js                       # Execution utilities
│   ├── logger.js                     # Logging utilities
│   └── image-config.js               # Container image configuration
└── environments/
    └── kubernetes/
        └── manifests/                 # Kubernetes deployment manifests
            ├── schema-registry-k8s.yaml      # Main deployment
            └── schema-registry-ingress.yaml  # Ingress configuration
```

## Container Image

- **Image**: `confluentinc/cp-schema-registry:7.5.0`
- **Base**: Confluent Platform Schema Registry
- **Port**: 8081 (HTTP API)
- **Platform**: Kafka schema management

## Features

### Schema Management
- Store and retrieve schemas for Kafka topics
- Support for Avro, JSON Schema, and Protobuf formats
- Schema versioning and evolution tracking
- Global and subject-level compatibility settings

### API Endpoints
- `GET /subjects` - List all schema subjects
- `GET /subjects/{subject}/versions` - Get versions for a subject
- `GET /subjects/{subject}/versions/{version}` - Get specific schema version
- `POST /subjects/{subject}/versions` - Register new schema version
- `POST /compatibility/subjects/{subject}/versions/{version}` - Check compatibility

### Compatibility Modes
- **BACKWARD** (default): New schema can read data written with previous schema
- **FORWARD**: Previous schema can read data written with new schema
- **FULL**: Both backward and forward compatibility
- **NONE**: No compatibility checking

## Configuration

### Kubernetes Deployment
- **Namespace**: `infometis`
- **Replicas**: 1
- **Resources**: 1 CPU / 1Gi memory limit, 250m CPU / 512Mi memory request
- **Dependencies**: Kafka cluster must be running

### Environment Variables
- `SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS`: Kafka bootstrap servers
- `SCHEMA_REGISTRY_LISTENERS`: HTTP listeners configuration
- `SCHEMA_REGISTRY_SCHEMA_COMPATIBILITY_LEVEL`: Default compatibility level
- `SCHEMA_REGISTRY_KAFKASTORE_TOPIC`: Internal topic for schema storage

### Ingress Configuration
- **Path**: `/schema-registry`
- **Host**: `localhost`
- **Backend**: `schema-registry-service:8081`
- **Middleware**: Strip `/schema-registry` prefix

## Deployment

### Prerequisites
- Kubernetes cluster with InfoMetis namespace
- Kafka cluster running and accessible
- Traefik ingress controller (for web access)

### Deploy Schema Registry
```bash
# Deploy using the script
node bin/deploy-schema-registry.js deploy

# Or apply manifests directly
kubectl apply -f environments/kubernetes/manifests/schema-registry-k8s.yaml
kubectl apply -f environments/kubernetes/manifests/schema-registry-ingress.yaml
```

### Cleanup
```bash
# Cleanup using the script
node bin/deploy-schema-registry.js cleanup
```

## Access Information

### Web Access
- **API Endpoint**: http://localhost/schema-registry
- **Direct Access**: http://localhost:8081 (requires port-forward)

### Port Forward (Direct Access)
```bash
kubectl port-forward -n infometis service/schema-registry-service 8081:8081
```

### Integration
- **Kafka Bootstrap**: `kafka-service:9092`
- **Schema Registry URL**: `http://schema-registry-service:8081`

## Usage Examples

### List All Subjects
```bash
curl http://localhost/schema-registry/subjects
```

### Get Latest Schema
```bash
curl http://localhost/schema-registry/subjects/user-value/versions/latest
```

### Register New Schema
```bash
curl -X POST \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"schema":"{\"type\":\"record\",\"name\":\"User\",\"fields\":[{\"name\":\"id\",\"type\":\"int\"},{\"name\":\"name\",\"type\":\"string\"}]}"}' \
  http://localhost/schema-registry/subjects/user-value/versions
```

### Check Compatibility
```bash
curl -X POST \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"schema":"{\"type\":\"record\",\"name\":\"User\",\"fields\":[{\"name\":\"id\",\"type\":\"int\"},{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"email\",\"type\":\"string\"}]}"}' \
  http://localhost/schema-registry/compatibility/subjects/user-value/versions/latest
```

## Health Checks

### Liveness Probe
- **Path**: `/`
- **Port**: 8081
- **Initial Delay**: 60 seconds

### Readiness Probe
- **Path**: `/subjects`
- **Port**: 8081
- **Initial Delay**: 30 seconds

### Startup Probe
- **Path**: `/`
- **Port**: 8081
- **Failure Threshold**: 30 attempts

## Dependencies

### Runtime Dependencies
- Kafka cluster (kafka-service:9092)
- Kubernetes cluster
- InfoMetis namespace

### Wait Strategy
- Init container waits for Kafka availability using busybox:1.35
- Startup probe ensures Schema Registry is fully initialized

## Notes

- Schema Registry stores schemas in Kafka topic `_schemas`
- Default replication factor is 1 (suitable for single-node development)
- Compatibility level can be changed globally or per subject
- Schema evolution follows compatibility rules to prevent data corruption
- All schemas are stored with version numbers for tracking changes