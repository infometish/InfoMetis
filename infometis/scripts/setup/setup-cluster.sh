#!/bin/bash
set -euo pipefail

# InfoMetis kind Cluster Setup for WSL
# Creates a kind cluster optimized for WSL with ingress support

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CLUSTER_NAME="infometis"

echo "🚀 Setting up InfoMetis kind cluster for WSL..."

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check if running in WSL
    if ! grep -q Microsoft /proc/version 2>/dev/null; then
        echo "⚠️  Warning: This script is optimized for WSL. Proceeding anyway..."
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "❌ Docker daemon is not running"
        exit 1
    fi
    
    # Check kind
    if ! command -v kind &> /dev/null; then
        echo "❌ kind is not installed. Install with: go install sigs.k8s.io/kind@latest"
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl is not installed"
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Create kind cluster
create_cluster() {
    echo "🔧 Creating kind cluster '${CLUSTER_NAME}'..."
    
    # Check if cluster already exists
    if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        echo "📋 Cluster '${CLUSTER_NAME}' already exists"
        
        # Verify cluster is accessible
        if kubectl cluster-info --context "kind-${CLUSTER_NAME}" &>/dev/null; then
            echo "✅ Existing cluster is accessible"
            return 0
        else
            echo "⚠️  Existing cluster is not accessible, recreating..."
            kind delete cluster --name="${CLUSTER_NAME}"
        fi
    fi
    
    # Create new cluster
    kind create cluster \
        --name="${CLUSTER_NAME}" \
        --config="${PROJECT_ROOT}/deploy/kind/cluster-config.yaml" \
        --wait=60s
    
    echo "✅ Cluster created successfully"
}

# Setup cluster networking
setup_networking() {
    echo "🌐 Setting up cluster networking..."
    
    # Set kubectl context
    kubectl config use-context "kind-${CLUSTER_NAME}"
    
    # Wait for nodes to be ready
    echo "⏳ Waiting for nodes to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=120s
    
    echo "✅ Networking setup complete"
}

# Create infometis namespace
create_namespace() {
    echo "📦 Creating infometis namespace..."
    
    kubectl create namespace infometis --dry-run=client -o yaml | kubectl apply -f -
    
    echo "✅ Namespace 'infometis' ready"
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
    
    # Check if infometis namespace exists
    if kubectl get namespace infometis &>/dev/null; then
        echo "✅ infometis namespace exists"
    else
        echo "❌ infometis namespace not found"
        exit 1
    fi
    
    echo "✅ Cluster verification complete"
}

# Main execution
main() {
    echo "🎯 InfoMetis Kind Cluster Setup"
    echo "==============================="
    
    check_prerequisites
    create_cluster
    setup_networking
    create_namespace
    verify_cluster
    
    echo ""
    echo "🎉 InfoMetis kind cluster setup complete!"
    echo ""
    echo "Next steps:"
    echo "  • Run: kubectl get nodes"
    echo "  • Run: kubectl get namespaces"
    echo "  • Deploy NiFi with: ./scripts/setup/setup-nifi.sh"
    echo ""
    echo "Cluster access:"
    echo "  • Context: kind-${CLUSTER_NAME}"
    echo "  • Namespace: infometis"
    echo ""
}

# Run main function
main "$@"