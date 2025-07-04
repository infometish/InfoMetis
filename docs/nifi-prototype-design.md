[← Back to InfoMetis Home](../README.md)

# NiFi Kubernetes Deployment Guide

## Overview

This guide provides the current approach for deploying NiFi on WSL using Kubernetes (kind) in Docker. This method has been tested and validated through multiple iterations.

## Current Deployment Strategy

### **Kubernetes with kind (Recommended)**

Kubernetes in Docker (kind) provides the most reliable deployment method for WSL environments while maintaining full Kubernetes compatibility.

#### **Setup Commands**
```bash
# Install kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create InfoMetis cluster
kind create cluster --name infometis

# Deploy NiFi
kubectl apply -f nifi-k8s.yaml

# Check deployment
kubectl get pods -n infometis
```

#### **Access Options**
1. **Internal Access**: HTTP within cluster
2. **NodePort**: External access via node ports
3. **Traefik Ingress**: Production-ready routing with hostname

## Deployment Configuration

### **NiFi Kubernetes YAML**
Use the existing `nifi-k8s.yaml` configuration which includes:
- NiFi deployment with persistent volumes
- Service configuration for access
- Namespace isolation
- Resource limits and requests

### **Sample Data Structure**
```
data/
├── input/
│   └── sample_data.csv
└── output/
    └── (processed files)
```

## Automation System

The repository includes a complete automation system in `nifi-automation/` with:
- **Pipeline Creation**: REST API automation scripts
- **Monitoring**: Dashboard and health checks
- **Templates**: Reusable pipeline configurations
- **Conversational Interface**: Natural language pipeline creation

## Quick Start

### **1. Deploy NiFi**
```bash
# Create cluster and deploy
kind create cluster --name infometis
kubectl apply -f nifi-k8s.yaml

# Wait for readiness
kubectl wait --for=condition=ready pod -l app=nifi -n infometis --timeout=300s
```

### **2. Access NiFi**
```bash
# Port forward to access UI
kubectl port-forward service/nifi 8443:8443 -n infometis

# Access at: https://localhost:8443/nifi
# Username: admin
# Password: (retrieve from deployment)
```

### **3. Create Pipeline**
Use the automation scripts in `nifi-automation/scripts/` or create manually through the NiFi UI.

## Architecture Benefits

### **Kubernetes Advantages**
- **Production Alignment**: Same deployment method as production
- **Scalability**: Built-in scaling and resource management
- **Networking**: Native service discovery and load balancing
- **Storage**: Persistent volume management
- **Observability**: Built-in monitoring and logging

### **kind Advantages for Development**
- **WSL Compatible**: No Unix socket issues
- **Fast Setup**: Single command cluster creation
- **Full Kubernetes API**: Complete feature parity
- **Easy Cleanup**: `kind delete cluster --name infometis`

## Next Steps

### **Current Session Goals**
1. **Test existing deployment** on current environment
2. **Validate automation scripts** work with deployed instance
3. **Create sample pipeline** using automation or UI
4. **Document any environment-specific requirements**

### **Future Enhancements**
- **Registry Integration**: Version control for pipelines
- **Multi-Component Platform**: Kafka, Elasticsearch, Grafana
- **Production Deployment**: Full platform with monitoring

---

This approach provides a clean, tested path for NiFi development on WSL while maintaining production compatibility and enabling advanced automation capabilities.