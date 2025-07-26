# k0s Component

This component provides k0s Kubernetes cluster deployment functionality for the InfoMetis platform.

## Overview

k0s is a lightweight, CNCF-certified Kubernetes distribution that is purpose-built for edge, IoT, CI/CD, and any other use cases where developer experience matters. This component encapsulates all the necessary utilities and deployment scripts for creating and managing k0s clusters.

## Structure

```
k0s/
├── bin/                           # Executable deployment scripts
│   └── deploy-k0s-cluster.js     # Main k0s cluster deployment script
├── core/                         # Core utility libraries
│   └── lib/                      # Shared utilities
│       ├── logger.js             # Logging utility
│       ├── exec.js               # Process execution utility
│       ├── docker/               # Docker operations
│       ├── kubectl/              # Kubernetes utilities
│       └── fs/                   # File system utilities
├── environments/                 # Environment-specific configurations
│   └── kubernetes/              # Kubernetes manifests
└── README.md                    # This file
```

## Features

- **Automated k0s Deployment**: Complete automation of k0s cluster setup in Docker containers
- **Docker Integration**: Seamless integration with Docker for containerized k0s deployment
- **kubectl Configuration**: Automatic kubectl configuration for cluster access
- **Namespace Management**: Automated namespace creation and management
- **Prerequisite Checking**: Comprehensive validation of required tools and dependencies
- **Error Handling**: Robust error handling and logging throughout the deployment process

## Usage

### Deploy k0s Cluster

```bash
cd /path/to/carambah-v0.5.0/components/k0s/bin
node deploy-k0s-cluster.js
```

### Cleanup k0s Cluster

```bash
cd /path/to/carambah-v0.5.0/components/k0s/bin
node deploy-k0s-cluster.js cleanup
```

## Prerequisites

- Docker installed and running
- kubectl installed and available in PATH
- Node.js runtime (v14+)

## Key Components

### Main Deployment Script

**`bin/deploy-k0s-cluster.js`** - The primary deployment script that orchestrates the entire k0s cluster setup process including:

- Prerequisites validation
- k0s container creation with comprehensive configuration
- API server readiness validation
- kubectl configuration
- Namespace creation
- Cluster status reporting

### Core Utilities

**`core/lib/logger.js`** - Provides consistent logging across all operations
**`core/lib/exec.js`** - Handles shell command execution with proper error handling
**`core/lib/docker/docker.js`** - Docker operations wrapper for container management
**`core/lib/kubectl/kubectl.js`** - Kubernetes operations using kubectl
**`core/lib/fs/config.js`** - Configuration file management utilities

## Configuration

The k0s deployment uses the following default configuration:

- **Cluster Name**: `infometis`
- **Namespace**: `infometis`
- **k0s Image**: `k0sproject/k0s:latest`
- **API Server Port**: `6443`
- **HTTP Port**: `80`
- **HTTPS Port**: `443`
- **Traefik Dashboard Port**: `8080`

## Access Points

After successful deployment:

- **Kubernetes API**: `https://localhost:6443`
- **kubectl**: Use standard kubectl commands
- **Container Access**: `docker exec -it infometis k0s kubectl get nodes`

## Integration

This component is designed to work with other InfoMetis components:

- **Traefik**: For ingress and load balancing
- **Prometheus**: For monitoring and metrics
- **Grafana**: For visualization
- **Apache NiFi**: For data processing
- **Apache Kafka**: For stream processing

## Version

Extracted from InfoMetis v0.5.0 as part of the composable architecture migration.