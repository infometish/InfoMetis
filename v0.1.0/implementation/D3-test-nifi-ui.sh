#!/bin/bash
# step-11-test-nifi-ui.sh
# Test NiFi UI accessibility via Traefik ingress

set -eu

NAMESPACE="infometis"

echo "🌐 Step 11: Testing NiFi UI Access"
echo "================================="

echo "📋 Checking NiFi ingress configuration..."
INGRESS_NAME=$(docker exec infometis k0s kubectl get ingress -n "$NAMESPACE" -l app=nifi -o jsonpath='{.items[0].metadata.name}' || echo "")
if [[ -z "$INGRESS_NAME" ]]; then
    echo "❌ No NiFi ingress found"
    exit 1
fi
echo "   Ingress: $INGRESS_NAME"

echo "📋 Getting ingress details..."
docker exec infometis k0s kubectl describe ingress "$INGRESS_NAME" -n "$NAMESPACE"

echo "📋 Checking ingress host configuration..."
INGRESS_HOST=$(docker exec infometis k0s kubectl get ingress "$INGRESS_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}' || echo "localhost")
echo "   Host: $INGRESS_HOST"

echo "📋 Testing NiFi UI accessibility..."
# Test via localhost (since we're using host networking)
if curl -s -f "http://localhost:8080/nifi/" > /dev/null 2>&1; then
    echo "✅ NiFi UI accessible at http://localhost:8080/nifi/"
elif curl -s -f "http://localhost/nifi/" > /dev/null 2>&1; then
    echo "✅ NiFi UI accessible at http://localhost/nifi/"
else
    echo "⚠️  NiFi UI not accessible via HTTP"
    echo "📋 Checking Traefik service..."
    docker exec infometis k0s kubectl get service traefik -n kube-system
    echo "📋 Checking Traefik pods..."
    docker exec infometis k0s kubectl get pods -n kube-system -l app=traefik
    echo "📋 Checking ingress status..."
    docker exec infometis k0s kubectl get ingress -n "$NAMESPACE" -o wide
fi

echo "📋 Testing internal cluster connectivity..."
NIFI_SERVICE=$(docker exec infometis k0s kubectl get service -n "$NAMESPACE" -l app=nifi -o jsonpath='{.items[0].metadata.name}' || echo "")
if [[ -n "$NIFI_SERVICE" ]]; then
    CLUSTER_IP=$(docker exec infometis k0s kubectl get service "$NIFI_SERVICE" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    NIFI_PORT=$(docker exec infometis k0s kubectl get service "$NIFI_SERVICE" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
    
    echo "   Testing cluster IP: $CLUSTER_IP:$NIFI_PORT"
    if docker exec infometis curl -s -f "http://$CLUSTER_IP:$NIFI_PORT/nifi/" > /dev/null 2>&1; then
        echo "✅ NiFi accessible internally at http://$CLUSTER_IP:$NIFI_PORT/nifi/"
    else
        echo "❌ NiFi not accessible internally"
    fi
else
    echo "❌ No NiFi service found for testing"
fi

echo "📋 Port forwarding test (alternative access)..."
echo "   To access NiFi UI manually, run:"
echo "   docker exec infometis k0s kubectl port-forward -n $NAMESPACE service/$NIFI_SERVICE 8080:8080"
echo "   Then access: http://localhost:8080/nifi/"

echo ""
echo "🎉 NiFi UI testing complete!"
echo "   Namespace: $NAMESPACE"
echo "   Ingress: $INGRESS_NAME"
echo "   Host: $INGRESS_HOST"
echo "   Service: $NIFI_SERVICE"