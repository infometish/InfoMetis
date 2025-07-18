#\!/bin/bash
# step-10-verify-nifi.sh
# Wait for NiFi to be ready and verify deployment

set -eu

NAMESPACE="infometis"

echo "⏳ Step 10: Verifying NiFi Deployment"
echo "===================================="

echo "📋 Waiting for NiFi deployment to be ready..."
docker exec infometis k0s kubectl wait --for=condition=available --timeout=300s deployment/nifi -n "$NAMESPACE" || {
    echo "❌ NiFi deployment not ready within timeout"
    echo "📋 Pod details:"
    docker exec infometis k0s kubectl describe pods -n "$NAMESPACE" -l app=nifi
    echo "📋 Pod logs:"
    docker exec infometis k0s kubectl logs -n "$NAMESPACE" -l app=nifi --tail=50
    exit 1
}

echo "✅ NiFi deployment is ready"

echo "📋 Checking NiFi pod status..."
docker exec infometis k0s kubectl get pods -n "$NAMESPACE" -l app=nifi

echo "📋 Checking NiFi service endpoints..."
docker exec infometis k0s kubectl get endpoints -n "$NAMESPACE" -l app=nifi

echo "📋 Checking NiFi ingress status..."
docker exec infometis k0s kubectl get ingress -n "$NAMESPACE" -l app=nifi

echo "📋 Getting NiFi service details..."
NIFI_SERVICE=$(docker exec infometis k0s kubectl get service -n "$NAMESPACE" -l app=nifi -o jsonpath='{.items[0].metadata.name}' || echo "")
if [[ -n "$NIFI_SERVICE" ]]; then
    echo "   Service: $NIFI_SERVICE"
    CLUSTER_IP=$(docker exec infometis k0s kubectl get service "$NIFI_SERVICE" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    echo "   ClusterIP: $CLUSTER_IP"
    PORTS=$(docker exec infometis k0s kubectl get service "$NIFI_SERVICE" -n "$NAMESPACE" -o jsonpath='{.spec.ports[*].port}')
    echo "   Ports: $PORTS"
else
    echo "   ⚠️  No NiFi service found"
fi

echo ""
echo "🎉 NiFi verification complete\!"
echo "   Namespace: $NAMESPACE"
echo "   Status: Ready"
echo "   Service: $NIFI_SERVICE"
