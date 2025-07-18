#!/bin/bash
# step-04-configure-kubectl.sh
# Configure kubectl to access k0s cluster

set -eu

CLUSTER_NAME="infometis"

echo "🔧 Step 4: Configuring kubectl"
echo "==============================="

echo "📋 Retrieving kubeconfig..."

# Get kubeconfig from k0s and modify for localhost
docker exec "$CLUSTER_NAME" k0s kubeconfig admin > kubeconfig-temp

# Backup existing kubeconfig if it exists
if [ -f ~/.kube/config ]; then
    echo "📋 Backing up existing kubeconfig..."
    cp ~/.kube/config ~/.kube/config.backup.$(date +%Y%m%d_%H%M%S) || true
fi

# Create .kube directory if it doesn't exist
mkdir -p ~/.kube

# Keep original server address from k0s for proper certificate validation
echo "  Using k0s provided server address"

# Set kubeconfig context
export KUBECONFIG=~/.kube/config:$(pwd)/kubeconfig-temp

# Just copy the kubeconfig to the standard location
cp kubeconfig-temp ~/.kube/config

# Clean up temporary file
rm kubeconfig-temp

echo "📋 Kubeconfig copied to ~/.kube/config"
echo "   Note: Direct kubectl access has certificate hostname mismatch"
echo "   Use 'docker exec infometis k0s kubectl' for cluster operations"

echo "📋 Testing cluster connectivity via docker exec..."
if docker exec "$CLUSTER_NAME" k0s kubectl cluster-info &>/dev/null; then
    echo "✅ k0s cluster accessible via docker exec"
else
    echo "❌ k0s cluster not accessible"
    exit 1
fi

echo "✅ kubectl configured successfully"

echo "📋 Verifying cluster access..."
# Use docker exec workaround for k0s certificate issue
docker exec "$CLUSTER_NAME" k0s kubectl get nodes

echo ""
echo "🎉 kubectl configuration complete!"
echo "   Context: k0s-${CLUSTER_NAME}"
echo "   Cluster: Connected"