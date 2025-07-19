# InfoMetis Quick Start Guide

**Version**: v0.1.0  
**Estimated Time**: 15-30 minutes  
**Target Audience**: New team members, evaluators, developers

## Prerequisites Checklist

Before starting, ensure you have:

### ✅ System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended) or WSL2
- **Memory**: 8GB RAM minimum (k0s + NiFi + Traefik)
- **Storage**: 15GB free space (10GB base + 5GB for containers)
- **Network**: Internet access for initial setup

### ✅ Required Tools
```bash
# Install Docker (for k0s-in-Docker)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and log back in

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installations
docker --version
kubectl version --client
```

## Quick Deployment (5 minutes)

### Step 1: Get InfoMetis v0.1.0
```bash
# Clone repository
git clone https://github.com/your-org/InfoMetis.git
cd InfoMetis

# Navigate to v0.1.0 release
cd v0.1.0
```

### Step 2: Deploy Platform
```bash
# Make scripts executable
chmod +x implementation/step-*.sh

# Run automated deployment
./implementation/step-02-create-k0s-container.sh
./implementation/step-03-wait-for-k0s-api.sh
./implementation/step-04-configure-kubectl.sh
./implementation/step-05-create-namespace.sh
./implementation/step-06-remove-master-taint.sh
./implementation/step-07-deploy-traefik.sh
./implementation/step-09-deploy-nifi.sh
```

### Step 3: Verify Deployment
```bash
# Check all pods are running
kubectl get pods --all-namespaces

# Test NiFi access
kubectl port-forward -n infometis service/nifi-service 8080:8080 &
curl -f http://localhost:8080/nifi/

# Test Traefik dashboard
kubectl port-forward -n traefik-system service/traefik 9000:8080 &
curl -f http://localhost:9000/dashboard/
```

**✅ Success Indicators**:
- All pods show `Running` status
- NiFi UI accessible at http://localhost:8080/nifi/
- Traefik dashboard accessible at http://localhost:9000/dashboard/

## Understanding the Platform

### What Just Happened?

1. **k0s Cluster**: Lightweight Kubernetes cluster running in Docker container
2. **Traefik Ingress**: Load balancer and reverse proxy for external access
3. **NiFi Service**: Data pipeline orchestration engine
4. **Storage**: Configured persistent storage for data pipelines

### Key Components Deployed

**Infrastructure Layer**:
- k0s-controller (Kubernetes control plane)
- Traefik ingress controller
- Local-path storage provisioner

**Application Layer**:
- Apache NiFi (data pipeline engine)
- NiFi service (internal networking)
- Ingress routes (external access)

### Platform Architecture
```
External Access → Traefik Ingress → NiFi Service → NiFi Pod
                      ↓
Internet/LAN ← k0s Cluster ← Storage ← Persistent Data
```

## Common Tasks

### Access NiFi UI
```bash
# Method 1: Port forward (development)
kubectl port-forward -n infometis service/nifi-service 8080:8080
# Access: http://localhost:8080/nifi/

# Method 2: Ingress (production)
# Configure /etc/hosts: 127.0.0.1 nifi.local
# Access: http://nifi.local/nifi/
```

### Monitor Platform Status
```bash
# Check all components
kubectl get pods --all-namespaces

# Check specific service
kubectl describe pod -n infometis -l app=nifi

# View logs
kubectl logs -n infometis -l app=nifi --tail=50
```

### Stop/Start Platform
```bash
# Stop platform
docker stop k0s-controller

# Start platform
docker start k0s-controller

# Wait for services to become ready
kubectl wait --for=condition=ready pod --all --all-namespaces --timeout=300s
```

## Troubleshooting Quick Fixes

### Pod Not Starting
```bash
# Check pod status and events
kubectl describe pod -n infometis -l app=nifi

# Check resource usage
kubectl top nodes
kubectl top pods --all-namespaces
```

**Common Solutions**:
- Wait longer (NiFi takes 2-3 minutes to start)
- Check available memory (need 8GB+ total)
- Restart k0s container: `docker restart k0s-controller`

### Cannot Access Services
```bash
# Verify port forwards are active
ps aux | grep kubectl

# Kill old port forwards
pkill -f "kubectl port-forward"

# Restart port forwards
kubectl port-forward -n infometis service/nifi-service 8080:8080 &
```

### Ingress Not Working
```bash
# Check Traefik status
kubectl get pods -n traefik-system

# Check ingress configuration
kubectl get ingress -n infometis

# Check Traefik logs
kubectl logs -n traefik-system -l app=traefik
```

## Next Steps

### Development Setup
1. **Configure IDE**: Set up Kubernetes plugin in your editor
2. **Learn kubectl**: Practice basic Kubernetes commands
3. **Explore NiFi**: Create your first data pipeline
4. **Read Architecture**: Understand platform design in `docs/`

### Production Deployment
1. **Review Security**: Implement authentication and TLS
2. **Configure Monitoring**: Add Prometheus and Grafana
3. **Set Up Backups**: Configure persistent data backup
4. **Scale Resources**: Adjust CPU/memory for production workloads

### Learning Resources
- **NiFi Documentation**: https://nifi.apache.org/docs/
- **k0s Documentation**: https://docs.k0sproject.io/
- **Traefik Documentation**: https://doc.traefik.io/traefik/
- **Kubernetes Basics**: https://kubernetes.io/docs/concepts/

## Advanced Topics

### Offline Deployment
```bash
# Pre-cache container images (1.6GB total)
./cache-images.sh

# Deploy from cache (air-gapped environments)
docker load < cache/images/k0s-latest.tar.gz
docker load < cache/images/traefik-latest.tar.gz
docker load < cache/images/nifi-latest.tar.gz
```

### Custom Configuration
```bash
# Modify NiFi configuration
kubectl edit configmap -n infometis nifi-config

# Adjust resource limits
kubectl edit deployment -n infometis nifi

# Update ingress routes
kubectl edit ingress -n infometis nifi-ingress
```

### Data Pipeline Development
1. **Access NiFi UI**: Use port-forward or ingress
2. **Create Process Groups**: Organize pipeline components
3. **Add Processors**: Configure data transformation logic
4. **Test Pipelines**: Use NiFi's built-in testing features
5. **Monitor Performance**: Use NiFi's monitoring dashboard

## Getting Help

### Documentation
- **Architecture**: `docs/foundations/` - Platform design principles
- **Deployment**: `v0.1.0/implementation/` - Step-by-step scripts
- **Troubleshooting**: `docs/knowledge-base/` - Common issues and solutions

### Common Pitfalls for New Users
1. **Insufficient Memory**: Ensure 8GB+ RAM available
2. **Port Conflicts**: Check for services using ports 6443, 80, 443, 8080
3. **Docker Permissions**: Ensure user is in docker group
4. **kubectl Context**: Verify kubectl is configured for k0s cluster

### Success Criteria for New Team Members
- [ ] Platform deploys successfully within 15 minutes
- [ ] Can access NiFi UI and create simple processor
- [ ] Understands basic kubectl commands
- [ ] Can troubleshoot common deployment issues
- [ ] Ready to develop data pipelines

---

*This quick start guide gets new team members productive with InfoMetis v0.1.0 in under 30 minutes. For comprehensive documentation, see the `docs/` directory.*