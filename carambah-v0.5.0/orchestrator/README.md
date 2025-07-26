# InfoMetis Orchestrator

The InfoMetis Orchestrator is a comprehensive component management system designed to coordinate the deployment and management of all image-based components in the InfoMetis platform. It provides multiple interfaces for interacting with the component ecosystem.

## Overview

The orchestrator serves as the central control plane for managing containerized components including:

- **Infrastructure Components**: k0s (Kubernetes), Traefik (Ingress)
- **Data Processing**: Apache NiFi, NiFi Registry
- **Analytics Platform**: Apache Kafka, ksqlDB, Apache Flink
- **Storage & Search**: Elasticsearch
- **Monitoring**: Grafana, Prometheus
- **Schema Management**: Schema Registry

## Architecture

```
orchestrator/
├── api/                    # REST API interface
│   ├── component-manager.js   # Core component management logic
│   └── server.js             # HTTP server implementation
├── bin/                    # Executable scripts
│   └── orchestrator          # CLI tool
├── console/                # Interactive console interface
│   ├── console-core.js       # Core console functionality
│   └── interactive-console.js # Menu-driven interface
├── core/                   # Component deployment modules
│   ├── deploy-k0s-cluster.js
│   ├── deploy-traefik.js
│   ├── deploy-nifi.js
│   └── ... (other components)
├── lib/                    # Shared utilities
│   ├── docker/             # Docker management
│   ├── kubectl/            # Kubernetes management
│   ├── fs/                 # File system utilities
│   └── logger.js           # Logging utility
├── config/                 # Configuration files
└── console.js              # Main entry point
```

## Usage Methods

### 1. Interactive Console (Recommended)

Start the menu-driven interactive console:

```bash
# Direct execution
node console.js

# Via npm script
npm start

# Via CLI tool
./bin/orchestrator console
```

The interactive console provides:
- Menu-driven navigation
- Step-by-step component deployment
- Real-time status feedback
- Progress tracking with visual indicators
- Auto-execution modes for complete stacks

### 2. Command Line Interface

Use the CLI for scripted deployments and automation:

```bash
# Make CLI executable (first time only)
chmod +x ./bin/orchestrator

# List available components
./bin/orchestrator list

# Deploy individual components
./bin/orchestrator deploy k0s
./bin/orchestrator deploy traefik
./bin/orchestrator deploy nifi

# Deploy predefined stacks
./bin/orchestrator deploy-stack basic
./bin/orchestrator deploy-stack complete

# Check component status
./bin/orchestrator status nifi

# Remove components
./bin/orchestrator remove nifi
./bin/orchestrator remove-stack basic

# Cache management
./bin/orchestrator cache-images
./bin/orchestrator load-images
```

### 3. REST API

Start the HTTP API server for external integration:

```bash
# Start API server
./bin/orchestrator api

# Or specify custom port
PORT=8080 ./bin/orchestrator api
```

API endpoints:

```
GET    /health                      # Health check
GET    /components                  # List components
POST   /components/{name}           # Deploy component
DELETE /components/{name}           # Remove component
GET    /components/{name}/status    # Component status
GET    /stacks                      # List stack configurations
POST   /stacks/{name}               # Deploy stack
DELETE /stacks/{name}               # Remove stack
POST   /cache/images                # Cache images
PUT    /cache/images                # Load cached images
```

### 4. Programmatic API

Use the orchestrator as a Node.js module:

```javascript
const ComponentManager = require('./api/component-manager');

const manager = new ComponentManager();

// Deploy individual components
await manager.deployComponent('k0s');
await manager.deployComponent('nifi');

// Deploy complete stacks
await manager.deployPredefinedStack('basic');

// Custom stack deployment
await manager.deployStack(['k0s', 'traefik', 'nifi', 'kafka']);

// Component management
const status = await manager.getComponentStatus('nifi');
await manager.removeComponent('nifi');
```

## Predefined Stack Configurations

The orchestrator includes several predefined stack configurations:

### Minimal Stack
- **Components**: k0s, traefik
- **Purpose**: Basic Kubernetes cluster with ingress
- **Usage**: Foundation for custom deployments

### Basic Stack  
- **Components**: k0s, traefik, nifi, registry
- **Purpose**: Data processing platform
- **Usage**: Flow development and management

### Analytics Stack
- **Components**: k0s, traefik, nifi, registry, kafka, elasticsearch
- **Purpose**: Data processing with stream analytics and search
- **Usage**: Real-time data pipelines with analytics

### Complete Stack
- **Components**: All available components
- **Purpose**: Full-featured analytics platform
- **Usage**: Production-ready comprehensive deployment

## Component Management

### Deployment Order

The orchestrator automatically handles deployment dependencies:

1. **Infrastructure**: k0s cluster, then Traefik ingress
2. **Core Services**: NiFi, Registry, Kafka
3. **Analytics**: ksqlDB, Flink, Elasticsearch
4. **Monitoring**: Grafana, Prometheus
5. **Supporting**: Schema Registry

### Image Caching

For offline or air-gapped environments:

```bash
# Cache all component images
./bin/orchestrator cache-images

# Load cached images into container runtime
./bin/orchestrator load-images
```

## Configuration

The orchestrator uses configuration files from the `config/` directory:

- `config/console/console-config.json`: Interactive console configuration
- `config/image-config.js`: Container image specifications
- `config/manifests/`: Kubernetes manifest templates

## Requirements

- **Node.js**: >= 14.0.0
- **Docker**: For container management
- **kubectl**: For Kubernetes operations (optional, managed internally)

## Integration with Components

The orchestrator is designed to work with the extracted component architecture where each component is self-contained in its own directory with:

- Standardized deployment interfaces
- Consistent configuration management
- Unified logging and error handling
- Cross-component communication patterns

## Development

To extend the orchestrator with new components:

1. Create deployment module in `core/deploy-{component}.js`
2. Follow the standard deployment interface pattern
3. Add component to `ComponentManager` initialization
4. Update stack configurations as needed

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 8080, 8082, etc. are available
2. **Docker Access**: Verify Docker daemon is running and accessible
3. **Kubernetes Access**: Check kubectl configuration if using external cluster
4. **Image Availability**: Use cache-images for offline scenarios

### Logs and Debugging

The orchestrator provides detailed logging for all operations:
- Component deployment progress
- Error messages with context
- Status checks and health monitoring
- Performance metrics

For verbose logging, check individual component modules in the `core/` directory.

## License

MIT License - See LICENSE file for details.