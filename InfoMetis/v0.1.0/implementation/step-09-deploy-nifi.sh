#\!/bin/bash
# step-09-deploy-nifi.sh
# Deploy NiFi to the k0s cluster

set -eu

NAMESPACE="infometis"
NIFI_MANIFEST="/tmp/nifi-k8s.yaml"

echo "🚀 Step 9: Deploying NiFi"
echo "========================="

echo "📋 Checking NiFi manifest..."
if \! docker exec infometis test -f "$NIFI_MANIFEST"; then
    echo "❌ NiFi manifest not found in container: $NIFI_MANIFEST"
    exit 1
fi
echo "✅ NiFi manifest found"

echo "📋 Deploying NiFi resources..."
docker exec infometis k0s kubectl apply -f "$NIFI_MANIFEST" || {
    echo "❌ Failed to apply NiFi manifest"
    exit 1
}

echo "✅ NiFi resources deployed"

echo "📋 Checking PersistentVolumeClaims..."
docker exec infometis k0s kubectl get pvc -n "$NAMESPACE"

echo "📋 Checking NiFi deployment..."
docker exec infometis k0s kubectl get deployment -n "$NAMESPACE" -l app=nifi

echo "📋 Checking NiFi service..."
docker exec infometis k0s kubectl get service -n "$NAMESPACE" -l app=nifi

echo "📋 Checking NiFi ingress..."
docker exec infometis k0s kubectl get ingress -n "$NAMESPACE" -l app=nifi

echo ""
echo "🎉 NiFi deployment initiated\!"
echo "   Namespace: $NAMESPACE"
echo "   Manifest: $NIFI_MANIFEST"
echo "   Status: Resources created"
EOF < /dev/null
