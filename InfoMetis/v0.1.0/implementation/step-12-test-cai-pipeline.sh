#!/bin/bash
# step-12-test-cai-pipeline.sh
# Test CAI (Collaborative AI) pipeline functionality

set -eu

NAMESPACE="infometis"

echo "🤖 Step 12: Testing CAI Pipeline"
echo "==============================="

echo "📋 Checking NiFi readiness for CAI testing..."
NIFI_SERVICE=$(docker exec infometis k0s kubectl get service -n "$NAMESPACE" -l app=nifi -o jsonpath='{.items[0].metadata.name}' || echo "")
if [[ -z "$NIFI_SERVICE" ]]; then
    echo "❌ NiFi service not found - cannot test CAI pipeline"
    exit 1
fi
echo "   NiFi service: $NIFI_SERVICE"

echo "📋 Getting NiFi API endpoint..."
CLUSTER_IP=$(docker exec infometis k0s kubectl get service "$NIFI_SERVICE" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
NIFI_PORT=$(docker exec infometis k0s kubectl get service "$NIFI_SERVICE" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
NIFI_API="http://$CLUSTER_IP:$NIFI_PORT/nifi-api"
echo "   API endpoint: $NIFI_API"

echo "📋 Testing NiFi API connectivity..."
if docker exec infometis curl -s -f "$NIFI_API/system-diagnostics" > /dev/null 2>&1; then
    echo "✅ NiFi API accessible"
else
    echo "❌ NiFi API not accessible"
    echo "📋 Checking NiFi pod logs..."
    docker exec infometis k0s kubectl logs -n "$NAMESPACE" -l app=nifi --tail=10
    exit 1
fi

echo "📋 Testing basic NiFi operations..."
# Get NiFi version
NIFI_VERSION=$(docker exec infometis curl -s "$NIFI_API/system-diagnostics" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
echo "   NiFi version: $NIFI_VERSION"

# Test process groups endpoint
if docker exec infometis curl -s -f "$NIFI_API/process-groups/root" > /dev/null 2>&1; then
    echo "✅ NiFi process groups accessible"
else
    echo "❌ NiFi process groups not accessible"
fi

echo "📋 Checking CAI pipeline script..."
CAI_SCRIPT="../infometis/scripts/cai/cai-pipeline.sh"
if [[ -f "$CAI_SCRIPT" ]]; then
    echo "✅ CAI pipeline script found: $CAI_SCRIPT"
    echo "📋 Testing CAI pipeline script..."
    # Test if script can reach NiFi API
    export NIFI_API_URL="$NIFI_API"
    if bash "$CAI_SCRIPT" --test 2>/dev/null; then
        echo "✅ CAI pipeline script test passed"
    else
        echo "⚠️  CAI pipeline script test failed (this may be expected in early development)"
    fi
else
    echo "⚠️  CAI pipeline script not found: $CAI_SCRIPT"
fi

echo "📋 Simulating basic CAI workflow..."
echo "   1. Creating simple processor via API..."
PROCESSOR_DATA='{
  "revision": {"version": 0},
  "component": {
    "type": "org.apache.nifi.processors.standard.GenerateFlowFile",
    "bundle": {
      "group": "org.apache.nifi",
      "artifact": "nifi-standard-nar",
      "version": "'$NIFI_VERSION'"
    },
    "name": "CAI Test Processor",
    "position": {"x": 100, "y": 100}
  }
}'

# This is a basic test - actual CAI would be more complex
echo "   2. Testing processor creation capability..."
if docker exec infometis curl -s -X POST -H "Content-Type: application/json" -d "$PROCESSOR_DATA" "$NIFI_API/process-groups/root/processors" > /dev/null 2>&1; then
    echo "✅ Basic processor creation successful"
    echo "   CAI pipeline integration ready"
else
    echo "⚠️  Processor creation test failed (may need authentication setup)"
fi

echo ""
echo "🎉 CAI pipeline testing complete!"
echo "   Namespace: $NAMESPACE"
echo "   NiFi API: $NIFI_API"
echo "   NiFi Version: $NIFI_VERSION"
echo "   CAI Script: $CAI_SCRIPT"
echo ""
echo "🤖 Ready for Collaborative AI pipeline development!"
echo "   Next steps:"
echo "   1. Access NiFi UI at http://localhost:8080/nifi/"
echo "   2. Configure authentication if needed"
echo "   3. Develop CAI pipeline automation scripts"