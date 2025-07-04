[← Back to InfoMetis Home](../../README.md)

# Kubernetes NiFi Test Status

*Part of the NiFi Initial Test series - comparing Docker vs Kubernetes deployment*

## Current Status: Infrastructure Complete, API Access Blocked

### ✅ **What's Working**
- **kind cluster**: Running successfully (`infometis`)
- **NiFi deployment**: Pod healthy and running (`nifi-7989dcb94c-rcq2c`)
- **Storage**: 6 persistent volumes created and mounted
- **Service**: ClusterIP service exposing ports 8080/8443
- **Authentication**: Single-user mode configured (admin/adminpassword)

### ❌ **Current Issue**
- **API Access**: Port-forwarding unstable, can't reach NiFi API
- **Test Pipeline**: Not created yet (blocked by API access)
- **Data Processing**: Can't test without API access

### 🔧 **Technical Details**

#### Successful Deployment
```bash
# Created cluster
kind create cluster --name infometis

# Applied configuration
kubectl apply -f nifi-k8s.yaml

# Pod is healthy
kubectl get pods -n infometis
NAME                    READY   STATUS    RESTARTS        AGE
nifi-7989dcb94c-rcq2c   1/1     Running   1 (5m21s ago)   12m
```

#### Current Configuration
- **Namespace**: `infometis`
- **Image**: `apache/nifi:latest`
- **Volumes**: input, output, database, flowfile, content, provenance
- **Service**: ClusterIP on ports 8080/8443
- **Probes**: Liveness only (300s delay)

#### Port-Forwarding Issues
```bash
# Attempted multiple times
kubectl port-forward -n infometis svc/nifi-service 8083:8080

# Connection tests fail
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8083/nifi-api/system-diagnostics"
# Returns: 000Connection failed
```

## Next Steps: Traefik Integration

### **Solution: Replace Port-Forwarding with Traefik**

#### **Why Traefik?**
- **Stable networking**: No port-forwarding flakiness
- **HTTP routing**: Direct host-based access
- **Local development**: Perfect for kind clusters
- **API access**: Reliable connection for automation

#### **Implementation Plan**

##### 1. Install Traefik on kind
```bash
# Add Traefik Helm repo
helm repo add traefik https://helm.traefik.io/traefik

# Install Traefik
helm install traefik traefik/traefik \
  --set service.type=NodePort \
  --set ports.web.nodePort=30080 \
  --set ports.websecure.nodePort=30443
```

##### 2. Configure kind for Traefik
```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30080
    hostPort: 80
  - containerPort: 30443
    hostPort: 443
```

##### 3. Create NiFi Ingress
```yaml
# nifi-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nifi-ingress
  namespace: infometis
  annotations:
    kubernetes.io/ingress.class: "traefik"
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

##### 4. Test Access
```bash
# Add to /etc/hosts
echo "127.0.0.1 nifi.local" | sudo tee -a /etc/hosts

# Test API access
curl -s "http://nifi.local/nifi-api/system-diagnostics"
```

### **Alternative: Simple NodePort Solution**

#### **Simpler Approach (No Traefik)**
```yaml
# Change service type to NodePort
apiVersion: v1
kind: Service
metadata:
  name: nifi-service
  namespace: infometis
spec:
  type: NodePort
  selector:
    app: nifi
  ports:
  - name: web-ui
    port: 8080
    targetPort: 8080
    nodePort: 30080
```

#### **Access via NodePort**
```bash
# Get cluster IP
kubectl get nodes -o wide

# Access directly (no port-forwarding needed)
curl -s "http://localhost:30080/nifi-api/system-diagnostics"
```

## Test Pipeline Recreation

### **Original Pipeline (from Docker test)**
```
[Input Directory] → [GetFile] → [Connection] → [PutFile] → [Output Directory]
     ↓                 ↓             ↓           ↓              ↓
/opt/nifi/input    File Reader   success    File Writer   /opt/nifi/output
```

### **API Commands to Execute**
```bash
# 1. Get authentication token
TOKEN=$(curl -s -k -X POST 'http://nifi.local/nifi-api/access/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin&password=adminpassword')

# 2. Get root process group ID
ROOT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://nifi.local/nifi-api/flow/process-groups/root | jq -r '.processGroupFlow.id')

# 3. Create GetFile processor
GETFILE_ID=$(curl -s -X POST \
  "http://nifi.local/nifi-api/process-groups/$ROOT_ID/processors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "type": "org.apache.nifi.processors.standard.GetFile",
      "position": {"x": 100, "y": 100}
    }
  }' | jq -r '.id')

# 4. Create PutFile processor
PUTFILE_ID=$(curl -s -X POST \
  "http://nifi.local/nifi-api/process-groups/$ROOT_ID/processors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "revision": {"version": 0},
    "component": {
      "type": "org.apache.nifi.processors.standard.PutFile",
      "position": {"x": 400, "y": 100}
    }
  }' | jq -r '.id')

# 5. Configure processors and create connection
# 6. Start processors
```

## Test Data

### **Available Test Files**
```
data/input/
├── customer_lookup.csv
└── customer_orders.csv

data/nifi/
├── input/
└── output/
    └── sample_data.csv
```

### **Expected Test Flow**
1. Copy test files to NiFi input volume
2. Run pipeline via API
3. Verify files appear in output volume
4. Compare with Docker test results

## Session Resumption Plan

### **Tomorrow's Action Items**
1. **Choose networking solution**: Traefik (robust) vs NodePort (simple)
2. **Implement chosen solution**
3. **Test NiFi API access**
4. **Recreate pipeline programmatically**
5. **Run test data through pipeline**
6. **Document comparison with Docker test**

### **Quick Start Commands**
```bash
# Resume cluster
kind get clusters  # Should show 'infometis'
kubectl get pods -n infometis  # Should show NiFi running

# Option A: NodePort (simple)
kubectl patch svc nifi-service -n infometis -p '{"spec":{"type":"NodePort","ports":[{"port":8080,"nodePort":30080}]}}'

# Option B: Traefik (robust)
helm install traefik traefik/traefik --set service.type=NodePort
```

## Files Created
- `nifi-k8s.yaml` - Kubernetes deployment manifest
- `docs/wsl-k0s-deployment-guide.md` - Updated with kind solution
- `docs/kubernetes-nifi-test-status.md` - This status document

## Lessons Learned
1. **kind works excellently** as k0s replacement for WSL
2. **Port-forwarding is unreliable** for long-running API access
3. **Traefik/NodePort needed** for stable networking
4. **NiFi starts successfully** in Kubernetes environment
5. **API automation is viable** once networking is resolved