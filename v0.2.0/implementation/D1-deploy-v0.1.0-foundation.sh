#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Deploy v0.1.0 Foundation (Cluster + Traefik)
# Condensed deployment of k0s cluster and Traefik ingress

echo "🚀 InfoMetis v0.2.0 - Deploy v0.1.0 Foundation"
echo "=============================================="
echo "Deploying: k0s cluster + Traefik ingress"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/../../cache/images"

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Load cached images
echo ""
echo "📦 Loading cached images..."
if [[ -f "${CACHE_DIR}/k0sproject-k0s-latest.tar" ]]; then
    docker load -i "${CACHE_DIR}/k0sproject-k0s-latest.tar" >/dev/null 2>&1
    echo "✅ k0s image loaded"
else
    echo "⚠️  k0s image not cached, will pull from registry"
fi

if [[ -f "${CACHE_DIR}/traefik-latest.tar" ]]; then
    docker load -i "${CACHE_DIR}/traefik-latest.tar" >/dev/null 2>&1
    echo "✅ Traefik image loaded"
else
    echo "⚠️  Traefik image not cached, will pull from registry"
fi

# Create k0s container
echo ""
echo "🏗️  Creating k0s cluster container..."
if docker ps -q -f name=k0s-infometis >/dev/null 2>&1; then
    echo "ℹ️  k0s container already exists"
else
    docker run -d --name k0s-infometis \
        --hostname k0s-infometis \
        --privileged \
        -v /var/lib/k0s \
        -p 6443:6443 \
        -p 8080:8080 \
        -p 80:80 \
        -p 443:443 \
        k0sproject/k0s:latest
    
    echo "✅ k0s container created"
fi

# Wait for k0s API server
echo ""
echo "⏳ Waiting for k0s API server..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec k0s-infometis k0s kubectl get nodes >/dev/null 2>&1; then
        echo "✅ k0s API server is ready"
        break
    fi
    
    echo "  Attempt $((attempt + 1))/$max_attempts - waiting..."
    sleep 10
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ k0s API server failed to start"
    exit 1
fi

# Configure kubectl
echo ""
echo "🔧 Configuring kubectl..."
docker exec k0s-infometis cat /var/lib/k0s/pki/admin.conf > /tmp/k0s-kubeconfig
export KUBECONFIG=/tmp/k0s-kubeconfig

# Update server address in kubeconfig
kubectl config set-cluster k0s --server=https://localhost:6443
kubectl config set-context --current --cluster=k0s

echo "✅ kubectl configured"

# Create infometis namespace
echo ""
echo "📁 Creating infometis namespace..."
kubectl create namespace infometis --dry-run=client -o yaml | kubectl apply -f -
echo "✅ Namespace created"

# Remove master node taint
echo ""
echo "🔧 Removing master node taint..."
kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true
echo "✅ Master taint removed"

# Deploy Traefik
echo ""
echo "🌐 Deploying Traefik ingress..."

# Create Traefik ServiceAccount
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik
  namespace: kube-system
EOF

# Create Traefik ClusterRole
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: traefik
rules:
- apiGroups: [""]
  resources: ["services","endpoints","secrets"]
  verbs: ["get","list","watch"]
- apiGroups: ["extensions","networking.k8s.io"]
  resources: ["ingresses","ingressclasses"]
  verbs: ["get","list","watch"]
- apiGroups: ["extensions","networking.k8s.io"]
  resources: ["ingresses/status"]
  verbs: ["update"]
EOF

# Create Traefik ClusterRoleBinding
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: traefik
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: traefik
subjects:
- kind: ServiceAccount
  name: traefik
  namespace: kube-system
EOF

# Create Traefik IngressClass
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: traefik
spec:
  controller: traefik.io/ingress-controller
EOF

# Deploy Traefik
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traefik
  namespace: kube-system
  labels:
    app: traefik
spec:
  replicas: 1
  selector:
    matchLabels:
      app: traefik
  template:
    metadata:
      labels:
        app: traefik
    spec:
      serviceAccountName: traefik
      containers:
      - name: traefik
        image: traefik:latest
        args:
        - --api.insecure=true
        - --providers.kubernetesingress=true
        - --providers.kubernetesingress.ingressclass=traefik
        - --entrypoints.web.address=:80
        - --entrypoints.websecure.address=:443
        - --log.level=INFO
        ports:
        - name: web
          containerPort: 80
          hostPort: 80
        - name: websecure
          containerPort: 443
          hostPort: 443
        - name: admin
          containerPort: 8080
          hostPort: 8080
      hostNetwork: true
      tolerations:
      - key: node-role.kubernetes.io/control-plane
        effect: NoSchedule
EOF

# Create Traefik Service
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: traefik
  namespace: kube-system
spec:
  selector:
    app: traefik
  ports:
  - name: web
    port: 80
    targetPort: 80
  - name: websecure
    port: 443
    targetPort: 443
  - name: admin
    port: 8080
    targetPort: 8080
  type: ClusterIP
EOF

echo "✅ Traefik deployed"

# Wait for Traefik to be ready
echo ""
echo "⏳ Waiting for Traefik to be ready..."
kubectl wait --for=condition=available deployment/traefik -n kube-system --timeout=300s

echo ""
echo "🎉 v0.1.0 Foundation Deployment Complete!"
echo "========================================"
echo ""
echo "📊 Cluster Status:"
kubectl get nodes
echo ""
echo "🌐 Traefik Status:"
kubectl get pods -n kube-system -l app=traefik
echo ""
echo "🔗 Access Points:"
echo "  • Traefik Dashboard: http://localhost:8080"
echo "  • Cluster API: https://localhost:6443"
echo ""
echo "📋 Next Steps:"
echo "  ./D2-deploy-v0.1.0-infometis.sh  # Deploy NiFi"
echo "  ./D3-verify-v0.1.0-foundation.sh  # Verify deployment"