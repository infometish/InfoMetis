#!/bin/bash
set -eu

# InfoMetis k0s-in-Docker Cluster Setup
# Creates a k0s cluster in Docker optimized for development with cache support

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CLUSTER_NAME="infometis"
K0S_VERSION="latest"
CACHE_DIR="${PROJECT_ROOT}/../../cache/images"
USE_CACHE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --cached)
            USE_CACHE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--cached]"
            echo "  --cached    Use cached container images"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Setting up InfoMetis k0s-in-Docker cluster..."
echo "=============================================="
echo "Cluster name: ${CLUSTER_NAME}"
echo "k0s version: ${K0S_VERSION}"
echo "Use cache: ${USE_CACHE}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "❌ Docker daemon is not running"
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl is not installed"
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Load cached images if requested
load_cached_images() {
    if [[ "${USE_CACHE}" != "true" ]]; then
        return 0
    fi
    
    echo "📦 Loading cached container images..."
    
    local images=(
        "k0sproject-k0s-latest.tar"
        "traefik-latest.tar"
        "apache-nifi-latest.tar"
    )
    
    for image_file in "${images[@]}"; do
        local image_path="${CACHE_DIR}/${image_file}"
        if [[ -f "${image_path}" ]]; then
            echo "  📥 Loading ${image_file}..."
            if docker load -i "${image_path}" >/dev/null 2>&1; then
                echo "  ✅ Loaded ${image_file}"
            else
                echo "  ⚠️  Failed to load ${image_file}"
            fi
        else
            echo "  ⚠️  Cache file not found: ${image_file}"
        fi
    done
    
    echo "✅ Image loading complete"
}

# Create k0s cluster
create_k0s_cluster() {
    echo "🔧 Creating k0s cluster '${CLUSTER_NAME}'..."
    
    # Check if cluster already exists
    if docker ps -a --format "{{.Names}}" | grep -q "^${CLUSTER_NAME}$"; then
        echo "📋 Container '${CLUSTER_NAME}' already exists"
        
        # Check if it's running
        if docker ps --format "{{.Names}}" | grep -q "^${CLUSTER_NAME}$"; then
            echo "✅ k0s cluster is already running"
            return 0
        else
            echo "🔄 Starting existing k0s container..."
            docker start "${CLUSTER_NAME}"
            sleep 5
        fi
    else
        echo "🆕 Creating new k0s container..."
        
        # Create k0s container
        docker run -d \
            --name "${CLUSTER_NAME}" \
            --hostname "${CLUSTER_NAME}" \
            --privileged \
            --publish 6443:6443 \
            --publish 8080:80 \
            --publish 8443:443 \
            --volume /var/lib/k0s \
            --restart unless-stopped \
            "k0sproject/k0s:${K0S_VERSION}"
        
        echo "⏳ Waiting for k0s to start..."
        sleep 10
    fi
    
    echo "✅ k0s cluster created successfully"
}

# Setup kubectl configuration
setup_kubectl() {
    echo "🌐 Setting up kubectl configuration..."
    
    # Wait for k0s to be ready
    echo "⏳ Waiting for k0s API server..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker exec "${CLUSTER_NAME}" k0s kubectl get nodes &>/dev/null; then
            break
        fi
        
        attempt=$((attempt + 1))
        echo "  Attempt ${attempt}/${max_attempts}..."
        sleep 5
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        echo "❌ k0s API server did not become ready within timeout"
        exit 1
    fi
    
    # Get kubeconfig from k0s
    echo "📝 Retrieving kubeconfig..."
    docker exec "${CLUSTER_NAME}" k0s kubeconfig admin > /tmp/k0s-kubeconfig-${CLUSTER_NAME}
    
    # Update kubeconfig context and use directly
    export KUBECONFIG=/tmp/k0s-kubeconfig-${CLUSTER_NAME}
    kubectl config rename-context Default "k0s-${CLUSTER_NAME}"
    kubectl config use-context "k0s-${CLUSTER_NAME}"
    
    # Use k0s kubeconfig directly (no merging needed)
    mkdir -p ~/.kube
    if [[ -f ~/.kube/config ]]; then
        cp ~/.kube/config ~/.kube/config.backup
    fi
    cp /tmp/k0s-kubeconfig-${CLUSTER_NAME} ~/.kube/config
    
    echo "✅ kubectl configuration complete"
}

# Create infometis namespace
create_namespace() {
    echo "📦 Creating infometis namespace..."
    
    kubectl create namespace infometis --dry-run=client -o yaml | kubectl apply -f -
    
    echo "✅ Namespace 'infometis' ready"
}

# Remove master taint for single-node cluster
remove_master_taint() {
    echo "🔓 Removing master taint for single-node cluster..."
    
    # Remove the master taint so pods can be scheduled on control plane
    kubectl taint nodes --all node-role.kubernetes.io/master:NoSchedule- || echo "  📋 Taint may already be removed"
    
    echo "✅ Master taint removed"
}

# Setup Traefik ingress controller
setup_traefik() {
    echo "🌐 Setting up Traefik ingress controller..."
    
    # Apply Traefik RBAC and deployment
    kubectl apply -f - <<EOF
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik-ingress-controller
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: traefik-ingress-controller
rules:
  - apiGroups: [""]
    resources: ["services", "endpoints", "secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["extensions", "networking.k8s.io"]
    resources: ["ingresses", "ingressclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["extensions", "networking.k8s.io"]
    resources: ["ingresses/status"]
    verbs: ["update"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: traefik-ingress-controller
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: traefik-ingress-controller
subjects:
  - kind: ServiceAccount
    name: traefik-ingress-controller
    namespace: kube-system
---
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
      serviceAccountName: traefik-ingress-controller
      containers:
      - name: traefik
        image: traefik:latest
        args:
          - --api.insecure=true
          - --providers.kubernetesingress=true
          - --entrypoints.web.address=:80
          - --entrypoints.websecure.address=:443
        ports:
        - name: web
          containerPort: 80
        - name: websecure
          containerPort: 443
        - name: admin
          containerPort: 8080
---
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
---
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: traefik
spec:
  controller: traefik.io/ingress-controller
EOF
    
    # Wait for Traefik to be ready
    echo "⏳ Waiting for Traefik to be ready..."
    kubectl wait --for=condition=available --timeout=120s deployment/traefik -n kube-system
    
    echo "✅ Traefik ingress controller ready"
}

# Setup local-path StorageClass for persistent volumes
setup_storage_class() {
    echo "💾 Setting up local-path StorageClass..."
    
    # Create local-path StorageClass
    kubectl apply -f - <<EOF
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-path
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
allowVolumeExpansion: true
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-content-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-path
  local:
    path: /var/lib/k0s/storage/nifi-content
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - ${CLUSTER_NAME}
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-database-pv
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-path
  local:
    path: /var/lib/k0s/storage/nifi-database
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - ${CLUSTER_NAME}
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-flowfile-pv
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-path
  local:
    path: /var/lib/k0s/storage/nifi-flowfile
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - ${CLUSTER_NAME}
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nifi-provenance-pv
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-path
  local:
    path: /var/lib/k0s/storage/nifi-provenance
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - ${CLUSTER_NAME}
EOF
    
    # Create storage directories in k0s container
    echo "📁 Creating storage directories..."
    docker exec "${CLUSTER_NAME}" mkdir -p /var/lib/k0s/storage/nifi-content
    docker exec "${CLUSTER_NAME}" mkdir -p /var/lib/k0s/storage/nifi-database
    docker exec "${CLUSTER_NAME}" mkdir -p /var/lib/k0s/storage/nifi-flowfile
    docker exec "${CLUSTER_NAME}" mkdir -p /var/lib/k0s/storage/nifi-provenance
    
    echo "✅ StorageClass and PersistentVolumes ready"
}

# Verify cluster setup
verify_cluster() {
    echo "🔍 Verifying cluster setup..."
    
    # Check nodes
    echo "📋 Cluster nodes:"
    kubectl get nodes
    
    # Check namespaces
    echo "📋 Namespaces:"
    kubectl get namespaces
    
    # Check Traefik
    echo "📋 Traefik status:"
    kubectl get pods -n kube-system -l app=traefik
    
    # Check if infometis namespace exists
    if kubectl get namespace infometis &>/dev/null; then
        echo "✅ infometis namespace exists"
    else
        echo "❌ infometis namespace not found"
        exit 1
    fi
    
    echo "✅ Cluster verification complete"
}

# Display cluster info
display_cluster_info() {
    echo ""
    echo "🎉 InfoMetis k0s cluster setup complete!"
    echo ""
    echo "Cluster Information:"
    echo "  • Cluster name: ${CLUSTER_NAME}"
    echo "  • kubectl context: k0s-${CLUSTER_NAME}"
    echo "  • Namespace: infometis"
    echo "  • Ingress: Traefik"
    echo ""
    echo "Access Information:"
    echo "  • k0s API: https://localhost:6443"
    echo "  • Traefik dashboard: http://localhost:8080"
    echo "  • Applications: http://localhost:8080/<app-path>"
    echo ""
    echo "Next steps:"
    echo "  • Deploy NiFi: ./test-nifi-deployment.sh"
    echo "  • Run full test: ./test-fresh-environment.sh"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    load_cached_images
    create_k0s_cluster
    setup_kubectl
    create_namespace
    remove_master_taint
    setup_traefik
    setup_storage_class
    verify_cluster
    display_cluster_info
}

# Run main function
main "$@"