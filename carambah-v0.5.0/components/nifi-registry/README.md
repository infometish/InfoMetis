# NiFi Registry Component

## Overview

The NiFi Registry component provides flow versioning and management capabilities for Apache NiFi deployments. This component runs Apache NiFi Registry version 1.23.2 in a Kubernetes environment.

## Docker Image

- **Image**: `apache/nifi-registry:1.23.2`
- **Pull Policy**: Never (cached deployments)
- **Base Platform**: Apache NiFi Registry

## Component Structure

```
nifi-registry/
├── README.md                     # This file
├── bin/                         # Deployment scripts
│   └── deploy-registry.js       # Main deployment script
├── core/                        # Core utilities
│   ├── logger.js               # Logging utility
│   ├── exec.js                 # Command execution utility
│   ├── image-config.js         # Container image configuration
│   ├── docker/
│   │   └── docker.js           # Docker utilities
│   ├── fs/
│   │   └── config.js           # Configuration file utilities
│   └── kubectl/
│       ├── kubectl.js          # Kubernetes utilities
│       └── templates.js        # YAML template generation
└── environments/
    └── kubernetes/
        └── manifests/
            └── nifi-registry-k8s.yaml  # Kubernetes deployment manifest
```

## Features

- **Flow Versioning**: Version control for NiFi flows and process groups
- **Git Integration**: Support for external Git repositories
- **Registry API**: RESTful API for flow management
- **Web UI**: Browser-based interface for flow registry management
- **Single User Authentication**: Simple admin/admin authentication for development

## Deployment

### Prerequisites

- Kubernetes cluster with NiFi already deployed
- Docker images cached in containerd
- `kubectl` configured for cluster access

### Deploy

```bash
cd bin/
node deploy-registry.js
```

The deployment script will:
1. Check prerequisites (NiFi running, namespace exists)
2. Ensure required container images are available
3. Deploy the registry using Kubernetes manifests
4. Wait for the registry to become ready
5. Verify the deployment

### Access

- **Registry UI**: http://localhost/nifi-registry
- **Direct Access**: `kubectl port-forward -n infometis deployment/nifi-registry 18080:18080`
- **API Endpoint**: http://localhost/nifi-registry-api

### Default Credentials

- **Username**: admin
- **Password**: adminadminadmin

## Storage

The registry uses persistent storage with the following configuration:

- **Storage Class**: local-storage
- **Capacity**: 5Gi
- **Host Path**: /var/lib/k0s/nifi-registry-data
- **Database**: H2 embedded database
- **Flow Storage**: File-based flow persistence

## Configuration

The registry is configured with:

- **HTTP Port**: 18080
- **Database**: H2 file-based storage
- **Authentication**: Single user provider
- **Security**: Disabled for development use

## Integration with NiFi

The NiFi Registry integrates with NiFi to provide:

1. **Flow Versioning**: Save and version NiFi process groups
2. **Flow Deployment**: Deploy versioned flows to NiFi instances
3. **Change Tracking**: Track modifications to flows over time
4. **Collaboration**: Share flows between teams and environments

## Cleanup

To remove the NiFi Registry deployment:

```javascript
const RegistryDeployment = require('./deploy-registry.js');
const registry = new RegistryDeployment();
registry.cleanup();
```

## Development Notes

This component is part of the InfoMetis v0.5.0 composable architecture. Each component is self-contained with its own utilities and manifests, making it easy to deploy independently or as part of a larger platform.

## Support

For issues and questions related to this component, refer to the main InfoMetis documentation or the Apache NiFi Registry documentation at https://nifi.apache.org/registry.html