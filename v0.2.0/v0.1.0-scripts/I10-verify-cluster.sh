#!/bin/bash
# step-08-verify-cluster.sh
# Verify complete cluster setup

set -eu

CLUSTER_NAME="infometis"
NAMESPACE="infometis"

echo "🔍 Step 8: Verifying Cluster Setup"
echo "==================================="

echo "📋 Checking cluster components..."

# Check k0s container
echo "• k0s Container:"
if docker ps --format "{{.Names}}\t{{.Status}}" | grep -q "^${CLUSTER_NAME}"; then
    docker ps --format "{{.Names}}\t{{.Status}}" | grep "^${CLUSTER_NAME}"
    echo "  ✅ k0s container running"
else
    echo "  ❌ k0s container not running"
    exit 1
fi

# Check docker exec infometis k0s kubectl connectivity
echo "• docker exec infometis k0s kubectl Connectivity:"
if docker exec infometis k0s kubectl cluster-info &>/dev/null; then
    echo "  ✅ docker exec infometis k0s kubectl connected to cluster"
else
    echo "  ❌ docker exec infometis k0s kubectl cannot connect to cluster"
    exit 1
fi

# Check nodes
echo "• Cluster Nodes:"
docker exec infometis k0s kubectl get nodes
NODE_STATUS=$(docker exec infometis k0s kubectl get nodes --no-headers | awk '{print $2}' | head -1)
if [ "$NODE_STATUS" = "Ready" ]; then
    echo "  ✅ Node is ready"
else
    echo "  ❌ Node status: $NODE_STATUS"
    exit 1
fi

# Check namespace
echo "• Namespace:"
if docker exec infometis k0s kubectl get namespace "$NAMESPACE" &>/dev/null; then
    echo "  ✅ $NAMESPACE namespace exists"
else
    echo "  ❌ $NAMESPACE namespace not found"
    exit 1
fi

# Check Traefik
echo "• Traefik Ingress:"
if docker exec infometis k0s kubectl get deployment traefik -n kube-system &>/dev/null; then
    TRAEFIK_STATUS=$(docker exec infometis k0s kubectl get deployment traefik -n kube-system -o jsonpath='{.status.conditions[?(@.type=="Available")].status}')
    if [ "$TRAEFIK_STATUS" = "True" ]; then
        echo "  ✅ Traefik deployment ready"
    else
        echo "  ❌ Traefik deployment not ready"
        docker exec infometis k0s kubectl get pods -n kube-system -l app=traefik
        exit 1
    fi
else
    echo "  ❌ Traefik deployment not found"
    exit 1
fi

# Check IngressClass
echo "• IngressClass:"
if docker exec infometis k0s kubectl get ingressclass traefik &>/dev/null; then
    echo "  ✅ traefik IngressClass configured"
else
    echo "  ❌ traefik IngressClass not found"
    exit 1
fi

echo ""
echo "🎉 Cluster verification complete!"
echo "================================="
echo "✅ k0s cluster ready"
echo "✅ docker exec infometis k0s kubectl configured"
echo "✅ Node schedulable"
echo "✅ Namespace created"
echo "✅ Traefik ingress ready"
echo "✅ IngressClass configured"
echo ""
echo "🚀 Ready for NiFi deployment!"
echo "   Cluster: $CLUSTER_NAME"
echo "   Context: k0s-$CLUSTER_NAME"
echo "   Namespace: $NAMESPACE"
echo "   Ingress: Traefik"