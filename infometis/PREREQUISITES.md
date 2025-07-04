# InfoMetis Prerequisites

This document lists all software and system requirements needed to deploy InfoMetis successfully.

## System Requirements

### Hardware
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk Space**: Minimum 10GB free space
- **CPU**: 2+ cores recommended

### Operating System
- **Linux**: Ubuntu 18.04+, Debian 10+, or compatible distribution
- **WSL2**: Windows 10/11 with WSL2 enabled (recommended for Windows users)
- **macOS**: macOS 10.14+ (Intel or Apple Silicon)

## Required Software

### 1. Docker
**Purpose**: Container runtime for Kubernetes and application deployment

**Installation**:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect

# Verify installation
docker --version
docker run hello-world
```

**WSL2 Specific**:
- Install Docker Desktop for Windows
- Enable WSL2 integration in Docker Desktop settings
- Ensure Docker Desktop is running

### 2. kubectl
**Purpose**: Kubernetes command-line tool for cluster management

**Installation**:
```bash
# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
# Or install to user directory: mkdir -p ~/.local/bin && mv kubectl ~/.local/bin/

# macOS with Homebrew
brew install kubectl

# Verify installation
kubectl version --client
```

### 3. kind (Kubernetes in Docker)
**Purpose**: Local Kubernetes cluster creation

**Installation**:
```bash
# Linux/macOS
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
# Or install to user directory: mkdir -p ~/.local/bin && mv ./kind ~/.local/bin/

# With Go (alternative)
go install sigs.k8s.io/kind@v0.20.0

# Verify installation
kind version
```

## Port Requirements

The following ports must be available on your system:

- **8080**: Traefik HTTP ingress
- **8443**: Traefik HTTPS ingress  
- **9090**: Direct NiFi UI access (optional)

**Check port availability**:
```bash
netstat -ln | grep -E ":(8080|8443|9090) "
# Should return no results if ports are free
```

**Free occupied ports** (if needed):
```bash
# Find processes using ports
sudo lsof -i :8080
sudo lsof -i :8443
sudo lsof -i :9090

# Stop processes (replace PID with actual process ID)
sudo kill <PID>
```

## Environment Verification

Before deploying InfoMetis, run the environment check:

```bash
./scripts/test/test-fresh-environment.sh
```

This script verifies:
- All required software is installed
- Docker daemon is running
- Required ports are available
- No conflicting Docker networks exist
- No existing kind clusters

## Troubleshooting

### Docker Issues
```bash
# Start Docker service (Linux)
sudo systemctl start docker
sudo systemctl enable docker

# Check Docker daemon status
sudo systemctl status docker

# WSL2: Ensure Docker Desktop is running
# Windows: Start Docker Desktop application
```

### Permission Issues
```bash
# Add user to docker group (requires logout/login)
sudo usermod -aG docker $USER

# Temporary fix (single session)
sudo chmod 666 /var/run/docker.sock
```

### WSL2 Specific Issues
```bash
# Enable WSL2 features (run in PowerShell as Administrator)
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Set WSL2 as default
wsl --set-default-version 2

# Install WSL2 kernel update
# Download from: https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi
```

### Network Issues
```bash
# Clean up conflicting Docker networks
docker network prune -f

# Reset Docker network settings
sudo systemctl restart docker
```

## Security Considerations

- Ensure Docker daemon is properly secured
- Keep all software components updated
- Review firewall settings for required ports
- Use non-root user for Docker operations
- Regularly update InfoMetis components

## Quick Start Verification

After installing all prerequisites:

1. **Test environment**: `./scripts/test/test-fresh-environment.sh`
2. **Setup cluster**: `./scripts/setup/setup-cluster.sh`
3. **Verify deployment**: `kubectl get nodes` and `kubectl get namespaces`

## Support

For installation issues:
- Check the troubleshooting section above
- Review Docker documentation: https://docs.docker.com/
- Review Kubernetes documentation: https://kubernetes.io/docs/
- Review kind documentation: https://kind.sigs.k8s.io/

---

**Note**: This prerequisites guide is designed for end-users deploying InfoMetis without AI assistance. Ensure all steps are completed before proceeding with the InfoMetis deployment.