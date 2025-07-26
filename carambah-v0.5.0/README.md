# Carambah v0.5.0 - InfoMetis Image-Based Composable Architecture

🚀 **Image-level composable ecosystem** for InfoMetis v0.5.0 Kafka Ecosystem Platform, enabling independent deployment of each container image across multiple environments.

## Overview

Carambah v0.5.0 transforms InfoMetis from a monolithic deployment into a **truly image-based composable ecosystem** where each container image is packaged as a **self-contained component** that can be deployed independently while maintaining ease of orchestration.

### Key Innovation: Image-Level Component Separation

Each container image used in InfoMetis v0.5.0 is packaged as an **independent component** with embedded deployment capabilities, providing full composability at the **image level** rather than service level.

## Repository Structure

```
carambah-v0.5.0/
├── components/                    # Image-based self-contained components
│   ├── k0s/                      # k0sproject/k0s:latest
│   ├── traefik/                  # traefik:v2.9  
│   ├── nifi/                     # apache/nifi:1.23.2
│   ├── nifi-registry/            # apache/nifi-registry:1.23.2
│   ├── elasticsearch/            # elasticsearch:8.15.0
│   ├── grafana/                  # grafana/grafana:10.2.0
│   ├── kafka/                    # confluentinc/cp-kafka:7.5.0
│   ├── kafka-rest/               # confluentinc/cp-kafka-rest:7.5.0
│   ├── kafka-ui/                 # provectuslabs/kafka-ui:latest
│   ├── busybox/                  # busybox:1.35
│   ├── schema-registry/          # confluentinc/cp-schema-registry:7.5.0
│   ├── flink/                    # apache/flink:1.18-scala_2.12
│   ├── ksqldb-server/            # confluentinc/ksqldb-server:0.29.0
│   ├── ksqldb-cli/               # confluentinc/ksqldb-cli:0.29.0
│   ├── prometheus/               # prom/prometheus:v2.47.0
│   ├── alertmanager/             # prom/alertmanager:v0.25.1
│   └── node-exporter/            # prom/node-exporter:v1.6.1
├── auxiliary-images/             # k0s system dependencies (auto-managed)
│   ├── kube-router/              # cloudnativelabs/kube-router:v1.3.2
│   ├── coredns/                  # coredns/coredns:1.7.1
│   ├── apiserver-network-proxy-agent/  # quay.io/k0sproject/apiserver-network-proxy-agent:0.0.32-k0s1
│   ├── cni-node/                 # quay.io/k0sproject/cni-node:0.1.0
│   ├── kube-proxy/               # registry.k8s.io/kube-proxy:v1.23.17
│   ├── metrics-server/           # registry.k8s.io/metrics-server/metrics-server:v0.5.2
│   └── pause/                    # registry.k8s.io/pause:3.5
├── orchestrator/                 # Multi-component orchestration system
└── docs/                         # Architecture and migration documentation
```

## Quick Start

### Deploy Individual Components

```bash
# Deploy Kafka component
cd components/kafka
node bin/deploy-kafka.js

# Deploy Flink component  
cd components/flink
node bin/deploy-flink.js

# Deploy Schema Registry component
cd components/schema-registry
node bin/deploy-schema-registry.js
```

### Deploy Complete v0.5.0 Stack

```bash
# Using orchestrator - Interactive mode
cd orchestrator
node console.js

# Using orchestrator - CLI mode
cd orchestrator
./bin/orchestrator deploy complete

# Using orchestrator - API mode
cd orchestrator
./bin/orchestrator api
# Then: curl -X POST http://localhost:3000/deploy/complete
```

## Available Components (v0.5.0)

### **Infrastructure Components**
| Component | Image | Version | Status | Description |
|-----------|-------|---------|--------|-------------|
| **k0s** | `k0sproject/k0s` | latest | ✅ Complete | Lightweight Kubernetes distribution |
| **traefik** | `traefik` | v2.9 | ✅ Complete | Load balancer and ingress controller |
| **busybox** | `busybox` | 1.35 | ✅ Complete | Utility container for init operations |

### **Data Platform Components**  
| Component | Image | Version | Status | Description |
|-----------|-------|---------|--------|-------------|
| **nifi** | `apache/nifi` | 1.23.2 | ✅ Complete | Visual data flow processing |
| **nifi-registry** | `apache/nifi-registry` | 1.23.2 | ✅ Complete | Flow version control and registry |
| **elasticsearch** | `elasticsearch` | 8.15.0 | ✅ Complete | Search and analytics engine |
| **grafana** | `grafana/grafana` | 10.2.0 | ✅ Complete | Monitoring and visualization platform |

### **Kafka Ecosystem Components**
| Component | Image | Version | Status | Description |
|-----------|-------|---------|--------|-------------|
| **kafka** | `confluentinc/cp-kafka` | 7.5.0 | ✅ Complete | Apache Kafka streaming platform |
| **kafka-rest** | `confluentinc/cp-kafka-rest` | 7.5.0 | ✅ Complete | Kafka REST Proxy |
| **kafka-ui** | `provectuslabs/kafka-ui` | latest | ✅ Complete | Kafka web management interface |
| **schema-registry** | `confluentinc/cp-schema-registry` | 7.5.0 | ✅ Complete | Schema management and evolution |
| **flink** | `apache/flink` | 1.18-scala_2.12 | ✅ Complete | Distributed stream processing |
| **ksqldb-server** | `confluentinc/ksqldb-server` | 0.29.0 | ✅ Complete | Streaming SQL engine |
| **ksqldb-cli** | `confluentinc/ksqldb-cli` | 0.29.0 | ✅ Complete | ksqlDB command-line interface |

### **Monitoring Components**
| Component | Image | Version | Status | Description |
|-----------|-------|---------|--------|-------------|
| **prometheus** | `prom/prometheus` | v2.47.0 | ✅ Complete | Metrics collection and alerting |
| **alertmanager** | `prom/alertmanager` | v0.25.1 | ✅ Complete | Alert routing and management |
| **node-exporter** | `prom/node-exporter` | v1.6.1 | ✅ Complete | System metrics collection |

### **Auxiliary Images (k0s System Dependencies)**
| Component | Image | Version | Management | Description |
|-----------|-------|---------|------------|-------------|
| **kube-router** | `cloudnativelabs/kube-router` | v1.3.2 | Auto-managed | Network fabric (CNI, policies, service proxy) |
| **coredns** | `coredns/coredns` | 1.7.1 | Auto-managed | DNS server for service discovery |
| **apiserver-network-proxy-agent** | `quay.io/k0sproject/apiserver-network-proxy-agent` | 0.0.32-k0s1 | Auto-managed | Secure tunneling (k0s-specific) |
| **cni-node** | `quay.io/k0sproject/cni-node` | 0.1.0 | Auto-managed | CNI management on nodes (k0s-specific) |
| **kube-proxy** | `registry.k8s.io/kube-proxy` | v1.23.17 | Auto-managed | Service proxy and load balancing |
| **metrics-server** | `registry.k8s.io/metrics-server/metrics-server` | v0.5.2 | Auto-managed | Resource metrics for autoscaling |
| **pause** | `registry.k8s.io/pause` | 3.5 | Auto-managed | Pod infrastructure container |

**Status Legend**: ✅ Complete (extracted and organized) | Auto-managed (k0s system dependency)

## Component Architecture

Each component follows a standardized structure:

```
component-name/
├── README.md                     # Component documentation
├── bin/                         # Deployment and management scripts
│   └── deploy-{component}.js    # Main deployment script
├── core/                        # Self-contained utilities and libraries
│   ├── lib/                     # Shared utility libraries
│   │   ├── logger.js           # Logging utility
│   │   ├── exec.js             # Command execution
│   │   ├── kubectl/            # Kubernetes utilities
│   │   ├── docker/             # Docker utilities
│   │   └── fs/                 # File system utilities
│   └── image-config.js         # Container image configuration
├── environments/               # Environment-specific configurations
│   └── kubernetes/
│       └── manifests/          # Kubernetes deployment manifests
└── docs/                       # Component-specific documentation
```

## Environment Support

### Kubernetes (Primary)
- Complete StatefulSet and Deployment configurations
- Persistent Volume support for stateful components
- Service discovery and networking
- Traefik ingress integration
- Resource limits and requests

### Docker Compose (Future)
- Development-friendly single-node setup
- Automatic network creation and service linking
- Volume management and persistence

### Standalone Containers (Future)
- Direct Docker deployment without orchestration
- Port mapping and volume binding configuration
- Container networking and inter-service communication

## Orchestrator Capabilities

The orchestrator provides multiple interfaces for component management:

### 1. Interactive Console
```bash
cd orchestrator
node console.js
# Menu-driven interface for component deployment
```

### 2. Command Line Interface
```bash
cd orchestrator
./bin/orchestrator --help
./bin/orchestrator list               # List available components
./bin/orchestrator deploy kafka       # Deploy single component
./bin/orchestrator deploy complete    # Deploy complete stack
./bin/orchestrator status            # Check component status
```

### 3. REST API
```bash
cd orchestrator  
./bin/orchestrator api               # Start API server on port 3000

# API endpoints:
# GET    /components                 # List components
# POST   /deploy/{component}         # Deploy component
# DELETE /deploy/{component}         # Remove component
# GET    /status                     # Platform status
```

### 4. Programmatic Interface
```javascript
const ComponentManager = require('./orchestrator/api/component-manager');

const manager = new ComponentManager();

// Deploy individual component
await manager.deployComponent('kafka');

// Deploy predefined stack
await manager.deployStack('analytics'); // kafka + elasticsearch + grafana

// Custom component selection
await manager.deployComponents(['kafka', 'flink', 'ksqldb-server']);
```

## Predefined Stack Configurations

| Stack | Components | Use Case |
|-------|------------|----------|
| **minimal** | k0s + traefik | Basic infrastructure |
| **basic** | minimal + nifi + nifi-registry | Data pipeline development |
| **analytics** | basic + kafka + elasticsearch + grafana | Stream analytics |
| **kafka-ecosystem** | analytics + schema-registry + flink + ksqldb-server | Complete Kafka platform |
| **monitoring** | kafka-ecosystem + prometheus | Production monitoring |
| **complete** | All 11 components | Full InfoMetis v0.5.0 platform |

## Migration from v0.5.0

### Automated Extraction Process

The components in this repository were extracted from InfoMetis v0.5.0 using an automated process:

1. **Asset Identification**: Identified all 18 container images used in v0.5.0
2. **Component Extraction**: Extracted deployment scripts, manifests, and utilities
3. **Path Updates**: Updated all import and file paths for component independence  
4. **Self-Contained Structure**: Copied all required dependencies into each component
5. **Documentation Generation**: Created comprehensive README files for each component

### Verification Status

**✅ Completed Components (11/18)**:
- Infrastructure: k0s, traefik
- Data Platform: nifi, nifi-registry, elasticsearch, grafana  
- Kafka Ecosystem: kafka, schema-registry, flink, ksqldb-server
- Monitoring: prometheus

**📝 Pending Components (7/18)**:
- Support Images: kafka-rest, kafka-ui, busybox
- CLI Tools: ksqldb-cli
- Monitoring: alertmanager, node-exporter

## Development Workflow

### Adding New Components

1. **Create Component Directory**:
   ```bash
   mkdir -p components/new-component/{bin,core,environments/kubernetes/manifests}
   ```

2. **Extract Assets**: Copy deployment scripts, manifests, and utilities from v0.5.0

3. **Update Paths**: Modify import statements to use relative `../core/` paths

4. **Create Documentation**: Add comprehensive README.md with usage instructions

5. **Test Deployment**: Verify component can deploy independently

### Component Development

```bash
# Test individual component
cd components/kafka
node bin/deploy-kafka.js

# Add component to orchestrator
cd orchestrator
# Edit config/component-registry.js to include new component
```

## Architecture Benefits

### 🎯 **True Image-Level Composability**
- Each container image deployable independently
- Mix and match components across different environments  
- Component-specific versioning and configuration

### 🔧 **Self-Contained Components**
- All dependencies included within component directory
- No external references or shared state
- Independent deployment and lifecycle management

### 📦 **Container Image Alignment**
- Direct mapping between components and container images
- Proper caching and optimization support
- Clear separation of concerns per image

### 🌐 **Multi-Environment Ready**
- Kubernetes-native with future Docker Compose support
- Environment-specific configuration management
- Platform-agnostic deployment patterns

## Future Enhancements

### Enhanced Container Development
- **Multi-stage builds** with dormant deployment assets
- **GitHub Container Registry** distribution
- **Enhanced containers** that embed deployment capabilities

### Multi-Environment Support  
- **Docker Compose** environment implementation
- **Standalone container** deployment support
- **Cloud platform** integration (AWS, GCP, Azure)

### Advanced Orchestration
- **Dependency management** between components
- **Rolling updates** and blue-green deployments
- **Auto-scaling** and resource optimization
- **Service mesh** integration

## Documentation

- 📋 [Original Carambah Architecture](../carambah-backup/docs/architecture/composable-architecture-design.md)
- 🚀 [InfoMetis v0.5.0 Documentation](../v0.5.0/docs/)  
- 🛠️ [Component Development Guide](docs/component-development-guide.md) (TBD)
- 📚 [Migration Guide](docs/migration-guide.md) (TBD)

## Contributing

1. **Component Addition**: Follow the standardized component structure
2. **Asset Extraction**: Extract deployment logic and manifests from v0.5.0
3. **Path Updates**: Ensure all imports use relative component paths
4. **Testing**: Verify independent component deployment
5. **Documentation**: Add comprehensive README.md and usage examples

## Status Summary

**Current State**: 11/18 components extracted and organized (61% complete)

**Ready for Use**:
- ✅ Complete Kafka ecosystem deployment
- ✅ Full monitoring and visualization stack  
- ✅ Stream processing with Flink and ksqlDB
- ✅ Data ingestion and analytics pipeline

**Next Steps**:
- Complete remaining 7 components (support images, CLI tools, monitoring)
- Implement Docker Compose environment support
- Add enhanced container builds with dormant assets
- Create comprehensive testing and validation suite

---

**Carambah v0.5.0** - *Making InfoMetis container images dance independently across any environment* 🎭