# Kafka REST Proxy Component

## Overview

This is the Kafka REST Proxy component extracted from InfoMetis v0.5.0, now part of the Carambah v0.5.0 composable architecture. This component provides HTTP-based access to Apache Kafka through the Confluent Platform REST Proxy.

## Component Details

- **Image**: `confluentinc/cp-kafka-rest:7.5.0`
- **Port**: 8082
- **Purpose**: HTTP REST API interface for Kafka producers and consumers
- **Dependencies**: Kafka broker service, optional Schema Registry

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTTP Client   │───▶│  Kafka REST     │───▶│   Kafka Broker  │
│                 │    │  Proxy :8082    │    │   :9092         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Schema Registry │
                       │   :8081         │
                       └─────────────────┘
```

## Features

- **REST API Access**: Full Kafka producer/consumer functionality via HTTP
- **Schema Registry Integration**: Support for Avro serialization/deserialization
- **Kubernetes Native**: Designed for containerized deployment
- **Ingress Support**: External access via Traefik with path-based routing
- **Health Monitoring**: Built-in readiness and liveness probes

## Directory Structure

```
kafka-rest/
├── README.md                           # This file
├── core/                              # Core deployment logic
│   ├── kafka-rest-deployment.js       # Main deployment class
│   └── config.js                      # Component configuration
├── bin/                               # Executable scripts
│   └── deploy-kafka-rest.js           # Standalone deployment script
└── environments/
    └── kubernetes/
        └── manifests/
            └── kafka-rest-k8s.yaml    # Kubernetes manifests
```

## Quick Start

### Prerequisites

1. Kubernetes cluster with kubectl access
2. Kafka broker service running (`kafka-service:9092`)
3. InfoMetis namespace created
4. Traefik ingress controller (for external access)

### Deployment

```bash
# Deploy using the standalone script
./bin/deploy-kafka-rest.js deploy

# Verify deployment
./bin/deploy-kafka-rest.js verify

# Check status
./bin/deploy-kafka-rest.js status

# Cleanup
./bin/deploy-kafka-rest.js cleanup
```

### Manual Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f environments/kubernetes/manifests/kafka-rest-k8s.yaml

# Check deployment status
kubectl get pods -n infometis -l app=kafka-rest-proxy
kubectl get svc -n infometis kafka-rest-service
```

## API Endpoints

### Internal Access
- **Base URL**: `http://kafka-rest-service:8082`
- **Topics**: `http://kafka-rest-service:8082/topics`
- **Consumers**: `http://kafka-rest-service:8082/consumers`
- **Brokers**: `http://kafka-rest-service:8082/brokers`

### External Access (via Ingress)
- **Base URL**: `http://localhost/kafka`
- **Topics**: `http://localhost/kafka/topics`
- **Consumers**: `http://localhost/kafka/consumers`
- **Brokers**: `http://localhost/kafka/brokers`

## Configuration

The component is configured through environment variables:

- `KAFKA_REST_HOST_NAME`: REST proxy hostname
- `KAFKA_REST_BOOTSTRAP_SERVERS`: Kafka broker addresses  
- `KAFKA_REST_LISTENERS`: REST API listener address
- `KAFKA_REST_SCHEMA_REGISTRY_URL`: Schema Registry URL (optional)

## Usage Examples

### List Topics
```bash
curl http://localhost/kafka/topics
```

### Produce Message
```bash
curl -X POST -H "Content-Type: application/vnd.kafka.json.v2+json" \
  http://localhost/kafka/topics/my-topic \
  -d '{"records":[{"value":{"name":"test"}}]}'
```

### Create Consumer
```bash
curl -X POST -H "Content-Type: application/vnd.kafka.v2+json" \
  http://localhost/kafka/consumers/my-group \
  -d '{"name":"my-consumer","format":"json","auto.offset.reset":"earliest"}'
```

## Dependencies

### Required
- **Kafka Service**: `kafka-service:9092` - Main Kafka broker
- **Kubernetes**: Container orchestration platform
- **Traefik**: Ingress controller for external access

### Optional
- **Schema Registry**: `schema-registry-service:8081` - For Avro support

## Resource Requirements

### Default Settings
- **CPU Request**: 200m
- **Memory Request**: 256Mi
- **CPU Limit**: 500m
- **Memory Limit**: 512Mi

### Scaling
- Default replica count: 1
- Can be scaled horizontally for high availability
- Stateless component, safe to scale

## Monitoring

### Health Checks
- **Readiness Probe**: HTTP GET on port 8082, path `/`
- **Liveness Probe**: HTTP GET on port 8082, path `/`

### Logs
```bash
# View logs
kubectl logs -n infometis -l app=kafka-rest-proxy -f

# View events
kubectl get events -n infometis --field-selector involvedObject.name=kafka-rest-proxy
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if Kafka service is running
   - Verify service name resolution: `kafka-service:9092`

2. **Schema Registry Errors**
   - Ensure Schema Registry is deployed if using Avro
   - Check `KAFKA_REST_SCHEMA_REGISTRY_URL` configuration

3. **Ingress Not Working**
   - Verify Traefik controller is running
   - Check middleware configuration for path stripping

### Debug Commands
```bash
# Check pod status
kubectl describe pod -n infometis -l app=kafka-rest-proxy

# Test internal connectivity
kubectl exec -n infometis deployment/kafka-rest-proxy -- curl localhost:8082

# Check service endpoints
kubectl get endpoints -n infometis kafka-rest-service
```

## Integration

This component is designed to integrate with:

1. **Kafka Core**: Main message broker
2. **Schema Registry**: Schema management and Avro support
3. **Monitoring Stack**: Prometheus metrics collection
4. **UI Components**: Kafka UI dashboard integration

## Version History

- **v0.5.0**: Initial extraction from InfoMetis v0.5.0
  - Confluent Platform 7.5.0
  - Kubernetes-native deployment
  - Traefik ingress integration
  - Health monitoring support

## License

This component is part of the Carambah platform and follows the same licensing terms as the parent project.