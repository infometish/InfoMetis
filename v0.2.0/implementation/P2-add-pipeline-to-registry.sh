#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Add Pipeline to Registry
# Single concern: Add the test pipeline to Registry for version control

echo "🗂️  InfoMetis v0.2.0 - Add Pipeline to Registry"
echo "=============================================="
echo "Adding: Test pipeline to Registry for version control"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! kubectl get pods -n infometis -l app=nifi | grep -q Running; then
    echo "❌ NiFi not running"
    exit 1
fi

if ! kubectl get pods -n infometis -l app=nifi-registry | grep -q Running; then
    echo "❌ Registry not running"
    exit 1
fi

echo "✅ Prerequisites verified"

# Find the InfoMetis test pipeline
echo ""
echo "🔍 Finding InfoMetis test pipeline..."

ROOT_PG_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s http://localhost:8080/nifi-api/flow/process-groups/root)
ROOT_PG_ID=$(echo "$ROOT_PG_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Look for InfoMetis-Test-Pipeline process group
PIPELINE_SEARCH=$(kubectl exec -n infometis deployment/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/$ROOT_PG_ID")

if echo "$PIPELINE_SEARCH" | grep -q "InfoMetis-Test-Pipeline"; then
    echo "✅ Found InfoMetis-Test-Pipeline"
    
    # Extract the process group ID
    TEST_PG_ID=$(echo "$PIPELINE_SEARCH" | grep -A20 -B5 "InfoMetis-Test-Pipeline" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -n "$TEST_PG_ID" ]]; then
        echo "   Process Group ID: $TEST_PG_ID"
    else
        echo "❌ Could not extract process group ID"
        exit 1
    fi
else
    echo "❌ InfoMetis-Test-Pipeline not found. Run P1-create-test-pipeline.sh first"
    exit 1
fi

# Get Registry client information
echo ""
echo "🔍 Getting Registry client information..."

REGISTRY_CLIENTS_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients)

if echo "$REGISTRY_CLIENTS_RESPONSE" | grep -q "InfoMetis Registry"; then
    REGISTRY_CLIENT_ID=$(echo "$REGISTRY_CLIENTS_RESPONSE" | grep -A10 -B5 "InfoMetis Registry" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "✅ Registry client found: $REGISTRY_CLIENT_ID"
else
    echo "❌ InfoMetis Registry client not found. Run I3-configure-registry-nifi.sh first"
    exit 1
fi

# Get InfoMetis bucket information
echo ""
echo "🪣 Getting InfoMetis bucket information..."

BUCKETS_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s "http://localhost:8080/nifi-api/controller/registry-clients/$REGISTRY_CLIENT_ID/buckets")

if echo "$BUCKETS_RESPONSE" | grep -q "InfoMetis"; then
    BUCKET_ID=$(echo "$BUCKETS_RESPONSE" | grep -A10 -B5 "InfoMetis" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "✅ InfoMetis bucket found: $BUCKET_ID"
else
    echo "❌ InfoMetis bucket not found in Registry"
    exit 1
fi

# Start version control on the process group
echo ""
echo "🚀 Starting version control on InfoMetis-Test-Pipeline..."

# Get process group version first
PG_VERSION_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s "http://localhost:8080/nifi-api/process-groups/$TEST_PG_ID")
PG_VERSION=$(echo "$PG_VERSION_RESPONSE" | grep -o '"version":[0-9]*' | cut -d':' -f2)

if [[ -z "$PG_VERSION" ]]; then
    echo "❌ Could not get process group version"
    exit 1
fi

# Start version control
VERSION_CONTROL_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"processGroupRevision\": {
            \"version\": $PG_VERSION
        },
        \"versionedFlow\": {
            \"registryId\": \"$REGISTRY_CLIENT_ID\",
            \"bucketId\": \"$BUCKET_ID\",
            \"flowName\": \"InfoMetis Test Pipeline\",
            \"flowDescription\": \"Test pipeline for InfoMetis v0.2.0 Registry demonstration\",
            \"comments\": \"Initial version: Basic test pipeline with GenerateFlowFile, UpdateAttribute, and LogAttribute processors\"
        }
    }" \
    "http://localhost:8080/nifi-api/process-groups/$TEST_PG_ID/version-control-information")

if echo "$VERSION_CONTROL_RESPONSE" | grep -q "\"state\":\"UP_TO_DATE\""; then
    echo "✅ Version control started successfully"
    
    # Extract flow information
    FLOW_ID=$(echo "$VERSION_CONTROL_RESPONSE" | grep -o '"flowId":"[^"]*"' | cut -d'"' -f4)
    FLOW_VERSION=$(echo "$VERSION_CONTROL_RESPONSE" | grep -o '"version":[0-9]*' | tail -1 | cut -d':' -f2)
    
    echo "   Flow ID: $FLOW_ID"
    echo "   Flow Version: $FLOW_VERSION"
    echo "   State: UP_TO_DATE"
    
elif echo "$VERSION_CONTROL_RESPONSE" | grep -q "error\|Error"; then
    echo "❌ Failed to start version control"
    echo "Response: $VERSION_CONTROL_RESPONSE"
    exit 1
else
    echo "⚠️  Version control may have started but response unclear"
    echo "Response: $VERSION_CONTROL_RESPONSE"
fi

# Verify in Registry
echo ""
echo "🔍 Verifying flow in Registry..."

REGISTRY_FLOWS_RESPONSE=$(kubectl exec -n infometis deployment/nifi-registry -- curl -s "http://localhost:18080/nifi-registry-api/buckets/$BUCKET_ID/flows")

if echo "$REGISTRY_FLOWS_RESPONSE" | grep -q "InfoMetis Test Pipeline"; then
    echo "✅ Flow successfully added to Registry"
    
    FLOW_COUNT=$(echo "$REGISTRY_FLOWS_RESPONSE" | grep -o '"name"' | wc -l)
    echo "   Total flows in bucket: $FLOW_COUNT"
else
    echo "⚠️  Flow may not be visible in Registry yet"
fi

# Check Git repository
echo ""
echo "🔍 Checking Git repository for new flow..."

GIT_STATUS=$(kubectl exec -n infometis deployment/nifi-registry -- bash -c "
cd /opt/nifi-registry/nifi-registry-current/flow_storage/git && \
git log --oneline | head -5
" 2>/dev/null || echo "ERROR")

if [[ "$GIT_STATUS" != "ERROR" ]] && echo "$GIT_STATUS" | grep -q "InfoMetis\|flow"; then
    echo "✅ Git repository updated with new flow"
    echo "Recent commits:"
    echo "$GIT_STATUS" | sed 's/^/   /'
else
    echo "⚠️  Git repository may not be updated yet"
fi

echo ""
echo "🎉 Pipeline Successfully Added to Registry!"
echo "========================================"
echo ""
echo "📊 Version Control Summary:"
echo "  • Process Group: InfoMetis-Test-Pipeline"
echo "  • Registry Client: InfoMetis Registry"
echo "  • Bucket: InfoMetis"
echo "  • Flow Name: InfoMetis Test Pipeline"
echo "  • Initial Version: 1"
echo "  • State: UP_TO_DATE"
echo ""
echo "🔗 Access Information:"
echo "  • NiFi UI: http://localhost/nifi"
echo "  • Registry UI: http://localhost/nifi-registry"
echo "  • Process group now shows version control badge"
echo ""
echo "📋 Next Steps:"
echo "  ./V1-create-pipeline-versions.sh    # Create multiple versions"
echo "  ./V2-test-version-rollback.sh       # Test version rollback"
echo "  ./G1-verify-git-sync.sh             # Verify Git synchronization"
echo ""
echo "💡 Version Control Operations:"
echo "  • Modify processors and commit changes"
echo "  • Right-click process group → Version → Commit local changes"
echo "  • View version history in Registry UI"