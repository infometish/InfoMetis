#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Deploy Traefik only (testing segment)
# Assumes k0s cluster is already running and configured

echo "🚀 InfoMetis v0.2.0 - Deploy Traefik Only"
echo "=========================================="
echo "Testing: Traefik ingress deployment"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/../../cache/images"

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if k0s cluster is running
CLUSTER_NAME="infometis"
if ! docker ps -q -f name=$CLUSTER_NAME >/dev/null 2>&1; then
    echo "❌ k0s container is not running. Run D1-k0s-only.sh first."
    exit 1
fi

# Set kubeconfig
export KUBECONFIG=/tmp/k0s-kubeconfig-test

# Test kubectl access
echo "🧪 Testing kubectl access..."
if ! kubectl get nodes >/dev/null 2>&1; then
    echo "❌ kubectl cannot access cluster. Run D1-k0s-only.sh first."
    exit 1
fi
echo "✅ kubectl access confirmed"

# Load cached Traefik image
echo ""
echo "📦 Loading cached Traefik image..."
if [[ -f "${CACHE_DIR}/traefik-latest.tar" ]]; then
    docker load -i "${CACHE_DIR}/traefik-latest.tar" >/dev/null 2>&1
    echo "✅ Traefik image loaded"
else
    echo "⚠️  Traefik image not cached, will pull from registry"
fi

# Deploy Traefik
echo ""
echo "🌐 Deploying Traefik ingress..."

# Create Traefik ServiceAccount
echo "Creating Traefik ServiceAccount..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik
  namespace: kube-system
EOF

# Create Traefik ClusterRole
echo "Creating Traefik ClusterRole..."
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
echo "Creating Traefik ClusterRoleBinding..."
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
echo "Creating Traefik IngressClass..."
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: traefik
spec:
  controller: traefik.io/ingress-controller
EOF

# Deploy Traefik
echo "Creating Traefik Deployment..."
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
echo "Creating Traefik Service..."
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
echo "🎉 Traefik Test Complete!"
echo "========================="
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
echo "  Test Traefik dashboard: curl -I http://localhost:8080"
echo "  Run NiFi deployment: ./D2-deploy-v0.1.0-infometis.sh"