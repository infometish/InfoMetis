# Container + Kubernetes Integration Patterns

**Based on**: InfoMetis v0.1.0 Development Experience  
**Last Updated**: July 19, 2025

## Overview

This guide documents proven integration patterns between container technologies and Kubernetes orchestration, derived from successful InfoMetis v0.1.0 implementation experience.

## Container Platform Selection

### k0s vs Traditional Kubernetes Distributions

**k0s Advantages** (Production Validated):
- **Lightweight**: Minimal resource overhead compared to full K8s distributions
- **Edge Optimized**: Designed for edge computing and IoT environments
- **Single Binary**: Simplified installation and management
- **Production Ready**: Full Kubernetes API compatibility with enterprise features

**Development Integration**:
```bash
# k0s-in-Docker for development isolation
docker run -d --name k0s-controller \
  --hostname k0s-controller \
  --privileged \
  -v /var/lib/k0s \
  -p 6443:6443 \
  k0sproject/k0s:latest
```

**Benefits Realized**:
- Clean development environment isolation
- Easy cleanup and recreation
- Production-equivalent development experience
- Consistent behavior across environments

## Container Image Management

### Offline Deployment Strategy

**Container Caching Architecture** (Tested: 1.6GB total):
```bash
# Systematic image caching for air-gapped deployment
docker pull k0sproject/k0s:latest      # 243MB
docker pull traefik:latest             # 217MB  
docker pull apache/nifi:latest         # 1.2GB
# Total: ~1.6GB for complete platform
```

**Cache Management Pattern**:
```bash
#!/bin/bash
# cache-images.sh - Automated image caching
CACHE_DIR="cache/images"
mkdir -p "$CACHE_DIR"

# Pull and save images with compression
docker pull k0sproject/k0s:latest
docker save k0sproject/k0s:latest | gzip > "$CACHE_DIR/k0s-latest.tar.gz"

# Load images on target system
docker load < "$CACHE_DIR/k0s-latest.tar.gz"
```

**Benefits Achieved**:
- Air-gapped deployment capability
- Predictable deployment package size
- Reduced network dependencies
- Faster deployment in restricted environments

## Ingress Controller Integration

### Traefik with k0s Configuration

**Production-Tested Configuration**:
```yaml
# traefik-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traefik
  namespace: traefik-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: traefik
  template:
    metadata:
      labels:
        app: traefik
    spec:
      containers:
      - name: traefik
        image: traefik:latest
        ports:
        - containerPort: 80
        - containerPort: 443
        - containerPort: 8080
```

**k0s-Specific Requirements**:
- RBAC configuration for cluster access
- Service account with proper permissions
- IngressClass configuration for routing
- ClusterRole and ClusterRoleBinding setup

**Integration Benefits**:
- Production-grade load balancing
- Automatic SSL certificate management
- Dynamic service discovery
- HTTP/HTTPS routing with middleware support

## Storage Configuration Patterns

### Persistent vs Ephemeral Storage

**Development Pattern** (Fast Iteration):
```yaml
# emptyDir volumes for rapid development
volumes:
- name: nifi-data
  emptyDir: {}
- name: nifi-logs
  emptyDir: {}
```

**Production Pattern** (Data Persistence):
```yaml
# PersistentVolumeClaim for production data
volumes:
- name: nifi-data
  persistentVolumeClaim:
    claimName: nifi-data-pvc
```

**Storage Strategy Benefits**:
- Development: Fast container restart without data persistence overhead
- Production: Full data persistence with backup capabilities
- Flexibility: Easy switching between patterns based on environment needs

## Container Orchestration Patterns

### Service Dependencies and Startup Order

**Validated Startup Sequence**:
1. **k0s Cluster Initialization** (30-60 seconds)
2. **Traefik Ingress Deployment** (Wait for k0s API)
3. **Storage Class Configuration** (After cluster ready)
4. **Application Services** (NiFi, etc.)

**Script-Based Orchestration**:
```bash
# step-03-wait-for-k0s-api.sh
wait_for_k0s_api() {
    while ! kubectl get nodes >/dev/null 2>&1; do
        echo "Waiting for k0s API..."
        sleep 5
    done
}
```

**Benefits Realized**:
- Reliable service startup ordering
- Automated dependency validation
- Clear error detection and recovery
- Consistent deployment across environments

## Network Configuration Patterns

### Internal Service Communication

**k0s Network Integration**:
```yaml
# Service discovery through Kubernetes DNS
apiVersion: v1
kind: Service
metadata:
  name: nifi-service
spec:
  selector:
    app: nifi
  ports:
  - port: 8080
    targetPort: 8080
```

**Internal Communication Benefits**:
- Automatic service discovery
- Load balancing across replicas
- Network policy support
- Secure inter-service communication

### External Access Patterns

**Traefik Ingress Configuration**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nifi-ingress
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web,websecure
spec:
  rules:
  - host: nifi.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nifi-service
            port:
              number: 8080
```

**External Access Benefits**:
- Centralized external routing
- SSL termination handling
- Host-based routing
- Middleware integration (auth, rate limiting)

## Monitoring and Observability Integration

### Container Metrics Collection

**k0s Metrics Server**:
```bash
# Enable metrics collection
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

**Application Monitoring Readiness**:
- Prometheus integration endpoints
- Grafana dashboard compatibility
- Log aggregation through standard output
- Health check endpoints for liveness/readiness probes

## Development Workflow Integration

### Script-Based Testing Pattern

**Systematic Validation Approach**:
```bash
# test-nifi-deployment.sh
test_nifi_deployment() {
    echo "Testing NiFi deployment..."
    
    # Wait for pod ready
    kubectl wait --for=condition=ready pod -l app=nifi --timeout=300s
    
    # Test service access
    kubectl port-forward service/nifi-service 8080:8080 &
    sleep 5
    
    # Validate NiFi UI access
    curl -f http://localhost:8080/nifi/ || exit 1
    
    echo "✅ NiFi deployment test passed"
}
```

**Testing Benefits**:
- Automated validation of each component
- Clear pass/fail criteria
- Integration testing across components
- Reproducible testing procedures

## Lessons Learned and Best Practices

### Successful Patterns
1. **Container-First Development**: Design with container deployment as primary target
2. **Incremental Testing**: Validate each component before integration
3. **Documentation Synchronization**: Keep deployment docs current with implementation
4. **Environment Consistency**: Use identical patterns across dev/test/prod

### Common Pitfalls Avoided
1. **Startup Dependencies**: Always validate service readiness before dependent services
2. **Storage Persistence**: Choose appropriate storage patterns for environment type
3. **Network Configuration**: Test internal and external connectivity thoroughly
4. **Resource Limits**: Set appropriate limits to prevent resource contention

### Optimization Opportunities
1. **Image Optimization**: Optimize container images for size and security
2. **Resource Tuning**: Adjust CPU/memory limits based on actual usage
3. **Network Policies**: Implement network segmentation for security
4. **Backup Strategies**: Implement automated backup for persistent data

## Next Steps for Enhancement

### Immediate Improvements
1. **Monitoring Integration**: Add comprehensive monitoring and alerting
2. **Security Hardening**: Implement network policies and security scanning
3. **Performance Optimization**: Establish performance baselines and tuning

### Advanced Integration
1. **Service Mesh**: Consider Istio integration for advanced networking
2. **GitOps**: Implement ArgoCD for declarative deployment management
3. **Multi-Tenant**: Add namespace isolation and resource quotas

---

*This integration guide captures proven patterns from InfoMetis v0.1.0 development and provides a foundation for reliable container + Kubernetes deployments.*