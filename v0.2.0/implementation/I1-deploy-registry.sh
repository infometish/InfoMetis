#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Deploy NiFi Registry
# Single concern: Deploy NiFi Registry with persistent storage

echo "🗂️  InfoMetis v0.2.0 - Deploy NiFi Registry"
echo "=========================================="
echo "Deploying: NiFi Registry with Git integration support"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/../../cache/images"

# Check if foundation is ready
echo "🔍 Checking v0.1.0 foundation..."
if ! kubectl get deployment nifi -n infometis >/dev/null 2>&1; then
    echo "❌ NiFi not deployed. Run D2-deploy-v0.1.0-infometis.sh first"
    exit 1
fi

if ! kubectl get pods -n infometis -l app=nifi | grep -q Running; then
    echo "❌ NiFi not running. Verify v0.1.0 deployment"
    exit 1
fi

echo "✅ Foundation verified"

# Load cached Registry image
echo ""
echo "📦 Loading cached Registry image..."
if [[ -f "${CACHE_DIR}/apache-nifi-registry-1.23.2.tar" ]]; then
    docker load -i "${CACHE_DIR}/apache-nifi-registry-1.23.2.tar" >/dev/null 2>&1
    echo "✅ Registry image loaded"
else
    echo "⚠️  Registry image not cached, will pull from registry"
fi

# Create Registry persistent volume
echo ""
echo "💾 Setting up Registry persistent storage..."

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

# Create Registry PVC
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

# Deploy NiFi Registry
echo ""
echo "🗂️  Deploying NiFi Registry..."

kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nifi-registry
  namespace: infometis
  labels:
    app: nifi-registry
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
          value: "InfoMetis"
        - name: NIFI_REGISTRY_GIT_EMAIL
          value: "infometis@example.com"
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

# Create Registry Service
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: registry-service
  namespace: infometis
spec:
  selector:
    app: nifi-registry
  ports:
  - name: http
    port: 18080
    targetPort: 18080
  type: ClusterIP
EOF

# Create Registry Ingress
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

echo "✅ Registry deployed"

# Wait for Registry to be ready
echo ""
echo "⏳ Waiting for Registry to be ready..."
kubectl wait --for=condition=available deployment/nifi-registry -n infometis --timeout=300s

# Wait for Registry API to be responsive
echo ""
echo "⏳ Waiting for Registry API to be responsive..."
max_attempts=20
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null 2>&1; then
        echo "✅ Registry API is responsive"
        break
    fi
    
    echo "  Attempt $((attempt + 1))/$max_attempts - waiting for Registry API..."
    sleep 15
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "⚠️  Registry API may not be fully ready yet, but deployment is complete"
fi

# Create default bucket for testing
echo ""
echo "🪣 Creating default Registry bucket..."
kubectl exec -n infometis deployment/nifi-registry -- curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"name":"InfoMetis","description":"Default bucket for InfoMetis flows"}' \
    http://localhost:18080/nifi-registry-api/buckets >/dev/null 2>&1 || echo "⚠️  Bucket creation will be available once Registry is fully started"

echo ""
echo "🎉 NiFi Registry Deployment Complete!"
echo "===================================="
echo ""
echo "📊 Registry Status:"
kubectl get pods -n infometis -l app=nifi-registry
echo ""
echo "💾 Storage Status:"
kubectl get pv registry-pv
kubectl get pvc registry-pvc -n infometis
echo ""
echo "🔗 Access Points:"
echo "  • Registry UI: http://localhost/nifi-registry"
echo "  • Registry Direct: kubectl port-forward -n infometis deployment/nifi-registry 18080:18080"
echo "  • Registry API: http://localhost:18080/nifi-registry-api"
echo ""
echo "📋 Next Steps:"
echo "  ./I2-configure-git-integration.sh   # Setup Git integration"
echo "  ./I3-configure-registry-nifi.sh     # Connect Registry to NiFi"