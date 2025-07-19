#!/bin/bash
set -eu

# InfoMetis v0.2.0 - NiFi Deployment Component
# Component script: NiFi deployment with persistent storage

echo "🌊 InfoMetis v0.2.0 - NiFi Deployment Component"
echo "=============================================="
echo "Component: Apache NiFi with persistent storage and InfoMetis configuration"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/../../cache/images"

# Function: Load NiFi image
load_nifi_image() {
    echo "📦 Loading NiFi image..."
    
    if [[ -f "${CACHE_DIR}/apache-nifi-1.23.2.tar" ]]; then
        docker load -i "${CACHE_DIR}/apache-nifi-1.23.2.tar" >/dev/null 2>&1
        echo "✅ NiFi image loaded from cache"
    else
        echo "⚠️  NiFi image not cached, will pull from registry"
        docker pull apache/nifi:1.23.2
        echo "✅ NiFi image pulled"
    fi
}

# Function: Setup NiFi storage
setup_nifi_storage() {
    echo "💾 Setting up NiFi persistent storage..."
    
    # Create PersistentVolume
    kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  hostPath:
    path: /var/lib/k0s/nifi-data
    type: DirectoryOrCreate
EOF

    # Create PersistentVolumeClaim
    kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nifi-pvc
  namespace: infometis
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: local-storage
EOF

    echo "✅ NiFi storage configured"
}

# Function: Deploy NiFi
deploy_nifi() {
    echo "🚀 Deploying NiFi..."
    
    kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nifi
  namespace: infometis
  labels:
    app: nifi
    version: v0.2.0
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nifi
  template:
    metadata:
      labels:
        app: nifi
        version: v0.2.0
    spec:
      containers:
      - name: nifi
        image: apache/nifi:1.23.2
        ports:
        - containerPort: 8443
          name: https
        - containerPort: 8080
          name: http
        env:
        - name: NIFI_WEB_HTTPS_PORT
          value: "8443"
        - name: NIFI_WEB_HTTP_PORT
          value: "8080"
        - name: NIFI_WEB_HTTPS_HOST
          value: "0.0.0.0"
        - name: NIFI_WEB_HTTP_HOST
          value: "0.0.0.0"
        - name: NIFI_CLUSTER_IS_NODE
          value: "false"
        - name: NIFI_ZK_CONNECT_STRING
          value: ""
        - name: NIFI_ELECTION_MAX_WAIT
          value: "1 min"
        - name: NIFI_SENSITIVE_PROPS_KEY
          value: "infometis2024"
        - name: SINGLE_USER_CREDENTIALS_USERNAME
          value: "admin"
        - name: SINGLE_USER_CREDENTIALS_PASSWORD
          value: "infometis2024"
        - name: NIFI_VARIABLE_REGISTRY_PROPERTIES
          value: "infometis.version=v0.2.0,infometis.environment=development"
        volumeMounts:
        - name: nifi-data
          mountPath: /opt/nifi/nifi-current/logs
          subPath: logs
        - name: nifi-data
          mountPath: /opt/nifi/nifi-current/conf
          subPath: conf
        - name: nifi-data
          mountPath: /opt/nifi/nifi-current/flowfile_repository
          subPath: flowfile_repository
        - name: nifi-data
          mountPath: /opt/nifi/nifi-current/database_repository
          subPath: database_repository
        - name: nifi-data
          mountPath: /opt/nifi/nifi-current/content_repository
          subPath: content_repository
        - name: nifi-data
          mountPath: /opt/nifi/nifi-current/provenance_repository
          subPath: provenance_repository
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        readinessProbe:
          httpGet:
            path: /nifi-api/system-diagnostics
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
        livenessProbe:
          httpGet:
            path: /nifi-api/system-diagnostics
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 120
          periodSeconds: 60
          timeoutSeconds: 10
      volumes:
      - name: nifi-data
        persistentVolumeClaim:
          claimName: nifi-pvc
EOF

    echo "✅ NiFi deployment created"
}

# Function: Create NiFi Service
create_nifi_service() {
    echo "🔗 Creating NiFi Service..."
    
    kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: nifi-service
  namespace: infometis
  labels:
    app: nifi
spec:
  selector:
    app: nifi
  ports:
  - name: http
    port: 8080
    targetPort: 8080
  - name: https
    port: 8443
    targetPort: 8443
  type: ClusterIP
EOF

    echo "✅ NiFi service created"
}

# Function: Create NiFi Ingress
create_nifi_ingress() {
    echo "🌐 Creating NiFi Ingress..."
    
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nifi-ingress
  namespace: infometis
  annotations:
    kubernetes.io/ingress.class: traefik
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
  - http:
      paths:
      - path: /nifi
        pathType: Prefix
        backend:
          service:
            name: nifi-service
            port:
              number: 8080
EOF

    echo "✅ NiFi ingress created"
}

# Function: Wait for NiFi
wait_for_nifi() {
    echo "⏳ Waiting for NiFi to be ready..."
    echo "This may take several minutes as NiFi initializes..."
    
    kubectl wait --for=condition=available deployment/nifi -n infometis --timeout=600s
    
    # Wait for NiFi API to be responsive
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if kubectl exec -n infometis deployment/nifi -- curl -f http://localhost:8080/nifi-api/system-diagnostics >/dev/null 2>&1; then
            echo "✅ NiFi API is responsive"
            return 0
        fi
        
        echo "  Attempt $((attempt + 1))/$max_attempts - waiting for NiFi API..."
        sleep 20
        attempt=$((attempt + 1))
    done
    
    echo "⚠️  NiFi API may not be fully ready yet, but deployment is complete"
    return 0
}

# Function: Verify NiFi
verify_nifi() {
    echo "🔍 Verifying NiFi deployment..."
    
    if kubectl get deployment nifi -n infometis >/dev/null 2>&1; then
        echo "✅ NiFi deployment exists"
        
        if kubectl get pods -n infometis -l app=nifi | grep -q Running; then
            echo "✅ NiFi pod is running"
            
            if kubectl exec -n infometis deployment/nifi -- curl -f http://localhost:8080/nifi-api/system-diagnostics >/dev/null 2>&1; then
                echo "✅ NiFi API is responsive"
                return 0
            else
                echo "⚠️  NiFi API not responsive yet"
                return 1
            fi
        else
            echo "❌ NiFi pod not running"
            return 1
        fi
    else
        echo "❌ NiFi deployment not found"
        return 1
    fi
}

# Function: Get NiFi status
get_nifi_status() {
    echo "📊 NiFi Status:"
    echo "==============="
    
    kubectl get deployment nifi -n infometis
    echo ""
    kubectl get pods -n infometis -l app=nifi
    echo ""
    kubectl get service nifi-service -n infometis
    echo ""
    kubectl get pvc nifi-pvc -n infometis
    echo ""
    
    echo "🔗 Access Information:"
    echo "  • NiFi UI: http://localhost/nifi"
    echo "  • Direct Access: kubectl port-forward -n infometis deployment/nifi 8080:8080"
    echo "  • Credentials: admin / infometis2024"
}

# Main execution
main() {
    local operation="${1:-deploy}"
    
    case "$operation" in
        "deploy")
            load_nifi_image
            setup_nifi_storage
            deploy_nifi
            create_nifi_service
            create_nifi_ingress
            wait_for_nifi
            verify_nifi
            ;;
        "verify")
            verify_nifi
            ;;
        "status")
            get_nifi_status
            ;;
        "storage")
            setup_nifi_storage
            ;;
        *)
            echo "Usage: $0 [deploy|verify|status|storage]"
            echo ""
            echo "Operations:"
            echo "  deploy    - Complete NiFi deployment (default)"
            echo "  verify    - Verify NiFi is working"
            echo "  status    - Show NiFi status"
            echo "  storage   - Setup storage only"
            exit 1
            ;;
    esac
}

# Export functions for use by other scripts
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
fi