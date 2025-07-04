[← Back to InfoMetis Home](../README.md)

# InfoMetis Development Environment Setup

## Overview

This guide sets up the essential prerequisites for InfoMetis development, focusing on containerization and orchestration tools aligned with the project's architectural principles.

## Prerequisites Installation

### **System Requirements**
- **OS**: Ubuntu 24.04 LTS (current system)
- **Memory**: 4GB+ RAM recommended  
- **Storage**: 10GB+ free space
- **Network**: Internet access for package downloads

## Core Tools Installation

### **1. Podman Installation (Container Runtime)**

#### **Install Podman on Ubuntu 24.04**
```bash
# Update package repositories
sudo apt update

# Install Podman
sudo apt install -y podman

# Verify installation
podman --version
podman info
```

#### **Configure Podman for Rootless Operation**
```bash
# Configure subuid and subgid for current user (if not already configured)
echo "$USER:100000:65536" | sudo tee -a /etc/subuid
echo "$USER:100000:65536" | sudo tee -a /etc/subgid

# Reload systemd for user services
systemctl --user daemon-reload

# Enable and start user services
systemctl --user enable --now podman.socket
```

#### **Test Podman Installation**
```bash
# Test basic container functionality
podman run --rm hello-world

# Test rootless operation
podman run --rm -it alpine:latest echo "Podman working in rootless mode"
```

### **2. Podman Compose Installation**

#### **Install podman-compose**
```bash
# Install via pip (Python package manager)
sudo apt install -y python3-pip
pip3 install --user podman-compose

# Add to PATH if needed
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
podman-compose --version
```

#### **Alternative: Install via package manager**
```bash
# Install from Ubuntu repositories (if available)
sudo apt install -y podman-compose

# Verify installation
podman-compose --version
```

### **3. k0s Installation (Kubernetes Distribution)**

#### **Install k0s Binary**
```bash
# Download and install k0s
curl -sSLf https://get.k0s.sh | sudo sh

# Verify installation
k0s version

# Install k0s as systemd service (optional for development)
# sudo k0s install controller --single
# sudo systemctl start k0scontroller
```

#### **Basic k0s Configuration**
```bash
# Create k0s configuration directory
mkdir -p ~/.config/k0s

# Generate default configuration
k0s config create > ~/.config/k0s/k0s.yaml

# Validate configuration
k0s validate config --config ~/.config/k0s/k0s.yaml
```

## Verification and Testing

### **Container Runtime Verification**
```bash
# Test Podman functionality
echo "Testing Podman installation..."

# Basic container test
podman run --rm alpine:latest echo "✅ Podman basic functionality working"

# Volume mount test (important for NiFi data persistence)
mkdir -p /tmp/podman-test
echo "test content" > /tmp/podman-test/test.txt
podman run --rm -v /tmp/podman-test:/test:Z alpine:latest cat /test/test.txt
rm -rf /tmp/podman-test

# Network test
podman run --rm -p 8888:80 --name test-web -d nginx:alpine
sleep 3
curl -s http://localhost:8888 | grep -q "Welcome to nginx" && echo "✅ Podman networking working"
podman stop test-web

echo "Podman verification complete!"
```

### **Podman Compose Verification**
```bash
# Test podman-compose functionality
echo "Testing podman-compose installation..."

# Create temporary compose file
cat > /tmp/test-compose.yml << 'EOF'
version: '3.8'
services:
  test:
    image: alpine:latest
    command: echo "podman-compose working"
EOF

# Test compose functionality
cd /tmp
podman-compose -f test-compose.yml up
rm test-compose.yml

echo "✅ podman-compose verification complete!"
```

### **k0s Verification**
```bash
# Test k0s functionality
echo "Testing k0s installation..."

# Check k0s status
k0s version
k0s validate config --config ~/.config/k0s/k0s.yaml && echo "✅ k0s configuration valid"

echo "k0s verification complete!"
```

## InfoMetis-Specific Configuration

### **Container Registries Configuration**
```bash
# Configure container registries for InfoMetis
mkdir -p ~/.config/containers

cat > ~/.config/containers/registries.conf << 'EOF'
[registries.search]
registries = ['docker.io', 'quay.io', 'registry.fedoraproject.org']

[registries.insecure]
registries = []

[registries.block]
registries = []
EOF
```

### **Podman Storage Configuration**
```bash
# Configure storage for better performance
mkdir -p ~/.config/containers

cat > ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"
runroot = "/run/user/1000/containers"
graphroot = "/home/$USER/.local/share/containers/storage"

[storage.options]
additionalimagestores = []

[storage.options.overlay]
mountopt = "nodev,metacopy=on"
EOF
```

### **Systemd User Services Setup**
```bash
# Enable lingering for user services (allows services to start at boot)
sudo loginctl enable-linger $USER

# Create user service directory
mkdir -p ~/.config/systemd/user

# Enable podman socket for user
systemctl --user enable --now podman.socket
systemctl --user status podman.socket
```

## Environment Validation

### **Complete System Check**
```bash
#!/bin/bash
echo "=== InfoMetis Environment Validation ==="

# Check Podman
echo -n "Podman installed: "
if command -v podman >/dev/null 2>&1; then
    echo "✅ $(podman --version)"
else
    echo "❌ Not found"
fi

# Check podman-compose
echo -n "podman-compose installed: "
if command -v podman-compose >/dev/null 2>&1; then
    echo "✅ $(podman-compose --version)"
else
    echo "❌ Not found"
fi

# Check k0s
echo -n "k0s installed: "
if command -v k0s >/dev/null 2>&1; then
    echo "✅ $(k0s version)"
else
    echo "❌ Not found"
fi

# Check container functionality
echo -n "Container runtime functional: "
if podman run --rm alpine:latest echo "test" >/dev/null 2>&1; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

# Check rootless operation
echo -n "Rootless containers: "
if [ "$(podman info --format '{{.Host.Security.Rootless}}')" = "true" ]; then
    echo "✅ Enabled"
else
    echo "❌ Disabled"
fi

echo "=== Validation Complete ==="
```

## Next Steps

After successful installation:

1. **Test NiFi Deployment**: Use the prototype setup from `docs/nifi-prototype-design.md`
2. **Create InfoMetis Project Structure**: Set up development directories
3. **Initialize Git Repository**: Version control for configuration
4. **Set up Development Workflow**: Test-driven development environment

## Troubleshooting

### **Common Issues**

#### **Podman Permission Issues**
```bash
# Reset user namespace configuration
podman system reset
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER
podman system migrate
```

#### **SELinux Issues (if applicable)**
```bash
# Check SELinux status
sestatus

# Configure SELinux for containers (if enabled)
sudo setsebool -P container_manage_cgroup true
```

#### **Network Issues**
```bash
# Reset network configuration
podman system reset --force
podman network prune
```

### **Performance Optimization**
```bash
# Optimize for development workloads
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Security Considerations

### **Rootless Security Benefits**
- ✅ No root daemon required
- ✅ User namespace isolation
- ✅ Reduced attack surface
- ✅ Enterprise security compliance

### **Container Security Best Practices**
- Use official images from trusted registries
- Regularly update base images
- Scan images for vulnerabilities
- Use read-only containers where possible
- Implement proper secrets management

---

This environment setup provides the foundation for InfoMetis development with modern containerization tools aligned with the project's security and architectural principles.