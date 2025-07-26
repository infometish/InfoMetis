# Kafka UI Component

This is the Kafka UI component for the InfoMetis platform. It provides a web-based interface for managing and monitoring Apache Kafka clusters using `provectuslabs/kafka-ui:latest`.

## Overview

The Kafka UI component deploys a web dashboard that allows you to:

- Monitor Kafka cluster health and metrics
- Browse and manage topics
- View and manage consumer groups
- Browse messages in topics
- Monitor connect clusters
- View schema registry data

## Architecture

- **Image**: `provectuslabs/kafka-ui:latest`
- **Port**: 8080
- **Context Path**: `/kafka-ui`
- **Dependencies**: Kafka cluster (kafka-service:9092)
- **Namespace**: `infometis`

## Directory Structure

```
kafka-ui/
├── README.md                     # This file
├── bin/                         # Deployment scripts
│   ├── deploy-kafka-ui.js       # Deploy Kafka UI
│   └── cleanup-kafka-ui.js      # Cleanup Kafka UI
├── core/                        # Core component logic
│   ├── kafka-ui-deployment.js   # Main deployment class
│   ├── kafka-ui-config.json     # Component configuration
│   └── image-config.js          # Image configuration
├── environments/                # Environment-specific configs
│   └── kubernetes/
│       └── manifests/
│           └── kafka-ui-k8s.yaml # Kubernetes manifests
└── lib/                        # Shared utilities
    ├── docker/                  # Docker utilities
    ├── fs/                     # Filesystem utilities
    ├── kubectl/                # Kubectl utilities
    ├── exec.js                 # Process execution
    └── logger.js               # Logging utility
```

## Quick Start

### Prerequisites

1. k0s cluster running
2. InfoMetis namespace exists
3. Kafka cluster deployed and accessible at `kafka-service:9092`
4. Traefik ingress controller deployed

### Deploy Kafka UI

```bash
# Using the deployment script
node bin/deploy-kafka-ui.js

# Or using the core class directly
node core/kafka-ui-deployment.js
```

### Access Kafka UI

Once deployed, access the Kafka UI at:
- **URL**: http://localhost/kafka-ui
- **Health Check**: http://localhost/kafka-ui/actuator/health

### Cleanup

```bash
# Remove Kafka UI deployment
node bin/cleanup-kafka-ui.js
```

## Configuration

The Kafka UI is configured via environment variables set in the deployment:

- `KAFKA_CLUSTERS_0_NAME`: "infometis-kafka"
- `KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS`: "kafka-service:9092"
- `SERVER_SERVLET_CONTEXT_PATH`: "/kafka-ui"
- `DYNAMIC_CONFIG_ENABLED`: "true"

See `core/kafka-ui-config.json` for complete configuration details.

## Kubernetes Resources

The component deploys the following Kubernetes resources:

1. **Deployment**: `kafka-ui` - Runs the Kafka UI container
2. **Service**: `kafka-ui-service` - ClusterIP service on port 8080
3. **Ingress**: `kafka-ui-ingress` - Traefik ingress for `/kafka-ui` path

## Features

- **Cluster Monitoring**: Real-time cluster health and broker status
- **Topic Management**: Create, configure, and delete topics
- **Message Browser**: View and search messages in topics
- **Consumer Groups**: Monitor consumer group lag and status
- **Schema Registry**: Integration with Confluent Schema Registry
- **Connect Clusters**: Monitor Kafka Connect clusters
- **ACL Management**: Manage access control lists
- **Configuration**: View and edit cluster configurations

## Resource Requirements

- **Memory**: 256Mi (request) / 512Mi (limit)
- **CPU**: 200m (request) / 500m (limit)

## Health Checks

- **Readiness Probe**: `/kafka-ui/actuator/health` (30s delay, 10s timeout, 30s period)
- **Liveness Probe**: `/kafka-ui/actuator/health` (60s delay, 10s timeout, 30s period)

## Troubleshooting

### Common Issues

1. **UI not accessible**: Check ingress configuration and Traefik deployment
2. **Cannot connect to Kafka**: Verify kafka-service is running and accessible
3. **Pod not starting**: Check image availability in k0s containerd

### Debugging Commands

```bash
# Check pod status
kubectl get pods -n infometis -l app=kafka-ui

# View pod logs
kubectl logs -n infometis deployment/kafka-ui -f

# Check service
kubectl get svc -n infometis kafka-ui-service

# Check ingress
kubectl get ingress -n infometis kafka-ui-ingress

# Port forward for direct access
kubectl port-forward -n infometis deployment/kafka-ui 8080:8080
```

## Integration

This component is designed to work with:

- **Kafka Component**: Requires running Kafka cluster
- **Traefik Component**: For ingress routing
- **Schema Registry Component**: Optional, for schema management
- **Connect Component**: Optional, for connector monitoring

## Development

To modify the Kafka UI deployment:

1. Edit `core/kafka-ui-deployment.js` for deployment logic
2. Update `environments/kubernetes/manifests/kafka-ui-k8s.yaml` for Kubernetes resources
3. Modify `core/kafka-ui-config.json` for configuration changes

## Version Information

- **Component Version**: v0.5.0
- **Kafka UI Image**: provectuslabs/kafka-ui:latest
- **InfoMetis Platform**: v0.5.0

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review pod logs for error messages
3. Verify all prerequisites are met
4. Ensure Kafka cluster is healthy and accessible