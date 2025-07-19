#!/bin/bash
set -eu

# Test script - k0s API check only
echo "🧪 Testing k0s API check logic"
echo "============================="

# Check if container exists and is running
if docker ps -q -f name=k0s-infometis >/dev/null 2>&1; then
    echo "✅ k0s container is running"
else
    echo "❌ k0s container not running"
    exit 1
fi

# Test the exact API check from D1 script
echo "🔍 Testing k0s API check..."
max_attempts=5
attempt=0

while [ $attempt -lt $max_attempts ]; do
    echo "Attempt $((attempt + 1))/$max_attempts - testing API..."
    
    # Show what the command returns
    echo "Command output:"
    if docker exec k0s-infometis k0s kubectl get nodes; then
        echo "✅ k0s API server is ready"
        break
    else
        echo "❌ API check failed"
    fi
    
    sleep 5
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ k0s API server failed to start"
    exit 1
else
    echo "🎉 k0s API test completed successfully!"
fi