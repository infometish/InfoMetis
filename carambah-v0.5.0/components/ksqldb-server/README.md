# ksqlDB Server Component

This component provides the ksqlDB Server (confluentinc/ksqldb-server:0.29.0) for SQL-based stream processing in the InfoMetis platform.

## Overview

ksqlDB is a database purpose-built for stream processing applications. It provides a SQL interface for building stream processing applications on top of Apache Kafka. This component includes both the ksqlDB Server and CLI for interactive query development.

## Component Structure

```
ksqldb-server/
├── README.md                           # This file
├── core/
│   └── ksqldb-config.json             # Component configuration
├── bin/
│   └── deploy-ksqldb.js               # Deployment script
└── environments/
    └── kubernetes/
        └── manifests/
            ├── ksqldb-k8s.yaml       # Kubernetes deployment manifest
            └── ksqldb-ingress.yaml   # Ingress configuration
```

## Container Images

- **Server**: `confluentinc/ksqldb-server:0.29.0`
- **CLI**: `confluentinc/ksqldb-cli:0.29.0`

## Dependencies

- **Kafka**: Required for stream processing (kafka-service:9092)
- **Schema Registry**: Required for schema management (schema-registry-service:8081)
- **Kafka Connect**: Optional for connector integration (kafka-connect-service:8083)

## Configuration

The component is configured via:
- **Environment Variables**: Set in the Kubernetes deployment
- **Configuration File**: Properties mounted via ConfigMap
- **Component Config**: JSON configuration in `core/ksqldb-config.json`

### Key Configuration Properties

- `bootstrap.servers`: Kafka broker endpoints
- `ksql.schema.registry.url`: Schema Registry URL
- `ksql.service.id`: Unique service identifier
- `ksql.streams.auto.offset.reset`: Consumer offset reset policy
- `ksql.streams.num.stream.threads`: Number of stream processing threads

## Access Methods

### Web Access
- **ksqlDB Server API**: http://localhost/ksqldb
- **Direct Server API**: http://localhost:8088 (requires port-forward)

### CLI Access
```bash
# Connect to CLI pod
kubectl exec -it -n infometis deployment/ksqldb-cli -- ksql http://ksqldb-server-service:8088
```

### Port Forward (for direct access)
```bash
kubectl port-forward -n infometis service/ksqldb-server-service 8088:8088
```

## Usage Examples

### Creating Streams
```sql
CREATE STREAM users (id INT, name STRING) 
WITH (kafka_topic='users', value_format='JSON');
```

### Querying Streams
```sql
SELECT * FROM users EMIT CHANGES;
```

### Listing Objects
```sql
SHOW STREAMS;
SHOW TABLES;
SHOW TOPICS;
```

## Resource Requirements

### Server
- **CPU**: 500m (request) / 1000m (limit)
- **Memory**: 512Mi (request) / 1Gi (limit)

### CLI
- **CPU**: 100m (request) / 500m (limit)
- **Memory**: 128Mi (request) / 512Mi (limit)

## Deployment

### Using the Deployment Script
```bash
node bin/deploy-ksqldb.js deploy
```

### Using kubectl directly
```bash
kubectl apply -f environments/kubernetes/manifests/ksqldb-k8s.yaml
kubectl apply -f environments/kubernetes/manifests/ksqldb-ingress.yaml
```

## Health Checks

The server includes health probes:
- **Liveness**: HTTP GET /info (port 8088)
- **Readiness**: HTTP GET /info (port 8088)

## Cleanup

```bash
# Using deployment script
node bin/deploy-ksqldb.js cleanup

# Using kubectl
kubectl delete -f environments/kubernetes/manifests/
```

## Integration Points

- **Kafka Topics**: Automatically creates processing topics
- **Schema Registry**: Validates and manages schemas
- **Traefik Ingress**: Provides web access via /ksqldb path
- **Monitoring**: Exposes metrics for Prometheus collection

## Version Information

- **Component Version**: v0.5.0
- **ksqlDB Version**: 0.29.0
- **Source**: InfoMetis v0.5.0 release