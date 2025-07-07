[← Back to InfoMetis Home](../README.md)

# Bootstrap Strategy: Self-Extracting SPlectrum Deployment

## Overview

This document outlines the complete bootstrap strategy for bringing InfoMetis + SPlectrum to life from ground zero using SPlectrum's self-extracting zip distribution. This approach provides a completely self-contained deployment that requires no external dependencies or repository access.

## Bootstrap Philosophy

### Self-Contained Deployment
- **Single Artifact**: Everything needed in one self-extracting zip
- **Zero Dependencies**: No git, no package managers, no external downloads
- **Immediate Execution**: Extract and run, no configuration required
- **Offline Capable**: Works in air-gapped environments
- **Version Controlled**: Each zip contains specific, tested versions

### Progressive Validation Strategy
Build and validate each layer before adding complexity:
1. **Native SPlectrum** → Validate core functionality
2. **Containerized SPlectrum** → Prove containerization works  
3. **Kubernetes SPlectrum** → Prove orchestration works
4. **API-enabled SPlectrum** → Prove service integration works
5. **Full InfoMetis Ecosystem** → Add NiFi, monitoring, complete platform

## Self-Extracting Zip Architecture

### SPlectrum Distribution Structure
```
SPlectrum.exe  (or SPlectrum.zip)
├── spl                    # SPlectrum executable
├── modules/               # Core SPlectrum modules
│   ├── spl/              # Main module system
│   └── tools/            # 7zip, git integration
├── bootstrap/            # Bootstrap automation
│   ├── validate.sh       # Validation scripts
│   ├── containerize.sh   # Container building
│   └── deploy.sh         # Kubernetes deployment
├── containers/           # Container definitions
│   ├── Dockerfile.minimal
│   ├── Dockerfile.api
│   └── docker-compose.yml
├── k8s/                  # Kubernetes manifests
│   ├── kind-cluster.yaml
│   ├── splectrum-deploy.yaml
│   └── infometis-platform.yaml
└── docs/                 # Bootstrap documentation
    ├── quick-start.md
    ├── troubleshooting.md
    └── next-steps.md
```

## Bootstrap Sequence

### Step 0: Environment Prerequisites
```bash
# Minimal requirements check
docker --version    # Container runtime
kind --version      # Local Kubernetes (or kubectl for real cluster)
7z --version        # Archive handling (or built-in unzip)
```

### Step 1: SPlectrum Self-Extraction
```bash
# Method 1: Self-extracting executable (Windows/Linux)
./SPlectrum.exe
# or
./SPlectrum

# Method 2: Manual extraction (any platform)
7z x SPlectrum.7z
# or
unzip SPlectrum.zip

# Method 3: SPlectrum self-extraction (if available)
./spl bootstrap extract
```

### Step 2: Native Validation
```bash
# Navigate to extracted directory
cd SPlectrum/

# Validate SPlectrum core functionality
./bootstrap/validate.sh

# Or manual validation:
./spl help
./spl console log "Bootstrap validation started"
./spl data write test.txt "Hello SPlectrum"
./spl data read test.txt
```

Expected output:
```
✓ SPlectrum executable found
✓ Modules loaded successfully
✓ Basic commands working
✓ File operations functional
✓ Ready for containerization
```

### Step 3: Container Bootstrap
```bash
# Automated containerization
./bootstrap/containerize.sh

# Or manual steps:
docker build -f containers/Dockerfile.minimal -t splectrum-bootstrap .
docker run splectrum-bootstrap spl help
```

#### Minimal Container Configuration
```dockerfile
# containers/Dockerfile.minimal
FROM alpine:latest

# Install minimal dependencies
RUN apk add --no-cache nodejs bash

# Copy SPlectrum from self-extracted archive
COPY spl /usr/local/bin/spl
COPY modules/ /spl/modules/

# Set permissions and environment
RUN chmod +x /usr/local/bin/spl
ENV PATH="/usr/local/bin:$PATH"
WORKDIR /spl

# Create working directories
RUN mkdir -p data runtime/sessions

# Validate installation
RUN spl help

# Default to interactive shell for development
CMD ["/bin/bash"]
```

### Step 4: Kubernetes Deployment
```bash
# Automated deployment
./bootstrap/deploy.sh

# Or manual steps:
kind create cluster --config k8s/kind-cluster.yaml --name infometis-bootstrap
kind load docker-image splectrum-bootstrap:latest --name infometis-bootstrap
kubectl apply -f k8s/splectrum-deploy.yaml
```

#### Basic Deployment Manifest
```yaml
# k8s/splectrum-deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: splectrum-bootstrap
  labels:
    app: splectrum
    phase: bootstrap
spec:
  replicas: 1
  selector:
    matchLabels:
      app: splectrum
  template:
    metadata:
      labels:
        app: splectrum
    spec:
      containers:
      - name: splectrum
        image: splectrum-bootstrap:latest
        command: ["sleep", "infinity"]
        env:
        - name: SPL_ENVIRONMENT
          value: "kubernetes-bootstrap"
        volumeMounts:
        - name: spl-data
          mountPath: /spl/data
        - name: spl-runtime
          mountPath: /spl/runtime
      volumes:
      - name: spl-data
        emptyDir: {}
      - name: spl-runtime
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: splectrum-service
spec:
  selector:
    app: splectrum
  ports:
  - port: 8080
    targetPort: 8080
    name: api
  type: ClusterIP
```

### Step 5: Integration Validation
```bash
# Test SPlectrum in Kubernetes
kubectl exec -it deployment/splectrum-bootstrap -- spl help
kubectl exec -it deployment/splectrum-bootstrap -- spl console log "Running in Kubernetes"

# Test persistent operations
kubectl exec -it deployment/splectrum-bootstrap -- spl data write k8s-test.txt "Kubernetes integration working"
kubectl exec -it deployment/splectrum-bootstrap -- spl data read k8s-test.txt
```

## Bootstrap Automation Scripts

### Master Bootstrap Script
```bash
#!/bin/bash
# bootstrap/bootstrap.sh - Complete bootstrap automation

set -e  # Exit on any error

echo "🚀 InfoMetis + SPlectrum Bootstrap Starting..."

# Step 1: Validate environment
echo "📋 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required"; exit 1; }
command -v kind >/dev/null 2>&1 || { echo "❌ Kind required"; exit 1; }
echo "✅ Prerequisites satisfied"

# Step 2: Validate SPlectrum
echo "🔍 Validating SPlectrum..."
./bootstrap/validate.sh || { echo "❌ SPlectrum validation failed"; exit 1; }
echo "✅ SPlectrum validated"

# Step 3: Build container
echo "🐳 Building SPlectrum container..."
./bootstrap/containerize.sh || { echo "❌ Container build failed"; exit 1; }
echo "✅ Container built"

# Step 4: Deploy to Kubernetes
echo "☸️  Deploying to Kubernetes..."
./bootstrap/deploy.sh || { echo "❌ Kubernetes deployment failed"; exit 1; }
echo "✅ Kubernetes deployment complete"

# Step 5: Final validation
echo "🧪 Running integration tests..."
./bootstrap/test-integration.sh || { echo "❌ Integration tests failed"; exit 1; }
echo "✅ Integration tests passed"

echo "🎉 Bootstrap complete! InfoMetis + SPlectrum ready for development."
echo ""
echo "Next steps:"
echo "  kubectl exec -it deployment/splectrum-bootstrap -- /bin/bash"
echo "  # Try: spl help, spl console log 'Hello InfoMetis!'"
```

### Validation Script
```bash
#!/bin/bash
# bootstrap/validate.sh - SPlectrum functionality validation

echo "Validating SPlectrum installation..."

# Test 1: Executable exists and is executable
if [[ ! -x "./spl" ]]; then
    echo "❌ SPlectrum executable not found or not executable"
    exit 1
fi
echo "✅ SPlectrum executable found"

# Test 2: Basic help command
if ! ./spl help >/dev/null 2>&1; then
    echo "❌ SPlectrum help command failed"
    exit 1
fi
echo "✅ Help command working"

# Test 3: Module loading
if ! ./spl console log "Validation test" >/dev/null 2>&1; then
    echo "❌ Console module not working"
    exit 1
fi
echo "✅ Console module working"

# Test 4: File operations
TEST_FILE="/tmp/spl-validation-test.txt"
TEST_CONTENT="Bootstrap validation test $(date)"

if ! ./spl data write "$TEST_FILE" "$TEST_CONTENT" >/dev/null 2>&1; then
    echo "❌ Data write operation failed"
    exit 1
fi

RESULT=$(./spl data read "$TEST_FILE" 2>/dev/null)
if [[ "$RESULT" != "$TEST_CONTENT" ]]; then
    echo "❌ Data read operation failed"
    exit 1
fi

rm -f "$TEST_FILE"
echo "✅ File operations working"

# Test 5: Available modules
MODULES=$(./spl help 2>/dev/null | grep -c "app\|data\|console" || true)
if [[ $MODULES -lt 3 ]]; then
    echo "❌ Core modules not available"
    exit 1
fi
echo "✅ Core modules available"

echo "🎉 SPlectrum validation complete - ready for containerization"
```

### Containerization Script
```bash
#!/bin/bash
# bootstrap/containerize.sh - Container building automation

set -e

echo "Building SPlectrum containers..."

# Build minimal container
echo "📦 Building minimal SPlectrum container..."
docker build -f containers/Dockerfile.minimal -t splectrum-bootstrap:latest .
echo "✅ Minimal container built"

# Test container
echo "🧪 Testing container functionality..."
if ! docker run --rm splectrum-bootstrap:latest spl help >/dev/null 2>&1; then
    echo "❌ Container test failed"
    exit 1
fi
echo "✅ Container test passed"

# Build API container (if Dockerfile exists)
if [[ -f "containers/Dockerfile.api" ]]; then
    echo "📦 Building API container..."
    docker build -f containers/Dockerfile.api -t splectrum-api:latest .
    echo "✅ API container built"
fi

echo "🎉 Containerization complete"
```

### Deployment Script
```bash
#!/bin/bash
# bootstrap/deploy.sh - Kubernetes deployment automation

set -e

CLUSTER_NAME="infometis-bootstrap"

echo "Deploying SPlectrum to Kubernetes..."

# Create cluster if it doesn't exist
if ! kind get clusters | grep -q "$CLUSTER_NAME"; then
    echo "☸️  Creating kind cluster..."
    kind create cluster --name "$CLUSTER_NAME" --config k8s/kind-cluster.yaml
    echo "✅ Cluster created"
else
    echo "✅ Cluster already exists"
fi

# Load container image
echo "📤 Loading container image..."
kind load docker-image splectrum-bootstrap:latest --name "$CLUSTER_NAME"
echo "✅ Image loaded"

# Deploy SPlectrum
echo "🚀 Deploying SPlectrum..."
kubectl apply -f k8s/splectrum-deploy.yaml
echo "✅ Deployment applied"

# Wait for deployment
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/splectrum-bootstrap
echo "✅ Deployment ready"

echo "🎉 Kubernetes deployment complete"
echo ""
echo "Test with:"
echo "  kubectl exec -it deployment/splectrum-bootstrap -- spl help"
```

## API Enhancement Phase

### HTTP API Container
```dockerfile
# containers/Dockerfile.api
FROM splectrum-bootstrap:latest

# Install Node.js dependencies for API
RUN apk add --no-cache npm
COPY api/ /spl/api/
WORKDIR /spl/api
RUN npm install

# Expose API port
EXPOSE 8080

# Start API server
CMD ["node", "server.js"]
```

### Simple API Server
```javascript
// api/server.js - Basic HTTP wrapper for SPlectrum
const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(express.json());

// Execute SPlectrum command
app.post('/execute', (req, res) => {
  const { command, workdir = '/spl' } = req.body;
  
  // Security: validate command
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Invalid command' });
  }
  
  const fullCommand = `spl ${command}`;
  const options = { cwd: workdir, timeout: 30000 };
  
  exec(fullCommand, options, (error, stdout, stderr) => {
    res.json({
      success: !error,
      exitCode: error ? error.code : 0,
      stdout: stdout,
      stderr: stderr,
      command: fullCommand,
      timestamp: new Date().toISOString()
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  exec('spl help', (error, stdout, stderr) => {
    res.json({
      status: error ? 'unhealthy' : 'healthy',
      splectrum: !error,
      timestamp: new Date().toISOString()
    });
  });
});

// Get SPlectrum version/info
app.get('/info', (req, res) => {
  exec('spl help', (error, stdout, stderr) => {
    res.json({
      splectrum: {
        available: !error,
        help: stdout,
        version: "bootstrap"
      },
      api: {
        version: "1.0.0",
        endpoints: ["/execute", "/health", "/info"]
      }
    });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SPlectrum API server listening on port ${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /execute - Execute SPlectrum commands');
  console.log('  GET  /health  - Health check');
  console.log('  GET  /info    - SPlectrum info');
});
```

## Integration with InfoMetis Platform

### NiFi Integration Example
```bash
# Deploy basic NiFi alongside SPlectrum
kubectl apply -f k8s/nifi-basic.yaml

# Test NiFi → SPlectrum communication
curl -X POST http://splectrum-service:8080/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "console log \"Hello from NiFi\""}'
```

### Service Mesh Configuration
```yaml
# k8s/infometis-platform.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: infometis-config
data:
  services: |
    splectrum:
      url: "http://splectrum-service:8080"
      type: "computation-engine"
      api: "rest"
    nifi:
      url: "http://nifi-service:8080"
      type: "data-pipeline"
      api: "rest"
```

## Troubleshooting Guide

### Common Issues

#### SPlectrum Validation Fails
```bash
# Check permissions
ls -la spl
chmod +x spl

# Check dependencies
ldd spl  # Linux
otool -L spl  # macOS

# Check modules
ls -la modules/
```

#### Container Build Fails
```bash
# Check Docker daemon
docker info

# Check base image
docker pull alpine:latest

# Build with verbose output
docker build --no-cache --progress=plain -f containers/Dockerfile.minimal .
```

#### Kubernetes Deployment Fails
```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# Check image loading
kind load docker-image splectrum-bootstrap:latest --name infometis-bootstrap

# Check deployment status
kubectl describe deployment splectrum-bootstrap
kubectl logs deployment/splectrum-bootstrap
```

### Performance Optimization

#### Container Size Optimization
```dockerfile
# Multi-stage build for smaller containers
FROM alpine:latest AS builder
COPY spl /tmp/spl
COPY modules/ /tmp/modules/
# ... build steps ...

FROM alpine:latest
RUN apk add --no-cache nodejs
COPY --from=builder /tmp/spl /usr/local/bin/spl
COPY --from=builder /tmp/modules/ /spl/modules/
```

#### Resource Limits
```yaml
# Resource management
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

## Next Steps After Bootstrap

### Phase 1: Basic Platform (Week 1-2)
- [x] SPlectrum self-extraction working
- [x] Container build and deployment
- [x] Basic API functionality
- [ ] Persistent storage configuration
- [ ] Basic monitoring setup

### Phase 2: Service Integration (Week 3-4)
- [ ] NiFi deployment and integration
- [ ] Kafka integration planning
- [ ] Service discovery implementation
- [ ] Inter-service communication testing

### Phase 3: Production Readiness (Month 2)
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Comprehensive monitoring
- [ ] Backup and recovery procedures

### Phase 4: Advanced Features (Month 3+)
- [ ] AVRO RPC implementation
- [ ] Multi-cluster deployment
- [ ] Advanced orchestration features
- [ ] SPL package marketplace integration

## Related Documentation

- **[SPlectrum Containerization Integration](splectrum-containerization-integration.md)** - Detailed containerization strategy
- **[InfoMetis Platform Evolution Strategy](infometis-platform-evolution-strategy.md)** - Overall platform vision
- **[InfoMetis Evolution Strategy](infometis-evolution-strategy.md)** - Component evolution approach

## Success Metrics

### Bootstrap Success Criteria
- [ ] Self-extracting SPlectrum zip deploys successfully
- [ ] Container builds and runs SPlectrum commands
- [ ] Kubernetes deployment succeeds
- [ ] API responds to external requests
- [ ] Basic data processing workflows operational

### Integration Success Criteria
- [ ] NiFi can call SPlectrum via API
- [ ] Persistent data survives container restarts
- [ ] Multiple concurrent sessions supported
- [ ] Monitoring and logging functional
- [ ] Security policies implemented

## Conclusion

The self-extracting zip approach provides the ideal bootstrap strategy for InfoMetis + SPlectrum:

1. **Zero Dependencies**: Complete self-contained deployment
2. **Rapid Deployment**: Extract and run, no configuration required
3. **Offline Capable**: Works without internet access
4. **Version Controlled**: Each release is completely self-contained
5. **Progressive Enhancement**: Build complexity gradually while maintaining working system

This approach ensures that anyone can bootstrap a complete InfoMetis + SPlectrum environment from a single archive file, making deployment, testing, and development workflows much more reliable and reproducible.