#!/bin/bash
# step-07-deploy-traefik-manifest.sh
# Deploy Traefik using pre-created manifest files

set -eu

echo "🌐 Step 7: Deploying Traefik Ingress Controller"
echo "==============================================="

echo "📋 Checking Traefik manifest..."
if ! docker exec infometis test -f "/workspace/manifests/traefik-deployment.yaml"; then
    echo "❌ Traefik manifest not found in container: /workspace/manifests/traefik-deployment.yaml"
    exit 1
fi
echo "✅ Traefik manifest found"

echo "📋 Deploying Traefik resources..."
docker exec infometis sh -c "cd /workspace && k0s kubectl apply -f manifests/traefik-deployment.yaml" || {
    echo "❌ Failed to apply Traefik manifest"
    exit 1
}

echo "✅ Traefik resources deployed"

echo "📋 Waiting for Traefik to be ready..."
docker exec infometis sh -c "cd /workspace && k0s kubectl get pods -n kube-system -l app=traefik"

echo "📋 Waiting for deployment to be available..."
docker exec infometis sh -c "cd /workspace && k0s kubectl wait --for=condition=available --timeout=120s deployment/traefik -n kube-system" || {
    echo "⚠️  Deployment not ready within timeout. Checking status..."
    docker exec infometis sh -c "cd /workspace && k0s kubectl describe pods -n kube-system -l app=traefik"
    docker exec infometis sh -c "cd /workspace && k0s kubectl logs -n kube-system -l app=traefik --tail=50"
    exit 1
}

echo "✅ Traefik is ready"

echo "📋 Verifying Traefik components..."
docker exec infometis sh -c "cd /workspace && k0s kubectl get deployment,service,ingressclass -n kube-system | grep traefik"

echo ""
echo "🎉 Traefik ingress controller deployed!"
echo "   Deployment: Ready"
echo "   Service: NodePort"
echo "   IngressClass: traefik"
echo "   Dashboard: http://localhost:8082/dashboard/"
echo "   Web traffic: http://localhost/"
echo "   HTTPS traffic: https://localhost/"