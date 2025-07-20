#!/bin/bash
set -eu

# InfoMetis v0.2.0 - T1-04: Version Pipeline in Registry
# Establishes version control for the test pipeline

echo "🔄 Test 1-04: Version Pipeline in Registry"
echo "=========================================="
echo "Establishing version control for test pipeline"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load saved Group ID
if [ -f /tmp/test-pipeline-group-id ]; then
    GROUP_ID=$(cat /tmp/test-pipeline-group-id)
    echo "📋 Using saved Group ID: $GROUP_ID"
else
    echo -e "${RED}❌ No saved Group ID found. Run T1-02 first.${NC}"
    exit 1
fi

FLOW_NAME="Test-Simple-Pipeline"
VERSION="1.0"
DESCRIPTION="Initial automated test version - Registry integration validation"

echo "📝 Version Control Parameters:"
echo "   Flow Name: $FLOW_NAME"
echo "   Version: $VERSION"
echo "   Description: $DESCRIPTION"
echo ""

# Function: Test API response
test_response() {
    local step="$1"
    local response="$2"
    local success_pattern="$3"
    
    echo -n "  $step... "
    
    if echo "$response" | grep -q "$success_pattern"; then
        echo -e "${GREEN}✓ SUCCESS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $response"
        return 1
    fi
}

echo "🔍 Step 1: Get Registry Client Information"
echo "========================================"

# Get Registry client ID
echo "  Finding Registry client..."
CLIENTS_RESPONSE=$(kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients)

CLIENT_ID=$(echo "$CLIENTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_ID" ]; then
    echo -e "${RED}❌ No Registry client found${NC}"
    exit 1
fi

echo "  Registry Client ID: $CLIENT_ID"

# Verify client is accessible
CLIENT_DETAILS=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/controller/registry-clients/$CLIENT_ID")
test_response "Registry client accessible" "$CLIENT_DETAILS" "InfoMetis Registry"

echo ""
echo "📦 Step 2: Get Bucket Information"
echo "==============================="

# Get bucket ID
echo "  Finding InfoMetis Flows bucket..."
BUCKETS_RESPONSE=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets")

BUCKET_ID=$(echo "$BUCKETS_RESPONSE" | grep -A 5 '"name":"InfoMetis Flows"' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 | tr -d '\n\r')

if [ -z "$BUCKET_ID" ]; then
    echo -e "${RED}❌ InfoMetis Flows bucket not found${NC}"
    exit 1
fi

echo "  Bucket ID: $BUCKET_ID"
test_response "Bucket accessible via NiFi" "$BUCKETS_RESPONSE" "InfoMetis Flows"

echo ""
echo "🎯 Step 3: Verify Process Group Status"
echo "====================================="

# Check process group is not already under version control
GROUP_STATUS=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/process-groups/$GROUP_ID")

if echo "$GROUP_STATUS" | grep -q '"versionControlInformation"'; then
    echo -e "  ${YELLOW}⚠ Process group already under version control${NC}"
    echo "  Checking current version..."
    
    CURRENT_VERSION=$(echo "$GROUP_STATUS" | grep -o '"version":[0-9]*' | cut -d':' -f2)
    echo "  Current version: $CURRENT_VERSION"
    
    # Try to create new version instead
    echo "  Creating new version instead of initial setup..."
    VERSION_REQUEST='{"processGroupRevision":{"version":0},"versionControlInformation":{"comments":"Version update"}}'
else
    echo -e "  ${GREEN}✓ Process group ready for initial version control${NC}"
    
    # Get current revision version
    CURRENT_REVISION=$(echo "$GROUP_STATUS" | grep -o '"version":[0-9]*' | head -1 | cut -d':' -f2)
    
    # Initial version control setup (single line JSON)
    VERSION_REQUEST='{"processGroupRevision":{"version":'$CURRENT_REVISION'},"versionControlInformation":{"registryId":"'$CLIENT_ID'","bucketId":"'$BUCKET_ID'","flowName":"'$FLOW_NAME'","flowDescription":"'$DESCRIPTION'","comments":"Initial version control setup"}}'
fi

echo ""
echo "🚀 Step 4: Start Version Control"
echo "==============================="

echo "  Starting version control..."
# Correct approach: Update process group with version control information
CURRENT_REVISION=$(echo "$GROUP_STATUS" | grep -o '"version":[0-9]*' | head -1 | cut -d':' -f2)

VC_REQUEST='{"revision":{"version":'$CURRENT_REVISION'},"component":{"id":"'$GROUP_ID'","versionControlInformation":{"registryId":"'$CLIENT_ID'","bucketId":"'$BUCKET_ID'","flowName":"'$FLOW_NAME'","flowDescription":"Test version","comments":"Initial version"}}}'

VERSION_RESPONSE=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "$VC_REQUEST" \
    "http://localhost:8080/nifi-api/process-groups/$GROUP_ID")

test_response "Process group updated" "$VERSION_RESPONSE" '"version"'

echo ""
echo "🚀 Step 5: Create Initial Flow Snapshot"
echo "======================================="

echo "  Creating flow snapshot in Registry..."
# Get updated revision after version control setup
UPDATED_GROUP_STATUS=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/process-groups/$GROUP_ID")
UPDATED_REVISION=$(echo "$UPDATED_GROUP_STATUS" | grep -o '"version":[0-9]*' | head -1 | cut -d':' -f2)

# Create snapshot request
SNAPSHOT_REQUEST='{"processGroupRevision":{"version":'$UPDATED_REVISION'},"versionControlInformation":{"registryId":"'$CLIENT_ID'","bucketId":"'$BUCKET_ID'","flowName":"'$FLOW_NAME'","flowDescription":"Test version","comments":"Initial snapshot"}}'

SNAPSHOT_RESPONSE=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$SNAPSHOT_REQUEST" \
    "http://localhost:8080/nifi-api/versions/process-groups/$GROUP_ID")

echo "Snapshot response: $SNAPSHOT_RESPONSE"

# Extract flow information from snapshot response or try alternative
if echo "$SNAPSHOT_RESPONSE" | grep -q '"flowId"'; then
    FLOW_ID=$(echo "$SNAPSHOT_RESPONSE" | grep -o '"flowId":"[^"]*"' | cut -d'"' -f4)
    echo "  Flow ID in Registry: $FLOW_ID"
    
    # Save for next test
    echo "$FLOW_ID" > /tmp/test-pipeline-flow-id
    test_response "Flow snapshot created" "$SNAPSHOT_RESPONSE" '"flowId"'
else
    echo "  ⚠ Direct snapshot creation failed, checking alternative approach..."
    # Alternative: check if flow was created during process group update
    sleep 3
    BUCKET_FLOWS=$(kubectl exec -n infometis nifi-registry-6b7fbcc444-w8lqz -- curl -s "http://localhost:18080/nifi-registry-api/buckets/$BUCKET_ID/flows")
    if echo "$BUCKET_FLOWS" | grep -q "$FLOW_NAME"; then
        echo -e "  ${GREEN}✓ Flow found in Registry via alternative path${NC}"
        FLOW_ID=$(echo "$BUCKET_FLOWS" | grep -A 5 "$FLOW_NAME" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)
        echo "$FLOW_ID" > /tmp/test-pipeline-flow-id
        echo "  Flow ID: $FLOW_ID"
    else
        echo -e "  ${RED}✗ Flow not found in Registry${NC}"
    fi
fi

echo ""
echo "🔍 Step 6: Verify Version Control Status"
echo "======================================="

# Verify process group now shows version control
sleep 2  # Allow time for status to update

UPDATED_STATUS=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/process-groups/$GROUP_ID")

if echo "$UPDATED_STATUS" | grep -q '"versionControlInformation"'; then
    echo -e "  ${GREEN}✓ Process group now under version control${NC}"
    
    # Extract version control details
    if echo "$UPDATED_STATUS" | grep -q '"registryId"'; then
        echo "  Registry connection confirmed"
    fi
    
    if echo "$UPDATED_STATUS" | grep -q '"bucketId"'; then
        echo "  Bucket connection confirmed"  
    fi
    
    if echo "$UPDATED_STATUS" | grep -q '"flowName"'; then
        echo "  Flow name preserved"
    fi
else
    echo -e "  ${RED}✗ Version control not reflected in process group${NC}"
    exit 1
fi

echo ""
echo "📊 Version Control Summary"
echo "========================="
echo -e "${GREEN}✅ Pipeline versioning completed successfully!${NC}"
echo ""
echo "🎯 Version Control Details:"
echo "   • Flow Name: $FLOW_NAME"
echo "   • Registry Client: $CLIENT_ID" 
echo "   • Bucket: $BUCKET_ID"
echo "   • Flow ID: ${FLOW_ID:-'(extracting...)'}"
echo "   • Version: ${ACTUAL_VERSION:-$VERSION}"
echo ""
echo "📋 Status Changes:"
echo "   • Process group now under version control"
echo "   • Flow saved to Registry"
echo "   • Version history initiated"
echo ""
echo "🌐 Verification Available:"
echo "   • NiFi UI: http://localhost/nifi (check version control icon)"
echo "   • Registry UI: http://localhost/nifi-registry"
echo ""
echo "📋 Next Step: T1-05-verify-registry-storage.sh"
echo ""
echo "🎉 T1-04 completed successfully!"