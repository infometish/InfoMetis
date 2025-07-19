#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Deploy v0.1.0 InfoMetis (NiFi)
# Condensed deployment of NiFi with persistent storage

echo "🚀 InfoMetis v0.2.0 - Deploy v0.1.0 InfoMetis"
echo "============================================"
echo "Deploying: NiFi with persistent storage"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/../../cache/images"

# Check if foundation is deployed
echo "🔍 Checking foundation deployment..."
if ! kubectl get namespace infometis >/dev/null 2>&1; then
    echo "❌ Foundation not deployed. Run D1-deploy-v0.1.0-foundation.sh first"
    exit 1
fi

if ! kubectl get deployment traefik -n kube-system >/dev/null 2>&1; then
    echo "❌ Traefik not deployed. Run D1-deploy-v0.1.0-foundation.sh first"
    exit 1
fi

echo "✅ Foundation deployment verified"

# Load cached images
echo ""
echo "📦 Loading cached NiFi image..."
if [[ -f "${CACHE_DIR}/apache-nifi-1.23.2.tar" ]]; then
    docker load -i "${CACHE_DIR}/apache-nifi-1.23.2.tar" >/dev/null 2>&1
    echo "✅ NiFi image loaded"
else
    echo "⚠️  NiFi image not cached, will pull from registry"
fi

# Setup local storage
echo ""
echo "💾 Setting up persistent storage..."

# Create local storage class
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: false
EOF

# Create persistent volume
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

echo "✅ Storage configured"

# Deploy NiFi
echo ""
echo "🌊 Deploying NiFi..."

kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nifi
  namespace: infometis
  labels:
    app: nifi
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

# Create NiFi Service
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: nifi-service
  namespace: infometis
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

# Create NiFi Ingress
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nifi-ingress
  namespace: infometis
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.ingress.kubernetes.io/router.middlewares: default-redirect-https@kubernetescrd
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

echo "✅ NiFi deployed"

# Wait for NiFi to be ready
echo ""
echo "⏳ Waiting for NiFi to be ready..."
echo "This may take several minutes as NiFi initializes..."

kubectl wait --for=condition=available deployment/nifi -n infometis --timeout=600s

# Wait for NiFi to be actually responsive
echo ""
echo "⏳ Waiting for NiFi API to be responsive..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if kubectl exec -n infometis deployment/nifi -- curl -f http://localhost:8080/nifi-api/system-diagnostics >/dev/null 2>&1; then
        echo "✅ NiFi API is responsive"
        break
    fi
    
    echo "  Attempt $((attempt + 1))/$max_attempts - waiting for NiFi API..."
    sleep 20
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "⚠️  NiFi API may not be fully ready yet, but deployment is complete"
fi

echo ""
echo "🎉 v0.1.0 InfoMetis Deployment Complete!"
echo "======================================="
echo ""
echo "📊 NiFi Status:"
kubectl get pods -n infometis -l app=nifi
echo ""
echo "💾 Storage Status:"
kubectl get pv,pvc -n infometis
echo ""
echo "🔗 Access Points:"
echo "  • NiFi UI: http://localhost/nifi"
echo "  • NiFi Direct: kubectl port-forward -n infometis deployment/nifi 8080:8080"
echo "  • Credentials: admin / infometis2024"
echo ""
echo "📋 Next Steps:"
echo "  ./D3-verify-v0.1.0-foundation.sh  # Verify complete foundation"
echo "  ./I1-deploy-registry.sh           # Deploy NiFi Registry (v0.2.0)"