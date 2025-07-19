#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Cluster Setup Component
# Component script: k0s cluster creation and configuration

echo "🏗️  InfoMetis v0.2.0 - Cluster Setup Component"
echo "=============================================="
echo "Component: k0s Kubernetes cluster setup"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/../../cache/images"

# Function: Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed or not in PATH"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "❌ Docker daemon is not running"
        return 1
    fi
    
    echo "✅ Prerequisites verified"
    return 0
}

# Function: Load k0s image
load_k0s_image() {
    echo "📦 Loading k0s image..."
    
    if [[ -f "${CACHE_DIR}/k0sproject-k0s-latest.tar" ]]; then
        docker load -i "${CACHE_DIR}/k0sproject-k0s-latest.tar" >/dev/null 2>&1
        echo "✅ k0s image loaded from cache"
    else
        echo "⚠️  k0s image not cached, will pull from registry"
        docker pull k0sproject/k0s:latest
        echo "✅ k0s image pulled"
    fi
}

# Function: Create k0s container
create_k0s_container() {
    echo "🏗️  Creating k0s cluster container..."
    
    if docker ps -q -f name=k0s-infometis >/dev/null 2>&1; then
        echo "ℹ️  k0s container already exists"
        return 0
    fi
    
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
}

# Function: Wait for k0s API
wait_for_k0s_api() {
    echo "⏳ Waiting for k0s API server..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker exec k0s-infometis k0s kubectl get nodes >/dev/null 2>&1; then
            echo "✅ k0s API server is ready"
            return 0
        fi
        
        echo "  Attempt $((attempt + 1))/$max_attempts - waiting..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "❌ k0s API server failed to start"
    return 1
}

# Function: Configure kubectl
configure_kubectl() {
    echo "🔧 Configuring kubectl..."
    
    # Extract kubeconfig
    docker exec k0s-infometis cat /var/lib/k0s/pki/admin.conf > /tmp/k0s-kubeconfig
    export KUBECONFIG=/tmp/k0s-kubeconfig
    
    # Update server address
    kubectl config set-cluster k0s --server=https://localhost:6443
    kubectl config set-context --current --cluster=k0s
    
    echo "✅ kubectl configured"
}

# Function: Setup cluster basics
setup_cluster_basics() {
    echo "📁 Setting up cluster basics..."
    
    # Create infometis namespace
    kubectl create namespace infometis --dry-run=client -o yaml | kubectl apply -f -
    echo "✅ infometis namespace created"
    
    # Remove master node taint
    kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true
    echo "✅ Master taint removed"
}

# Function: Verify cluster
verify_cluster() {
    echo "🔍 Verifying cluster..."
    
    if kubectl get nodes | grep -q Ready; then
        echo "✅ Cluster is ready"
        kubectl get nodes
        return 0
    else
        echo "❌ Cluster not ready"
        return 1
    fi
}

# Main execution
main() {
    local operation="${1:-setup}"
    
    case "$operation" in
        "setup")
            check_prerequisites
            load_k0s_image
            create_k0s_container
            wait_for_k0s_api
            configure_kubectl
            setup_cluster_basics
            verify_cluster
            ;;
        "verify")
            verify_cluster
            ;;
        "configure-kubectl")
            configure_kubectl
            ;;
        *)
            echo "Usage: $0 [setup|verify|configure-kubectl]"
            echo ""
            echo "Operations:"
            echo "  setup           - Complete cluster setup (default)"
            echo "  verify          - Verify cluster status"
            echo "  configure-kubectl - Configure kubectl only"
            exit 1
            ;;
    esac
}

# Export functions for use by other scripts
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
fi