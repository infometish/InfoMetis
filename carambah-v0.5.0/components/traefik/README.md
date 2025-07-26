# Traefik Component

## Overview

This is the Traefik ingress controller component for InfoMetis, providing HTTP/HTTPS routing and load balancing capabilities for the Kubernetes cluster.

## Version

- **Traefik Version**: v2.9
- **Container Image**: `traefik:v2.9`

## Component Structure

```
traefik/
├── README.md                          # This file
├── bin/                              # Deployment scripts
│   └── deploy-traefik.js            # Main deployment script
├── core/                            # Core utilities and configuration
│   ├── docker/                      # Docker utilities
│   ├── fs/                         # Filesystem utilities
│   ├── kubectl/                    # Kubernetes utilities
│   ├── exec.js                     # Command execution utility
│   ├── logger.js                   # Logging utility
│   └── image-config.js             # Container image configuration
└── environments/
    └── kubernetes/
        └── manifests/              # Kubernetes manifests
            ├── traefik-deployment.yaml    # Main Traefik deployment
            └── traefik-mesh.yaml         # Traefik Mesh controller
```

## Features

### Main Traefik Controller (traefik-deployment.yaml)
- **Service Account**: `traefik-ingress-controller` with appropriate RBAC permissions
- **Deployment**: Single replica Traefik controller in `kube-system` namespace
- **Service**: ClusterIP service exposing HTTP (80), HTTPS (443), Flink (8083), and admin (8082) ports
- **IngressClass**: `traefik` for routing configuration
- **Dashboard**: Accessible on port 8082 with insecure mode enabled
- **Host Network**: Enabled for direct access to cluster networking

### Traefik Mesh Controller (traefik-mesh.yaml)
- **Service Mesh**: Advanced networking capabilities with Traefik Mesh v1.4
- **Namespace**: Dedicated `traefik-mesh` namespace
- **TLS**: ACME certificate management for secure communication
- **Storage**: Persistent volume for certificate storage

## Configuration

### Entry Points
- **web**: HTTP traffic on port 80
- **websecure**: HTTPS traffic on port 443  
- **flink**: Apache Flink UI on port 8083
- **traefik**: Dashboard and API on port 8082

### Providers
- **Kubernetes Ingress**: Standard Kubernetes ingress resources
- **Kubernetes CRD**: Traefik-specific custom resources

## Deployment

### Prerequisites
- k0s Kubernetes cluster running
- kubectl configured and accessible
- Required container images cached in k0s containerd

### Deploy Traefik Controller

```bash
# Deploy using the JavaScript deployment script
cd bin/
node deploy-traefik.js

# Or apply manifests directly
kubectl apply -f environments/kubernetes/manifests/traefik-deployment.yaml
```

### Deploy Traefik Mesh (Optional)

```bash
# Apply Traefik Mesh manifest
kubectl apply -f environments/kubernetes/manifests/traefik-mesh.yaml
```

## Access

### Traefik Dashboard
- **URL**: http://localhost:8082/dashboard/
- **API**: http://localhost:8082/api/overview
- **Health Check**: `curl -I http://localhost:8082`

### Traffic Entry Points
- **HTTP**: http://localhost:80
- **HTTPS**: https://localhost:443
- **Flink**: http://localhost:8083

## Dependencies

### Container Images
- `traefik:v2.9` - Main Traefik controller
- `traefik/mesh:v1.4` - Traefik Mesh controller (optional)

### System Components
- k0s Kubernetes cluster
- kube-system namespace
- RBAC permissions for ingress management

## Troubleshooting

### Common Issues

1. **Pod not starting**: Check if required images are available in k0s containerd
2. **Dashboard not accessible**: Verify hostNetwork configuration and port binding
3. **Ingress not working**: Check IngressClass and ingress resource configuration

### Useful Commands

```bash
# Check Traefik deployment status
kubectl get deployment traefik -n kube-system

# Check Traefik pods
kubectl get pods -n kube-system -l app=traefik

# View Traefik logs
kubectl logs -n kube-system -l app=traefik

# Check Traefik service
kubectl get service traefik -n kube-system

# Test dashboard connectivity
curl -I http://localhost:8082
```

## Integration

This Traefik component integrates with other InfoMetis components:

- **Apache Flink**: Routes Flink UI traffic through port 8083
- **Apache NiFi**: Handles ingress routing for NiFi web interface
- **Kafka UI**: Provides web access to Kafka management interfaces
- **Grafana**: Routes monitoring dashboard traffic
- **Prometheus**: Handles metrics collection endpoint routing

## Notes

- Uses `imagePullPolicy: Never` for cached image deployment
- Configured with `hostNetwork: true` for direct cluster access
- Tolerates master node scheduling for single-node deployments
- Supports both standard Kubernetes ingress and Traefik CRDs