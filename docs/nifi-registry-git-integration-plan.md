[← Back to InfoMetis Home](../README.md)

# NiFi Registry + Git Integration Plan

## Overview

This plan combines **NiFi Registry** (versioning), **Git integration** (backup/audit), and **our automation system** (conversational pipelines) with **Traefik** handling all external security.

## Architecture Design

### Security Architecture
```
External Users/APIs
         ↓
    Traefik (HTTPS/Auth)
         ↓
Internal Network (HTTP, No Auth)
├── NiFi Cluster (HTTP)
├── NiFi Registry (HTTP) 
└── Git Repository (Internal)
```

**Philosophy**: 
- **Internal**: Simple HTTP, no authentication complexity
- **External**: Traefik handles all security (HTTPS, OAuth, API keys, etc.)
- **Git**: Automatic backup and audit trail

### Component Integration
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Conversation  │    │  Our Automation │    │  NiFi Registry  │
│   "Create X"    │───▶│   YAML → API    │───▶│  Flow Versions  │
└─────────────────┘    └─────────────────┘    └─────────┬───────┘
                                                         │
┌─────────────────┐    ┌─────────────────┐              │
│   NiFi Cluster  │    │  Git Repository │◄─────────────┘
│  Running Flows  │◄──►│  Flow Backup    │
└─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │     Traefik     │
                       │  (External API) │
                       └─────────────────┘
```

## Implementation Components

### 1. Simple Internal NiFi Setup

#### NiFi Configuration (nifi.properties)
```properties
# HTTP only for internal use
nifi.web.http.host=0.0.0.0
nifi.web.http.port=8080
nifi.web.https.port=

# No authentication internally
nifi.security.user.login.identity.provider=
nifi.security.needClientAuth=false

# Registry connection
nifi.registry.url=http://nifi-registry:18080
```

#### NiFi Registry Configuration
```properties
# HTTP only for internal use
nifi.registry.web.http.host=0.0.0.0
nifi.registry.web.http.port=18080
nifi.registry.web.https.port=

# No authentication internally
nifi.registry.security.needClientAuth=false

# Git integration
nifi.registry.providers.flow.persistence.provider=git
nifi.registry.git.remote.url=http://git-server/nifi-flows.git
nifi.registry.git.remote.clone.repository=true
```

### 2. Kubernetes Deployment

#### Complete Stack (nifi-complete-stack.yaml)
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: nifi-system
---
# Git Server (Gitea - simple internal Git)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitea
  namespace: nifi-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gitea
  template:
    metadata:
      labels:
        app: gitea
    spec:
      containers:
      - name: gitea
        image: gitea/gitea:latest
        ports:
        - containerPort: 3000
        env:
        - name: GITEA__security__INSTALL_LOCK
          value: "true"
        - name: GITEA__security__SECRET_KEY
          value: "simple-secret-key"
        volumeMounts:
        - name: gitea-data
          mountPath: /data
      volumes:
      - name: gitea-data
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: git-server
  namespace: nifi-system
spec:
  selector:
    app: gitea
  ports:
  - port: 3000
    targetPort: 3000
---
# NiFi Registry
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nifi-registry
  namespace: nifi-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nifi-registry
  template:
    metadata:
      labels:
        app: nifi-registry
    spec:
      containers:
      - name: nifi-registry
        image: apache/nifi-registry:latest
        ports:
        - containerPort: 18080
        env:
        - name: NIFI_REGISTRY_WEB_HTTP_HOST
          value: "0.0.0.0"
        - name: NIFI_REGISTRY_WEB_HTTP_PORT
          value: "18080"
        # Git integration will be configured via providers.xml
        volumeMounts:
        - name: registry-config
          mountPath: /opt/nifi-registry/conf/providers.xml
          subPath: providers.xml
      volumes:
      - name: registry-config
        configMap:
          name: registry-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: registry-config
  namespace: nifi-system
data:
  providers.xml: |
    <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <providers>
        <flowPersistenceProvider>
            <class>org.apache.nifi.registry.provider.flow.git.GitFlowPersistenceProvider</class>
            <property name="Flow Storage Directory">./flow_storage</property>
            <property name="Remote To Push">origin</property>
            <property name="Remote Access User">nifi</property>
            <property name="Remote Access Password"></property>
            <property name="Remote Clone Repository">http://git-server:3000/nifi/flows.git</property>
        </flowPersistenceProvider>
    </providers>
---
apiVersion: v1
kind: Service
metadata:
  name: nifi-registry
  namespace: nifi-system
spec:
  selector:
    app: nifi-registry
  ports:
  - port: 18080
    targetPort: 18080
---
# NiFi Cluster (updated to use registry)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nifi
  namespace: nifi-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nifi
  template:
    metadata:
      labels:
        app: nifi
    spec:
      containers:
      - name: nifi
        image: apache/nifi:1.23.2
        ports:
        - containerPort: 8080
        env:
        - name: NIFI_WEB_HTTP_HOST
          value: "0.0.0.0"
        - name: NIFI_WEB_HTTP_PORT
          value: "8080"
        - name: NIFI_WEB_HTTPS_PORT
          value: ""
        - name: NIFI_REGISTRY_URL
          value: "http://nifi-registry:18080"
        volumeMounts:
        - name: nifi-input
          mountPath: /opt/nifi/input
        - name: nifi-output
          mountPath: /opt/nifi/output
      volumes:
      - name: nifi-input
        emptyDir: {}
      - name: nifi-output
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: nifi-service
  namespace: nifi-system
spec:
  selector:
    app: nifi
  ports:
  - port: 8080
    targetPort: 8080
---
# Traefik Ingress for external access
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nifi-ingress
  namespace: nifi-system
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
    # Add authentication middleware here later
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
  - host: registry.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nifi-registry
            port:
              number: 18080
  - host: git.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: git-server
            port:
              number: 3000
```

### 3. Enhanced Automation Scripts

#### Enhanced create-pipeline.sh with Registry Integration
```bash
#!/bin/bash
# Enhanced pipeline creation with registry support

NIFI_REGISTRY_URL="${NIFI_REGISTRY_URL:-http://nifi-registry:18080}"
GIT_ENABLED="${GIT_ENABLED:-true}"

# Check if registry is available
check_registry() {
    if curl -s "$NIFI_REGISTRY_URL/nifi-registry-api/buckets" &>/dev/null; then
        echo "📦 NiFi Registry detected - enabling versioning"
        return 0
    else
        echo "📄 Registry not available - using standalone mode"
        return 1
    fi
}

# Create flow in registry
create_registry_flow() {
    local bucket_id="$1"
    local flow_name="$2"
    local description="$3"
    
    curl -s -X POST "$NIFI_REGISTRY_URL/nifi-registry-api/buckets/$bucket_id/flows" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$flow_name\",
            \"description\": \"$description\",
            \"type\": \"Flow\"
        }" | jq -r '.identifier'
}

# Enhanced main function
main() {
    local pipeline_def="$1"
    
    # Parse pipeline definition
    NAME=$(yq eval '.pipeline.name' "$pipeline_def")
    DESCRIPTION=$(yq eval '.pipeline.description // "Automated pipeline"' "$pipeline_def")
    
    # Check for registry
    if check_registry; then
        REGISTRY_MODE=true
        
        # Create or get bucket
        BUCKET_ID=$(get_or_create_bucket "automated-pipelines")
        
        # Create flow in registry
        FLOW_ID=$(create_registry_flow "$BUCKET_ID" "$NAME" "$DESCRIPTION")
        echo "📦 Created flow in registry: $FLOW_ID"
        
        # Create process group from registry
        PROCESS_GROUP_ID=$(create_versioned_process_group "$FLOW_ID")
        
        # Configure the flow
        configure_registry_flow "$PROCESS_GROUP_ID" "$pipeline_def"
        
        # Save initial version
        save_flow_version "$FLOW_ID" "$PROCESS_GROUP_ID" "Initial automated creation"
        
    else
        REGISTRY_MODE=false
        # Fall back to original method
        create_standalone_pipeline "$pipeline_def"
    fi
    
    # Save automation metadata
    save_automation_metadata "$pipeline_def" "$FLOW_ID" "$PROCESS_GROUP_ID"
    
    echo "✅ Pipeline created successfully!"
    if [ "$REGISTRY_MODE" = "true" ]; then
        echo "📦 Registry Flow ID: $FLOW_ID"
        echo "🔄 Git backup: Automatically committed"
    fi
}
```

#### Registry Management Scripts

**registry-backup.sh** - Manual Git backup
```bash
#!/bin/bash
# Backup all flows to Git

echo "📦 Backing up all NiFi flows to Git..."

# Get all buckets
curl -s "$NIFI_REGISTRY_URL/nifi-registry-api/buckets" | \
    jq -r '.[] | .identifier' | \
    while read bucket_id; do
        echo "Processing bucket: $bucket_id"
        
        # Get all flows in bucket
        curl -s "$NIFI_REGISTRY_URL/nifi-registry-api/buckets/$bucket_id/flows" | \
            jq -r '.[] | .identifier' | \
            while read flow_id; do
                # Trigger Git push for flow
                trigger_git_backup "$flow_id"
            done
    done

echo "✅ Backup complete"
```

**version-pipeline.sh** - Version management
```bash
#!/bin/bash
# Pipeline version management

PIPELINE_ID="$1"
ACTION="$2"
VERSION="$3"

case "$ACTION" in
    "list")
        list_flow_versions "$PIPELINE_ID"
        ;;
    "create")
        create_flow_version "$PIPELINE_ID" "$VERSION"
        ;;
    "rollback")
        rollback_to_version "$PIPELINE_ID" "$VERSION"
        ;;
    "compare")
        compare_versions "$PIPELINE_ID" "$VERSION" "$4"
        ;;
    *)
        echo "Usage: $0 <pipeline-id> <list|create|rollback|compare> [version]"
        exit 1
        ;;
esac
```

### 4. Git Integration Benefits

#### Automatic Flow Backup
```bash
# Every flow change automatically creates Git commits
commit 7a8b9c2 - "Customer Data Processor v1.2 - Added email validation"
commit 5d6e7f8 - "Log Processor v1.0 - Initial creation"
commit 3c4d5e6 - "API Integration v1.1 - Updated endpoint"
```

#### Flow History Tracking
```bash
# Git log shows complete flow evolution
git log --oneline flows/customer-processor/
7a8b9c2 v1.2 - Added email validation
3a4b5c6 v1.1 - Improved error handling  
1a2b3c4 v1.0 - Initial creation
```

#### Branch-Based Development
```bash
# Feature branches for flow development
git checkout -b feature/enhanced-validation
# Develop flow changes
git commit -m "Enhanced validation logic"
git checkout main
git merge feature/enhanced-validation
```

### 5. Traefik Security Configuration

#### Authentication Middleware
```yaml
# traefik-auth.yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: basic-auth
  namespace: nifi-system
spec:
  basicAuth:
    users:
    - "admin:$2y$10$..."  # Generated password hash

---
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: oauth-auth
  namespace: nifi-system
spec:
  forwardAuth:
    address: "http://oauth-provider/auth"
    authResponseHeaders:
    - "X-Auth-User"
    - "X-Auth-Groups"
```

#### Updated Ingress with Security
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nifi-secure-ingress
  namespace: nifi-system
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
    traefik.ingress.kubernetes.io/router.middlewares: nifi-system-basic-auth@kubernetescrd
spec:
  rules:
  - host: nifi.company.com
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

## Implementation Phases

### Phase 1: Basic Integration (Week 1)
```bash
# 1. Deploy enhanced stack
kubectl apply -f nifi-complete-stack.yaml

# 2. Test basic registry connectivity
./test-registry-connection.sh

# 3. Create first registry-backed pipeline
./create-pipeline.sh ../templates/customer-pipeline.yaml
```

### Phase 2: Git Automation (Week 2)
```bash
# 1. Configure Git auto-backup
./setup-git-integration.sh

# 2. Test version management
./version-pipeline.sh customer-processor create "v1.1 - Enhanced validation"

# 3. Test rollback capability
./version-pipeline.sh customer-processor rollback v1.0
```

### Phase 3: Traefik Security (Week 3)
```bash
# 1. Deploy Traefik with authentication
kubectl apply -f traefik-auth.yaml

# 2. Update ingress with security middleware
kubectl apply -f nifi-secure-ingress.yaml

# 3. Test external access with authentication
curl -u admin:password https://nifi.company.com/nifi-api/system-diagnostics
```

### Phase 4: Full Automation (Week 4)
```bash
# 1. Enhanced automation scripts
# All scripts now registry-aware

# 2. Automated backup/restore procedures
./backup-all-flows.sh
./restore-flow.sh customer-processor v1.2

# 3. CI/CD integration
# Git webhooks trigger flow deployments
```

## Benefits of This Integration

### Development Benefits
- **Version Control**: Every flow change tracked in Git
- **Rollback**: Easy rollback to previous versions
- **Branching**: Feature development in isolated branches
- **Collaboration**: Git-based flow sharing and review

### Operations Benefits
- **Backup**: Automatic Git backup of all flows
- **Audit Trail**: Complete history of who changed what when
- **Disaster Recovery**: Restore entire NiFi setup from Git
- **Environment Promotion**: Dev → Test → Prod via Git

### Security Benefits
- **Internal Simplicity**: No complex internal authentication
- **External Security**: Traefik handles all external access
- **Centralized Auth**: Single point for authentication/authorization
- **SSL Termination**: HTTPS handled by Traefik

This approach gives you **the best of all worlds**: simple internal setup, powerful versioning with Git integration, and robust external security via Traefik!