# Repository Todo List

## Current Status - NiFi Kubernetes Deployment Ready

### ✅ Completed Development

#### Core NiFi System (Complete)
- **NiFi Kubernetes Deployment**: Working deployment with kind/k0s options
- **Pipeline Automation**: Complete REST API automation system
- **Connectivity Testing**: Validated internal, NodePort, and Traefik access
- **Platform Architecture**: Comprehensive multi-component design
- **Registry Integration**: Version control and Git backup planning

#### Automation Framework (Complete)
- **Scripts**: Complete automation suite in `nifi-automation/scripts/`
- **Templates**: Reusable pipeline configurations
- **Monitoring**: Operational dashboard capabilities
- **Documentation**: Comprehensive guides and examples

### 🔄 Current Session Goals

#### 1. Documentation Cleanup (In Progress)
- **Remove outdated content**: WSL-specific workarounds no longer needed
- **Consolidate approach**: Focus on current k0s/kind deployment strategy
- **Update guides**: Reflect working automation system

#### 2. Validate Current System (Pending)
- **Test deployment**: Verify current setup works
- **Automation validation**: Test pipeline creation scripts
- **Documentation updates**: Ensure accuracy with current state

#### 3. Container Image Caching (Pending - Requires Bandwidth)
- **Create cache-images.sh**: Download and save all container images to local tar files
- **Enhance setup-cluster.sh**: Add `--cached` flag to pre-load images into kind cluster
- **Test workflow**: Verify Issues #4-6 work with cached images (NiFi, Traefik, nginx-ingress)
- **Benefits**: Fast cluster startup, no bandwidth usage after initial cache, clean test environment

### 🎯 Deployment Strategy

#### **Linux Systems**: k0s Direct
- Native performance and full feature set
- No Unix socket issues
- Production-ready deployment

#### **WSL Systems**: kind (Kubernetes in Docker)
- Avoids WSL Unix socket limitations
- Full Kubernetes compatibility
- Easy cleanup and management

#### **Alternative Option**: k0s-in-Docker
- **Lighter Alternative**: Single container vs kind's multi-container architecture
- **Official Images**: `docker.io/k0sproject/k0s:latest`
- **Simple Setup**: `docker run -d --name k0s --hostname k0s --privileged -v /var/lib/k0s -p 6443:6443 k0sproject/k0s:latest`
- **Benefits**: Smaller footprint, faster startup, easier caching
- **Multi-Node Support**: Can create real multi-node clusters with Docker
  - **Docker Compose**: Define controller + multiple workers in compose file
  - **Manual Setup**: Create Docker network, run controller, generate tokens, add workers
  - **Production-like**: Better mimics real clusters than kind's single-host simulation
  - **Example**: `docker exec k0s-controller k0s token create --role=worker > worker.token`
- **Consideration**: May be better suited for InfoMetis development/testing than kind
- **Decision**: To be evaluated against kind for specific InfoMetis use cases

### 📂 Key Components

#### **Deployment**
- `nifi-k8s.yaml` - Kubernetes deployment configuration
- `docker-compose.yml` - Container deployment alternative
- `data/` - Sample data structure

#### **Automation**
- `nifi-automation/` - Complete automation framework
- `docs/nifi-*` - Comprehensive documentation
- Working REST API integration

#### **Documentation**
- Updated deployment guides
- Automation system documentation
- Registry integration planning

---

*This file maintains persistent todo items and discussion topics across development sessions.*

---

[← Back to Project Home](../../README.md)