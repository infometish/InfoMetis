# InfoMetis v0.2.0: NiFi Registry with Git Integration

WSL-based InfoMetis NiFi development platform with NiFi Registry deployment and Git-based flow version control.

## 🚀 Quick Start

```bash
# 1. Deploy v0.1.0 foundation (k0s + Traefik + NiFi)
./implementation/D1-deploy-v0.1.0-foundation.sh
./implementation/D2-deploy-v0.1.0-infometis.sh

# 2. Verify foundation deployment
./implementation/D3-verify-v0.1.0-foundation.sh

# 3. Deploy NiFi Registry
./implementation/I1-deploy-registry.sh

# 4. Configure Git integration
./implementation/I2-configure-git-integration.sh

# 5. Configure Registry-NiFi integration
./implementation/I3-configure-registry-nifi.sh
```

## 🎯 Features

### v0.2.0 Registry Features
- **NiFi Registry Deployment**: Persistent storage with Kubernetes StatefulSet
- **Git Flow Persistence**: Automatic Git version control for NiFi flows
- **Registry-NiFi Integration**: Flow version control client configured in NiFi
- **Traefik Routing**: Registry UI accessible at `http://localhost/nifi-registry`
- **Centralized Image Management**: Consistent container image versioning

### Foundation (v0.1.0)
- k0s Kubernetes cluster in Docker container
- Traefik ingress controller with dashboard
- NiFi deployment with persistent storage
- Offline deployment with cached container images

## 🌐 Access Points

- **NiFi UI**: `http://localhost/nifi`
- **Registry UI**: `http://localhost/nifi-registry`
- **Traefik Dashboard**: `http://localhost:8082`

## 📁 Structure

```
v0.2.0/
├── implementation/           # Deployment scripts
│   ├── D1-deploy-v0.1.0-foundation.sh    # k0s + Traefik
│   ├── D2-deploy-v0.1.0-infometis.sh     # NiFi deployment  
│   ├── D3-verify-v0.1.0-foundation.sh    # Foundation verification
│   ├── I1-deploy-registry.sh             # NiFi Registry deployment
│   ├── I2-configure-git-integration.sh   # Git flow persistence
│   ├── I3-configure-registry-nifi.sh     # Registry-NiFi integration
│   ├── setup-git-integration.sh          # External Git repository setup
│   └── test-git-integration.sh           # Git integration testing
├── config/                   # Centralized configuration
│   └── image-config.env     # Container image versions
├── v0.1.0-scripts/          # Image caching and utilities
└── console.js               # Interactive deployment console
```

## 🔧 Configuration

### Image Versions
All container images centrally managed in `config/image-config.env`:
```bash
K0S_IMAGE="k0sproject/k0s:v1.29.1-k0s.0"
TRAEFIK_IMAGE="traefik:v2.9"
NIFI_IMAGE="apache/nifi:1.23.2"
NIFI_REGISTRY_IMAGE="apache/nifi-registry:1.23.2"
IMAGE_PULL_POLICY="Never"  # For offline deployment
```

## 📝 Flow Version Control Workflow

1. **Create Flow in NiFi**:
   - Design data flow in NiFi UI
   - Right-click Process Group → "Version" → "Start version control"

2. **Connect to Registry**:
   - Select "InfoMetis Registry" 
   - Choose "InfoMetis Flows" bucket
   - Enter flow name and version description

3. **Automatic Git Operations**:
   - Flow saved → Registry creates Git commit
   - Version history maintained automatically
   - Local Git repository in Registry container

4. **External Git Integration** (Optional):
   ```bash
   ./setup-git-integration.sh https://github.com/user/nifi-flows.git
   ```

## 🧪 Testing & Verification

### Foundation Tests
```bash
./implementation/D3-verify-v0.1.0-foundation.sh
```
**Tests**: Cluster, Traefik, NiFi, Storage, Networking

### Git Integration Tests  
```bash
./implementation/test-git-integration.sh
```
**Tests**: Git persistence, Registry API, Flow storage

## 🔍 Troubleshooting

### Common Commands
```bash
# Check all deployments
kubectl get pods -A

# View NiFi logs
kubectl logs -n infometis statefulset/nifi

# View Registry logs  
kubectl logs -n infometis deployment/nifi-registry

# Check storage
kubectl get pv,pvc -n infometis

# Restart services
kubectl rollout restart deployment/nifi-registry -n infometis
kubectl rollout restart statefulset/nifi -n infometis
```

### Access Issues
- **Registry redirects to NiFi**: Fixed in v0.2.0 with proper Traefik routing
- **Images not found**: Run `./v0.1.0-scripts/cache-images.sh` to cache images
- **Pods stuck pending**: Check Docker resources and storage availability

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Traefik      │    │    NiFi      │    │ NiFi Registry   │
│   (Ingress)    │───▶│   (Main)     │◄──▶│ (Git Persist)   │
│   Port 80      │    │   Port 8080  │    │   Port 18080    │
└─────────────────┘    └──────────────┘    └─────────────────┘
        │                       │                     │
        └───────────────────────┼─────────────────────┘
                                │
                    ┌──────────────────┐
                    │  k0s Kubernetes  │
                    │   (in Docker)    │
                    └──────────────────┘
```

## ✅ Completed Features (v0.2.0)

- [x] NiFi Registry deployment with persistent storage
- [x] Git flow persistence provider configuration  
- [x] Registry-NiFi integration for flow version control
- [x] Traefik routing fix for Registry UI access
- [x] Centralized container image configuration
- [x] External Git repository connection support
- [x] Comprehensive testing and verification scripts

## 🚧 Future Enhancements

- Remote Git repository integration (foundation ready)
- CI/CD pipeline integration for flows
- Multi-environment deployment support
- Enhanced security and authentication
- Flow deployment automation

---

**Built on InfoMetis v0.1.0 foundation** | **Kubernetes + Docker + WSL** | **Offline-first Design**