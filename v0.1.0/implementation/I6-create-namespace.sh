#!/bin/bash
# step-05-create-namespace.sh
# Create infometis namespace

set -eu

NAMESPACE="infometis"

echo "📦 Step 5: Creating Namespace"
echo "=============================="

echo "📋 Creating namespace '$NAMESPACE'..."

# Create namespace
docker exec infometis k0s kubectl create namespace "$NAMESPACE" || {
    if docker exec infometis k0s kubectl get namespace "$NAMESPACE" &>/dev/null; then
        echo "⚠️  Namespace '$NAMESPACE' already exists"
    else
        echo "❌ Failed to create namespace"
        exit 1
    fi
}

echo "✅ Namespace created successfully"

echo "📋 Verifying namespace..."
docker exec infometis k0s kubectl get namespace "$NAMESPACE"

echo ""
echo "🎉 Namespace ready!"
echo "   Namespace: $NAMESPACE"
echo "   Status: Active"