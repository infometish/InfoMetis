#!/bin/bash
# step-03-wait-for-k0s-api.sh
# Wait for k0s API server to be ready

set -eu

CLUSTER_NAME="infometis"

echo "⏳ Step 3: Waiting for k0s API Server"
echo "====================================="

echo "📋 Waiting for k0s to start..."

# Wait for k0s service to be ready
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec "$CLUSTER_NAME" k0s kubectl get nodes &>/dev/null; then
        echo "✅ k0s API server is ready"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 5
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ k0s API server failed to start within timeout"
    echo "📋 Container logs:"
    docker logs "$CLUSTER_NAME" --tail 20
    exit 1
fi

echo "📋 Verifying k0s status..."
docker exec "$CLUSTER_NAME" k0s status

echo ""
echo "🎉 k0s API server is ready!"
echo "   Cluster: $CLUSTER_NAME"
echo "   API: Available"