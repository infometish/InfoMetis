#!/bin/bash
set -eu

# InfoMetis v0.2.0 - I1: Deploy NiFi Registry
# Deploys NiFi Registry with persistent storage and Git integration support

echo "🗂️  InfoMetis v0.2.0 - I1: Deploy NiFi Registry"
echo "==============================================="
echo "Deploying NiFi Registry with persistent storage"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load centralized image configuration
source "$SCRIPT_DIR/../config/image-config.env"

echo "📋 Registry Configuration:"
echo "  Image: $NIFI_REGISTRY_IMAGE"
echo "  Pull Policy: $IMAGE_PULL_POLICY"
echo ""

# Function: Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check if NiFi is running
    if ! kubectl get pods -n infometis -l app=nifi | grep -q Running; then
        echo "❌ NiFi not running. Deploy v0.1.0 foundation first."
        echo "   Run: ./D1-deploy-v0.1.0-foundation.sh && ./D2-deploy-v0.1.0-infometis.sh"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace infometis >/dev/null 2>&1; then
        echo "❌ infometis namespace not found"
        exit 1
    fi
    
    echo "✅ Prerequisites verified"
}

# Function: Setup Registry storage
setup_registry_storage() {
    echo "💾 Setting up Registry persistent storage..."
    
    # Create PersistentVolume for Registry
    kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-registry-pv
spec:
  capacity:
    storage: 5Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  hostPath:
    path: /var/lib/k0s/nifi-registry-data
    type: DirectoryOrCreate
EOF

    # Create PersistentVolumeClaim for Registry
    kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nifi-registry-pvc
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
        image: $NIFI_REGISTRY_IMAGE
        imagePullPolicy: $IMAGE_PULL_POLICY
        ports:
        - containerPort: 18080
          name: http
        env:
        - name: NIFI_REGISTRY_WEB_HTTP_PORT
          value: "18080"
        - name: NIFI_REGISTRY_WEB_HTTP_HOST
          value: "0.0.0.0"
        - name: NIFI_REGISTRY_DB_DIR
          value: "/opt/nifi-registry/database"
        - name: NIFI_REGISTRY_FLOW_STORAGE_DIR
          value: "/opt/nifi-registry/flow_storage"
        - name: NIFI_REGISTRY_GIT_REMOTE
          value: ""
        - name: NIFI_REGISTRY_GIT_USER
          value: "nifi-registry"
        - name: NIFI_REGISTRY_GIT_PASSWORD
          value: ""
        volumeMounts:
        - name: registry-data
          mountPath: /opt/nifi-registry/database
          subPath: database
        - name: registry-data
          mountPath: /opt/nifi-registry/flow_storage
          subPath: flow_storage
        - name: registry-data
          mountPath: /opt/nifi-registry/conf
          subPath: conf
        - name: registry-data
          mountPath: /opt/nifi-registry/logs
          subPath: logs
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        readinessProbe:
          httpGet:
            path: /nifi-registry/
            port: 18080
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
        livenessProbe:
          httpGet:
            path: /nifi-registry/
            port: 18080
            scheme: HTTP
          initialDelaySeconds: 60
          periodSeconds: 60
          timeoutSeconds: 10
      volumes:
      - name: registry-data
        persistentVolumeClaim:
          claimName: nifi-registry-pvc
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
  name: nifi-registry-service
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
  name: nifi-registry-ingress
  namespace: infometis
  annotations:
    kubernetes.io/ingress.class: traefik
spec:
  rules:
  - host: nifi-registry.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nifi-registry-service
            port:
              number: 18080
  - http:
      paths:
      - path: /nifi-registry
        pathType: Prefix
        backend:
          service:
            name: nifi-registry-service
            port:
              number: 18080
EOF

    echo "✅ Registry ingress created"
}

# Function: Wait for Registry
wait_for_registry() {
    echo "⏳ Waiting for Registry to be ready..."
    echo "This may take up to 2 minutes as Registry initializes..."
    
    # Wait for deployment to be available
    if kubectl wait --for=condition=available deployment/nifi-registry -n infometis --timeout=120s; then
        echo "✅ Registry deployment is available"
    else
        echo "⚠️  Registry deployment not ready within timeout"
        return 1
    fi
    
    # Wait for Registry API to be responsive
    local max_attempts=24  # 2 minutes with 5-second intervals
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry/ >/dev/null 2>&1; then
            echo "✅ Registry API is responsive"
            return 0
        fi
        
        echo "  Attempt $((attempt + 1))/$max_attempts - waiting for Registry API..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "⚠️  Registry API may not be fully ready yet, but deployment is complete"
    return 0
}

# Function: Verify Registry
verify_registry() {
    echo "🔍 Verifying Registry deployment..."
    
    if kubectl get deployment nifi-registry -n infometis >/dev/null 2>&1; then
        echo "✅ Registry deployment exists"
        
        if kubectl get pods -n infometis -l app=nifi-registry | grep -q Running; then
            echo "✅ Registry pod is running"
            
            if kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry/ >/dev/null 2>&1; then
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
    echo ""
    echo "📊 Registry Status:"
    echo "=================="
    
    kubectl get deployment nifi-registry -n infometis
    echo ""
    kubectl get pods -n infometis -l app=nifi-registry
    echo ""
    kubectl get service nifi-registry-service -n infometis
    echo ""
    kubectl get pvc nifi-registry-pvc -n infometis
    echo ""
    
    echo "🔗 Access Information:"
    echo "  • Registry UI: http://localhost/nifi-registry"
    echo "  • Direct Access: kubectl port-forward -n infometis deployment/nifi-registry 18080:18080"
    echo "  • Health Check: curl http://localhost/nifi-registry/"
}

# Main execution
main() {
    check_prerequisites
    setup_registry_storage
    deploy_registry
    create_registry_service
    create_registry_ingress
    wait_for_registry
    
    if verify_registry; then
        get_registry_status
        echo ""
        echo "🎉 I1 completed successfully!"
        echo "   NiFi Registry is deployed and ready for Git integration"
        echo ""
        echo "📋 Next Steps:"
        echo "  ./I2-configure-git-integration.sh  # Setup Git integration"
        echo "  ./I3-configure-registry-nifi.sh   # Connect NiFi to Registry"
    else
        echo ""
        echo "⚠️  I1 completed with warnings"
        echo "   Registry deployed but may need more time to fully initialize"
        get_registry_status
    fi
}

# Run main function
main