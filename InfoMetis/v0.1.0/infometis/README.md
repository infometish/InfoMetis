# InfoMetis Platform

WSL-based InfoMetis NiFi development platform with Collaborative AI pipeline creation automation.

## Version 0.1.0

Core Components:
- NiFi deployment on WSL using kind (Kubernetes in Docker)
- Traefik ingress for UI access
- Simple collaborative AI pipeline creation support
- Complete user documentation
- Zero-install architecture

## Quick Start

```bash
# Setup kind cluster
./scripts/setup/setup-cluster.sh

# Deploy NiFi
./scripts/setup/setup-nifi.sh

# Setup ingress
./scripts/setup/setup-traefik.sh

# Test deployment
./scripts/test/test-cluster-setup.sh
```

## Directory Structure

- `deploy/` - Deployment configurations
  - `kubernetes/` - Kubernetes manifests
  - `kind/` - Kind cluster configurations
- `scripts/` - Executable scripts
  - `setup/` - Installation scripts
  - `deploy/` - Deployment scripts
  - `test/` - Test scripts
- `cai/` - Collaborative AI components