#!/bin/bash
# step-06-remove-master-taint.sh
# Remove master taint for single-node cluster

set -eu

echo "🔓 Step 6: Removing Master Taint"
echo "================================="

echo "📋 Checking current taints..."
NODE_NAME=$(docker exec infometis k0s kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
echo "   Node: $NODE_NAME"

# Get current taints
TAINTS=$(docker exec infometis k0s kubectl get node "$NODE_NAME" -o jsonpath='{.spec.taints}' || echo "[]")
echo "   Current taints: $TAINTS"

if [ "$TAINTS" = "[]" ] || [ "$TAINTS" = "null" ]; then
    echo "✅ No taints found - node ready for scheduling"
else
    echo "📋 Removing master taint..."
    docker exec infometis k0s kubectl taint nodes "$NODE_NAME" node-role.kubernetes.io/master- || {
        echo "⚠️  Master taint not found or already removed"
    }
    
    # Check if any other taints exist
    REMAINING_TAINTS=$(docker exec infometis k0s kubectl get node "$NODE_NAME" -o jsonpath='{.spec.taints}' || echo "[]")
    if [ "$REMAINING_TAINTS" = "[]" ] || [ "$REMAINING_TAINTS" = "null" ]; then
        echo "✅ All taints removed successfully"
    else
        echo "ℹ️  Remaining taints: $REMAINING_TAINTS"
    fi
fi

echo "📋 Verifying node is schedulable..."
docker exec infometis k0s kubectl get nodes

echo ""
echo "🎉 Master taint configuration complete!"
echo "   Node: $NODE_NAME"
echo "   Schedulable: Yes"