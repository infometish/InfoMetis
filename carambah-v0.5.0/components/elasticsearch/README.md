# Elasticsearch Component

Self-contained Elasticsearch component for InfoMetis v0.5.0 platform.

## Overview

Elasticsearch is a distributed, RESTful search and analytics engine capable of addressing a growing number of use cases. In the InfoMetis platform, Elasticsearch provides powerful search and indexing capabilities for data analytics and retrieval.

**Container Image**: `elasticsearch:8.15.0`

## Component Structure

```
elasticsearch/
├── README.md                              # This file
├── bin/                                   # Executable scripts
│   └── deploy-elasticsearch.js            # Main deployment script
├── core/                                  # Core utilities and libraries
│   ├── image-config.js                    # Container image configuration
│   ├── logger.js                          # Logging utility
│   ├── exec.js                           # Command execution utility
│   ├── docker/                           # Docker utilities
│   ├── fs/                               # File system utilities
│   └── kubectl/                          # Kubernetes utilities
└── environments/
    └── kubernetes/
        └── manifests/
            └── elasticsearch-k8s.yaml    # Kubernetes deployment manifest
```

## Features

- **Single-node Elasticsearch cluster** optimized for development and prototyping
- **Persistent storage** with 10GB volume for data persistence
- **Traefik ingress** for web access at `/elasticsearch`
- **Health checks** and readiness probes
- **Security disabled** for development ease
- **Resource limits** configured for efficient operation

## Deployment

### Prerequisites

1. k0s Kubernetes cluster running
2. InfoMetis namespace created
3. Required Docker images cached locally
4. Traefik ingress controller deployed

### Deploy Elasticsearch

```bash
cd /path/to/carambah-v0.5.0/components/elasticsearch/bin
node deploy-elasticsearch.js
```

### Access Elasticsearch

- **Web Interface**: http://localhost/elasticsearch
- **Health Check**: http://localhost/elasticsearch/_cluster/health
- **Direct Access**: `kubectl port-forward -n infometis deployment/elasticsearch 9200:9200`

## Configuration

### Elasticsearch Settings

The deployment includes the following key configurations:

- **Cluster Name**: `infometis-elasticsearch`
- **Node Name**: `elasticsearch-node-1`
- **Discovery Type**: `single-node`
- **Network Host**: `0.0.0.0`
- **HTTP Port**: `9200`
- **Transport Port**: `9300`
- **Security**: Disabled (`xpack.security.enabled: false`)
- **Monitoring**: Disabled for simplicity

### Resource Allocation

- **Memory Request**: 1Gi
- **Memory Limit**: 2Gi
- **CPU Request**: 500m
- **CPU Limit**: 1000m
- **Storage**: 10Gi persistent volume

### Java Heap Settings

- **Initial Heap**: 1GB (`-Xms1g`)
- **Maximum Heap**: 1GB (`-Xmx1g`)

## Storage

Elasticsearch data is persisted to `/var/lib/infometis/elasticsearch` on the host system through:

- **PersistentVolume**: `elasticsearch-pv` (10Gi, local-storage)
- **PersistentVolumeClaim**: `elasticsearch-pvc` (10Gi)
- **Mount Path**: `/usr/share/elasticsearch/data`

## Networking

### Service

- **Service Name**: `elasticsearch-service`
- **Type**: ClusterIP
- **HTTP Port**: 9200
- **Transport Port**: 9300

### Ingress

- **Path**: `/elasticsearch`
- **Ingress Class**: `traefik`
- **Middleware**: Strip prefix `/elasticsearch`

## Health Monitoring

### Readiness Probe

- **Endpoint**: `/_cluster/health`
- **Initial Delay**: 30 seconds
- **Period**: 30 seconds
- **Timeout**: 10 seconds

### Liveness Probe

- **Endpoint**: `/_cluster/health`
- **Initial Delay**: 60 seconds
- **Period**: 30 seconds
- **Timeout**: 10 seconds

## Integration with InfoMetis

This Elasticsearch component integrates with the InfoMetis platform to provide:

1. **Search capabilities** for indexed data
2. **Log aggregation** and analysis
3. **Real-time data indexing** from Kafka streams
4. **Analytics dashboard** data source
5. **Full-text search** across platform data

## Troubleshooting

### Common Issues

1. **Pod not starting**: Check resource availability and image pull status
2. **Storage issues**: Verify persistent volume paths and permissions
3. **Memory errors**: Adjust Java heap settings if needed
4. **Network connectivity**: Verify service and ingress configurations

### Useful Commands

```bash
# Check pod status
kubectl get pods -n infometis -l app=elasticsearch

# Check logs
kubectl logs -n infometis deployment/elasticsearch

# Check cluster health
kubectl exec -n infometis deployment/elasticsearch -- curl -s http://localhost:9200/_cluster/health

# Port forward for direct access
kubectl port-forward -n infometis deployment/elasticsearch 9200:9200
```

## Cleanup

To remove Elasticsearch from the cluster:

```javascript
const deployment = new ElasticsearchDeployment();
await deployment.cleanup();
```

Or manually:

```bash
kubectl delete -n infometis ingress/elasticsearch-ingress
kubectl delete -n infometis service/elasticsearch-service
kubectl delete -n infometis deployment/elasticsearch
kubectl delete -n infometis configmap/elasticsearch-config
kubectl delete -n infometis pvc/elasticsearch-pvc
kubectl delete pv/elasticsearch-pv
```

## Version Information

- **InfoMetis Version**: v0.5.0
- **Elasticsearch Version**: 8.15.0
- **Component Type**: Search and Analytics Engine
- **Deployment Model**: Single-node development cluster