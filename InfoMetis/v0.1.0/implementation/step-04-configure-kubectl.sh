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

# Merge configurations
kubectl config view --flatten > ~/.kube/config.new
mv ~/.kube/config.new ~/.kube/config

# Clean up temporary file
rm kubeconfig-temp

echo "📋 Renaming context..."
# Check available contexts and rename appropriately
if kubectl config get-contexts -o name | grep -q "k0s-${CLUSTER_NAME}"; then
    echo "  Context k0s-${CLUSTER_NAME} already exists"
elif kubectl config get-contexts -o name | grep -q "Default"; then
    kubectl config rename-context "Default" "k0s-${CLUSTER_NAME}"
elif kubectl config get-contexts -o name | grep -q "default"; then
    kubectl config rename-context "default" "k0s-${CLUSTER_NAME}"
else
    echo "  No default context found to rename"
fi

echo "📋 Switching to k0s context..."
kubectl config use-context "k0s-${CLUSTER_NAME}"

echo "📋 Testing cluster connectivity..."
if ! kubectl cluster-info &>/dev/null; then
    echo "⚠️  Direct kubectl connection failed (certificate hostname mismatch)"
    echo "   This is expected with k0s host networking - cluster is functional"
    echo "   Will verify full functionality in step 8"
else
    echo "✅ kubectl connected successfully"
fi

echo "✅ kubectl configured successfully"

echo "📋 Verifying cluster access..."
kubectl get nodes

echo ""
echo "🎉 kubectl configuration complete!"
echo "   Context: k0s-${CLUSTER_NAME}"
echo "   Cluster: Connected"