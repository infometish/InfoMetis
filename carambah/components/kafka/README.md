# InfoMetis Kafka Component

Self-contained Apache Kafka deployment component for InfoMetis platform, supporting multiple environments.

## Overview

This component provides Apache Kafka streaming capabilities with support for:
- **Kubernetes** deployment with manifests and operators
- **Docker Compose** for development environments  
- **Standalone** container deployment
- **Multi-environment** orchestration capabilities

## Quick Start

```bash
# Auto-detect environment and deploy
npx @infometis/kafka deploy

# Deploy to specific environment
npx @infometis/kafka deploy --env kubernetes

# Check status
npx @infometis/kafka status

# View component specification
npx @infometis/kafka spec
```

## Installation

```bash
# As NPM package
npm install -g @infometis/kafka

# Or use directly with npx
npx @infometis/kafka --help
```

## Environment Support

### Kubernetes
- Requires kubectl configured with cluster access
- Deploys StatefulSet with persistent volumes
- Configurable via namespace, replicas, storage size

### Docker Compose
- Requires docker-compose installed
- Single-node development setup
- Network integration with other components

### Standalone
- Requires Docker daemon
- Self-contained container deployment
- Port mapping and volume configuration

## Configuration

Component behavior can be customized via:

1. **Environment variables**
2. **Configuration files** (`--config config.json`)
3. **Command-line arguments**

Example configuration:
```json
{
  "namespace": "analytics",
  "replicas": 3,
  "storage": "50Gi",
  "resources": {
    "cpu": "500m",
    "memory": "2Gi"
  }
}
```

## API Integration

The component exposes both Kafka native protocol and REST API:
- **Kafka Protocol**: Port 9092
- **REST API**: Port 8082 at `/kafka`

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Deploy to development environment
npm run deploy:compose
```

## Enhanced Container Usage

This component can also be used as an enhanced container:

```bash
# Deploy using container directly
docker run --rm \
  -v ~/.kube:/root/.kube \
  ghcr.io/infometis/kafka:latest \
  infometis deploy --env kubernetes

# Self-deploy as application
docker run --rm \
  -v ~/.kube:/root/.kube \
  ghcr.io/infometis/kafka:latest \
  infometis self-deploy
```

## Integration

Works seamlessly with other InfoMetis components:
- **NiFi**: Data flow processing
- **Elasticsearch**: Log aggregation  
- **Grafana**: Monitoring and visualization
- **Traefik**: Load balancing and ingress

## Support

- Documentation: [InfoMetis Docs](https://docs.infometis.com)
- Issues: [GitHub Issues](https://github.com/infometish/infometis-kafka/issues)
- Community: [Discord](https://discord.gg/infometis)