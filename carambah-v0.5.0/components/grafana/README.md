# Grafana Component

This is the Grafana component for the InfoMetis platform, extracted from the v0.5.0 release.

## Overview

Grafana provides powerful visualization and monitoring capabilities for the InfoMetis analytics platform. This component uses **grafana/grafana:10.2.0** and is preconfigured with Elasticsearch as the default datasource.

## Component Structure

```
grafana/
├── README.md                          # This file
├── bin/
│   └── deploy-grafana.js             # Deployment script
├── core/                             # Shared utilities
│   ├── logger.js                     # Logging utility
│   ├── exec.js                       # Command execution utility
│   ├── image-config.js               # Container image configuration
│   ├── docker/
│   │   └── docker.js                 # Docker integration
│   ├── fs/
│   │   └── config.js                 # File system configuration utilities
│   └── kubectl/
│       ├── kubectl.js                # Kubernetes CLI integration
│       └── templates.js              # Kubernetes manifest templates
└── environments/
    └── kubernetes/
        └── manifests/
            └── grafana-k8s.yaml      # Kubernetes deployment manifest
```

## Features

- **Visualization Platform**: Web-based analytics and monitoring dashboards
- **Elasticsearch Integration**: Pre-configured datasource for log analytics
- **Persistent Storage**: 5GB persistent volume for dashboard and configuration storage
- **Authentication**: Default admin credentials (admin/infometis2024)
- **Traefik Integration**: Ingress configuration for web access
- **Health Monitoring**: Built-in readiness and liveness probes

## Configuration

### Default Settings
- **Port**: 3000
- **Web UI Path**: `/grafana`
- **Admin User**: admin
- **Admin Password**: infometis2024
- **Storage**: 5GB persistent volume
- **Elasticsearch URL**: http://elasticsearch-service:9200

### Resource Limits
- **Memory**: 256Mi request, 512Mi limit
- **CPU**: 200m request, 500m limit

## Deployment

Deploy Grafana using the included deployment script:

```bash
cd bin
node deploy-grafana.js
```

### Prerequisites
- k0s cluster running
- InfoMetis namespace created
- Elasticsearch service available
- Required container images in containerd

### Access

Once deployed, Grafana is accessible via:
- **Web UI**: http://localhost/grafana
- **Direct Access**: `kubectl port-forward -n infometis deployment/grafana 3000:3000`
- **Health Check**: http://localhost/grafana/api/health

## Dependencies

This component depends on:
- **Elasticsearch**: For data source and log analytics
- **Traefik**: For ingress and routing
- **Local Storage**: For persistent data storage

## Container Images

- **Primary**: grafana/grafana:10.2.0
- **Init Container**: busybox:1.35 (for permission fixes)

## Storage

Grafana uses a persistent volume mounted at `/var/lib/grafana` with:
- **Capacity**: 5GB
- **Access Mode**: ReadWriteOnce
- **Storage Class**: local-storage
- **Host Path**: /var/lib/infometis/grafana

## Security

- Default admin credentials are configured
- Anonymous access is disabled
- Runs with non-root user (UID 472)
- Init container fixes file permissions

## Monitoring

Grafana includes built-in health checks:
- **Readiness Probe**: /api/health endpoint with 30s initial delay
- **Liveness Probe**: /api/health endpoint with 60s initial delay
- **Resource Monitoring**: Memory and CPU usage tracking