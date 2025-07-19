#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Deploy k0s cluster only (testing segment)
# Test k0s cluster creation and API availability

echo "🚀 InfoMetis v0.2.0 - Deploy k0s Cluster Only"
echo "============================================="
echo "Testing: k0s cluster creation and API"
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

# Load cached k0s image
echo ""
echo "📦 Loading cached k0s image..."
if [[ -f "${CACHE_DIR}/k0sproject-k0s-latest.tar" ]]; then
    docker load -i "${CACHE_DIR}/k0sproject-k0s-latest.tar" >/dev/null 2>&1
    echo "✅ k0s image loaded"
else
    echo "⚠️  k0s image not cached, will pull from registry"
fi

# Create k0s container (using v0.1.0 proven configuration)
echo ""
echo "🏗️  Creating k0s cluster container..."
CLUSTER_NAME="infometis"

if docker ps -q -f name=$CLUSTER_NAME >/dev/null 2>&1; then
    echo "ℹ️  k0s container already running"
elif docker ps -aq -f name=$CLUSTER_NAME >/dev/null 2>&1; then
    echo "🔄 Starting existing k0s container..."
    docker start $CLUSTER_NAME
    echo "✅ k0s container started"
else
    docker run -d --name "$CLUSTER_NAME" \
        --hostname "$CLUSTER_NAME" \
        --privileged \
        --volume /var/lib/k0s \
        --volume /var/lib/containerd \
        --volume /var/lib/etcd \
        --volume /run/k0s \
        --volume /sys/fs/cgroup:/sys/fs/cgroup:rw \
        --volume "${SCRIPT_DIR}/../../:/workspace:rw" \
        --cgroupns=host \
        --restart=unless-stopped \
        --network=host \
        --pid=host \
        --ipc=host \
        --security-opt=apparmor:unconfined \
        --security-opt=seccomp:unconfined \
        --tmpfs=/tmp \
        --tmpfs=/var/logs \
        --tmpfs=/var/run \
        --tmpfs=/var/lib/containerd/io.containerd.grpc.v1.cri/sandboxes \
        --tmpfs=/var/lib/containerd/io.containerd.runtime.v2.task/k8s.io \
        --tmpfs=/var/lib/containerd/tmpmounts \
        --tmpfs=/var/lib/kubelet/pods \
        --tmpfs=/var/lib/kubelet/plugins \
        --tmpfs=/var/lib/kubelet/plugins_registry \
        --tmpfs=/var/lib/k0s/run \
        --tmpfs=/run/k0s \
        --tmpfs=/run/containerd \
        --tmpfs=/run/dockershim.sock \
        --tmpfs=/var/run/secrets/kubernetes.io/serviceaccount \
        --tmpfs=/var/lib/calico \
        --tmpfs=/var/run/calico \
        --tmpfs=/var/lib/cni \
        --tmpfs=/var/run/netns \
        --tmpfs=/var/lib/dockershim \
        --tmpfs=/var/run/docker.sock \
        --tmpfs=/var/run/docker \
        --tmpfs=/var/lib/docker \
        --tmpfs=/var/lib/containers \
        --tmpfs=/tmp/k0s \
        --publish 6443:6443 \
        --publish 80:80 \
        --publish 443:443 \
        --publish 8080:8080 \
        --publish 10249:10249 \
        --publish 10250:10250 \
        --publish 10251:10251 \
        --publish 10252:10252 \
        --publish 10253:10253 \
        --publish 10254:10254 \
        --publish 10255:10255 \
        --publish 10256:10256 \
        --publish 10257:10257 \
        --publish 10258:10258 \
        --publish 10259:10259 \
        --publish 2379:2379 \
        --publish 2380:2380 \
        --publish 6060:6060 \
        --publish 9090:9090 \
        --publish 9100:9100 \
        --publish 9443:9443 \
        k0sproject/k0s:latest
    
    echo "✅ k0s container created"
fi

# Wait for k0s API server - ENHANCED DEBUGGING
echo ""
echo "⏳ Waiting for k0s API server (with debugging)..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    echo "  Attempt $((attempt + 1))/$max_attempts - testing API..."
    
    # Show container status
    echo "  Container status: $(docker ps --format "table {{.Names}}\t{{.Status}}" | grep $CLUSTER_NAME || echo "NOT FOUND")"
    
    # Test the API call with verbose output
    echo "  Testing: docker exec $CLUSTER_NAME k0s kubectl get nodes"
    if docker exec $CLUSTER_NAME k0s kubectl get nodes 2>&1; then
        echo "✅ k0s API server is ready"
        break
    else
        echo "  API check failed, checking container logs..."
        docker logs --tail 5 $CLUSTER_NAME 2>&1 | sed 's/^/    /'
    fi
    
    echo "  Waiting 10 seconds..."
    sleep 10
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ k0s API server failed to start after $max_attempts attempts"
    echo "📋 Final container status:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep $CLUSTER_NAME || echo "Container not found"
    echo "📋 Final container logs:"
    docker logs --tail 20 $CLUSTER_NAME 2>&1 | sed 's/^/  /'
    exit 1
fi

# Configure kubectl
echo ""
echo "🔧 Configuring kubectl..."
docker exec $CLUSTER_NAME cat /var/lib/k0s/pki/admin.conf > /tmp/k0s-kubeconfig-test
export KUBECONFIG=/tmp/k0s-kubeconfig-test

# Update server address in kubeconfig
kubectl config set-cluster local --server=https://localhost:6443
kubectl config set-context --current --cluster=local

echo "✅ kubectl configured"

# Test kubectl access
echo ""
echo "🧪 Testing kubectl access..."
kubectl get nodes
echo "✅ kubectl access confirmed"

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

echo ""
echo "🎉 k0s Cluster Test Complete!"
echo "============================="
echo ""
echo "📊 Cluster Status:"
kubectl get nodes
echo ""
echo "🔗 Access Points:"
echo "  • Cluster API: https://localhost:6443"
echo ""
echo "📋 Next Steps:"
echo "  Run Traefik test: ./D1-traefik-only.sh"
echo "  Run full D1: ./D1-deploy-v0.1.0-foundation.sh"