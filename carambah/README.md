# Carambah - InfoMetis Composable Architecture

🚀 **Composable component ecosystem** for InfoMetis platform, enabling independent deployment across multiple environments.

## Overview

Carambah transforms InfoMetis from a monolithic Kubernetes-specific platform into a **truly composable ecosystem** where each component can be deployed independently across multiple environments while maintaining ease of deployment.

### Key Innovation: Enhanced Containers with Dormant Assets

Each component is packaged as an **enhanced container** that embeds deployment capabilities as **dormant assets**, providing full composability without runtime performance impact.

## Repository Structure

```
carambah/
├── components/           # Self-contained components
│   ├── kafka/           # Apache Kafka streaming
│   ├── elasticsearch/   # Search and analytics  
│   ├── grafana/         # Monitoring and visualization
│   ├── nifi/            # Data flow processing
│   ├── nifi-registry/   # NiFi flow registry
│   └── traefik/         # Load balancer and ingress
├── orchestrator/        # Multi-component orchestration
├── tools/              # Development and migration tools
└── docs/               # Documentation and examples
```

## Quick Start

### Deploy Individual Components

```bash
# Kafka component
cd components/kafka
npm install
./bin/cli.js deploy --env kubernetes

# Or use directly with npx
npx @infometis/kafka deploy --env docker-compose
```

### Deploy Complete Stack

```bash
# Using orchestrator
cd orchestrator
npm install
./bin/cli.js console          # Interactive deployment
./bin/cli.js deploy-stack ./examples/analytics-stack.json
```

### Enhanced Container Usage

```bash
# Deploy using enhanced container directly  
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

## Components

Each component is **completely self-contained** with:

- ✅ **Multi-environment support**: Kubernetes, Docker Compose, Standalone
- ✅ **Zero runtime overhead**: Deployment assets dormant during normal operation  
- ✅ **Drop-in compatibility**: Works exactly like official containers
- ✅ **Independent versioning**: Each component evolves separately
- ✅ **Self-deployment**: Can deploy itself using embedded capabilities

### Available Components

| Component | Description | Ports | Category |
|-----------|-------------|-------|----------|
| **Kafka** | Real-time streaming platform | 9092 | Streaming |
| **Elasticsearch** | Search and analytics engine | 9200 | Search |
| **Grafana** | Monitoring and visualization | 3000 | Monitoring |
| **NiFi** | Data flow processing | 8080 | Data Flow |
| **NiFi Registry** | Flow version control | 18080 | Data Flow |
| **Traefik** | Load balancer and ingress | 80/443 | Ingress |

## Environment Support

### Kubernetes
- StatefulSets with persistent volumes
- Service discovery and networking
- Resource limits and requests
- Horizontal Pod Autoscaling

### Docker Compose  
- Development-friendly single-node setup
- Automatic network creation
- Volume management
- Service dependencies

### Standalone Containers
- Direct Docker deployment
- Port mapping configuration
- Volume binding
- Container networking

## Migration from v0.4.0

```bash
# Automated migration from monolithic v0.4.0
cd tools/migration
./v040-to-components.js

# Manual component setup
cd components/kafka
npm install
npm test
```

## Architecture Benefits

### 🎯 **True Composability**
- Each component deployable independently
- Mix and match across different environments
- Component-specific configuration and scaling

### 🚀 **Zero Runtime Overhead**  
- Deployment assets compressed and dormant
- Identical performance to official containers
- On-demand activation only when deploying

### 🔄 **Drop-in Compatibility**
- Enhanced containers work like official containers
- Same command-line interfaces
- Existing automation works unchanged

### 🌐 **Multi-Environment Flexibility**
- Deploy Kafka to Kubernetes, Grafana to Docker Compose
- Hybrid cloud deployments
- Environment-specific optimizations

## Development

### Component Development
```bash
# Create new component
cp -r components/kafka components/my-component
cd components/my-component
# Edit component-spec.json, core/, environments/
npm test
```

### Orchestrator Development
```bash
cd orchestrator
npm install
npm run start    # Interactive console
npm test
```

### Enhanced Container Building
```bash
cd tools/enhanced-containers
./container-builder.js kafka
./container-builder.js --all
```

## Documentation

- 📋 [Architecture Design](docs/architecture/composable-architecture-design.md)
- 🚀 [Migration Guide](docs/migration-guide.md)  
- 🛠️ [Component Development](docs/component-development-guide.md)
- 📚 [Examples](docs/examples/)

## GitHub Container Registry

All components are distributed via GitHub Container Registry:

```bash
# Pull enhanced containers
docker pull ghcr.io/infometis/kafka:latest
docker pull ghcr.io/infometis/grafana:latest
docker pull ghcr.io/infometis/orchestrator:latest
```

## Contributing

1. Fork the repository
2. Create component in `components/` following the structure
3. Add component specification in `component-spec.json`
4. Implement multi-environment deployers
5. Add tests and documentation
6. Submit pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Carambah** - *Making InfoMetis components dance together across any environment* 🎭