#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Registry Deployment Component
# Component script: NiFi Registry deployment with Git integration

echo "🗂️  InfoMetis v0.2.0 - Registry Deployment Component"
echo "=================================================="
echo "Component: Apache NiFi Registry with Git integration support"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/../../cache/images"

# Function: Load Registry image
load_registry_image() {
    echo "📦 Loading Registry image..."
    
    if [[ -f "${CACHE_DIR}/apache-nifi-registry-1.23.2.tar" ]]; then
        docker load -i "${CACHE_DIR}/apache-nifi-registry-1.23.2.tar" >/dev/null 2>&1
        echo "✅ Registry image loaded from cache"
    else
        echo "⚠️  Registry image not cached, will pull from registry"
        docker pull apache/nifi-registry:1.23.2
        echo "✅ Registry image pulled"
    fi
}

# Function: Setup Registry storage
setup_registry_storage() {
    echo "💾 Setting up Registry persistent storage..."
    
    # Create PersistentVolume
    kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: registry-pv
spec:
  capacity:
    storage: 5Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  hostPath:
    path: /var/lib/k0s/registry-data
    type: DirectoryOrCreate
EOF

    # Create PersistentVolumeClaim
    kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: registry-pvc
  namespace: infometis
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: local-storage
EOF

    echo "✅ Registry storage configured"
}

# Function: Deploy Registry
deploy_registry() {
    echo "🚀 Deploying NiFi Registry..."
    
    kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nifi-registry
  namespace: infometis
  labels:
    app: nifi-registry
    version: v0.2.0
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nifi-registry
  template:
    metadata:
      labels:
        app: nifi-registry
        version: v0.2.0
    spec:
      containers:
      - name: nifi-registry
        image: apache/nifi-registry:1.23.2
        ports:
        - containerPort: 18080
          name: http
        env:
        - name: NIFI_REGISTRY_WEB_HTTP_HOST
          value: "0.0.0.0"
        - name: NIFI_REGISTRY_WEB_HTTP_PORT
          value: "18080"
        - name: NIFI_REGISTRY_DB_DIR
          value: "/opt/nifi-registry/nifi-registry-current/database"
        - name: NIFI_REGISTRY_FLOW_STORAGE_DIR
          value: "/opt/nifi-registry/nifi-registry-current/flow_storage"
        - name: NIFI_REGISTRY_GIT_REMOTE
          value: ""
        - name: NIFI_REGISTRY_GIT_USER
          value: "InfoMetis Registry"
        - name: NIFI_REGISTRY_GIT_EMAIL
          value: "registry@infometis.local"
        volumeMounts:
        - name: registry-data
          mountPath: /opt/nifi-registry/nifi-registry-current/database
          subPath: database
        - name: registry-data
          mountPath: /opt/nifi-registry/nifi-registry-current/flow_storage
          subPath: flow_storage
        - name: registry-data
          mountPath: /opt/nifi-registry/nifi-registry-current/conf
          subPath: conf
        - name: registry-data
          mountPath: /opt/nifi-registry/nifi-registry-current/logs
          subPath: logs
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        readinessProbe:
          httpGet:
            path: /nifi-registry-api/buckets
            port: 18080
          initialDelaySeconds: 30
          periodSeconds: 15
          timeoutSeconds: 10
        livenessProbe:
          httpGet:
            path: /nifi-registry-api/buckets
            port: 18080
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
      volumes:
      - name: registry-data
        persistentVolumeClaim:
          claimName: registry-pvc
EOF

    echo "✅ Registry deployment created"
}

# Function: Create Registry Service
create_registry_service() {
    echo "🔗 Creating Registry Service..."
    
    kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: registry-service
  namespace: infometis
  labels:
    app: nifi-registry
spec:
  selector:
    app: nifi-registry
  ports:
  - name: http
    port: 18080
    targetPort: 18080
  type: ClusterIP
EOF

    echo "✅ Registry service created"
}

# Function: Create Registry Ingress
create_registry_ingress() {
    echo "🌐 Creating Registry Ingress..."
    
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: registry-ingress
  namespace: infometis
  annotations:
    kubernetes.io/ingress.class: traefik
spec:
  rules:
  - host: registry.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: registry-service
            port:
              number: 18080
  - http:
      paths:
      - path: /nifi-registry
        pathType: Prefix
        backend:
          service:
            name: registry-service
            port:
              number: 18080
EOF

    echo "✅ Registry ingress created"
}

# Function: Wait for Registry
wait_for_registry() {
    echo "⏳ Waiting for Registry to be ready..."
    
    kubectl wait --for=condition=available deployment/nifi-registry -n infometis --timeout=300s
    
    # Wait for Registry API to be responsive
    local max_attempts=20
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null 2>&1; then
            echo "✅ Registry API is responsive"
            return 0
        fi
        
        echo "  Attempt $((attempt + 1))/$max_attempts - waiting for Registry API..."
        sleep 15
        attempt=$((attempt + 1))
    done
    
    echo "⚠️  Registry API may not be fully ready yet, but deployment is complete"
    return 0
}

# Function: Create default bucket
create_default_bucket() {
    echo "🪣 Creating InfoMetis default bucket..."
    
    kubectl exec -n infometis deployment/nifi-registry -- curl -X POST \
        -H "Content-Type: application/json" \
        -d '{"name":"InfoMetis","description":"Default bucket for InfoMetis flows and version control"}' \
        http://localhost:18080/nifi-registry-api/buckets >/dev/null 2>&1 || \
        echo "⚠️  Bucket creation will be available once Registry is fully started"
    
    echo "✅ Default bucket setup initiated"
}

# Function: Verify Registry
verify_registry() {
    echo "🔍 Verifying Registry deployment..."
    
    if kubectl get deployment nifi-registry -n infometis >/dev/null 2>&1; then
        echo "✅ Registry deployment exists"
        
        if kubectl get pods -n infometis -l app=nifi-registry | grep -q Running; then
            echo "✅ Registry pod is running"
            
            if kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null 2>&1; then
                echo "✅ Registry API is responsive"
                return 0
            else
                echo "⚠️  Registry API not responsive yet"
                return 1
            fi
        else
            echo "❌ Registry pod not running"
            return 1
        fi
    else
        echo "❌ Registry deployment not found"
        return 1
    fi
}

# Function: Get Registry status
get_registry_status() {
    echo "📊 Registry Status:"
    echo "==================="
    
    kubectl get deployment nifi-registry -n infometis
    echo ""
    kubectl get pods -n infometis -l app=nifi-registry
    echo ""
    kubectl get service registry-service -n infometis
    echo ""
    kubectl get pvc registry-pvc -n infometis
    echo ""
    
    echo "🔗 Access Information:"
    echo "  • Registry UI: http://localhost/nifi-registry"
    echo "  • Direct Access: kubectl port-forward -n infometis deployment/nifi-registry 18080:18080"
    echo "  • API: http://localhost:18080/nifi-registry-api"
}

# Main execution
main() {
    local operation="${1:-deploy}"
    
    case "$operation" in
        "deploy")
            load_registry_image
            setup_registry_storage
            deploy_registry
            create_registry_service
            create_registry_ingress
            wait_for_registry
            create_default_bucket
            verify_registry
            ;;
        "verify")
            verify_registry
            ;;
        "status")
            get_registry_status
            ;;
        "storage")
            setup_registry_storage
            ;;
        "bucket")
            create_default_bucket
            ;;
        *)
            echo "Usage: $0 [deploy|verify|status|storage|bucket]"
            echo ""
            echo "Operations:"
            echo "  deploy    - Complete Registry deployment (default)"
            echo "  verify    - Verify Registry is working"
            echo "  status    - Show Registry status"
            echo "  storage   - Setup storage only"
            echo "  bucket    - Create default bucket only"
            exit 1
            ;;
    esac
}

# Export functions for use by other scripts
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
fi