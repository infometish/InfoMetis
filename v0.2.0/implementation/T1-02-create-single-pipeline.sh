#!/bin/bash
set -eu

# InfoMetis v0.2.0 - T1-02: Create Single Test Pipeline
# Creates one clean test pipeline for Registry testing

echo "🧪 Test 1-02: Create Single Test Pipeline"
echo "========================================="
echo "Creating single test pipeline for Registry validation"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PIPELINE_NAME="Test-Simple-Pipeline"

echo "📝 Creating Pipeline: $PIPELINE_NAME"
echo "   Components: GenerateFlowFile → LogAttribute"
echo ""

# Function: Test API call success
test_api_call() {
    local description="$1"
    local response="$2"
    
    echo -n "  $description... "
    
    if echo "$response" | grep -q '"id"'; then
        echo -e "${GREEN}✓ SUCCESS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $response"
        return 1
    fi
}

echo "🔄 Step 1: Create Process Group"
echo "=============================="

# Create process group
process_group_json='{
  "revision": {"version": 0},
  "component": {
    "name": "'$PIPELINE_NAME'",
    "position": {"x": 200, "y": 200}
  }
}'

group_response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$process_group_json" \
    "http://localhost:8080/nifi-api/process-groups/root/process-groups")

test_api_call "Process group creation" "$group_response"

GROUP_ID=$(echo "$group_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$GROUP_ID" ]; then
    echo -e "${RED}❌ Failed to extract group ID${NC}"
    exit 1
fi

echo "  Process Group ID: $GROUP_ID"

echo ""
echo "⚙️  Step 2: Add GenerateFlowFile Processor"
echo "========================================="

# Add GenerateFlowFile processor
generate_processor='{
  "revision": {"version": 0},
  "component": {
    "type": "org.apache.nifi.processors.standard.GenerateFlowFile",
    "position": {"x": 100, "y": 100},
    "config": {
      "properties": {
        "File Size": "1KB",
        "Batch Size": "1",
        "Data Format": "Text",
        "Custom Text": "InfoMetis Test Data - Registry Integration Test"
      },
      "schedulingPeriod": "60 sec",
      "schedulingStrategy": "TIMER_DRIVEN",
      "autoTerminatedRelationships": []
    }
  }
}'

gen_response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$generate_processor" \
    "http://localhost:8080/nifi-api/process-groups/$GROUP_ID/processors")

test_api_call "GenerateFlowFile processor creation" "$gen_response"

GEN_ID=$(echo "$gen_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  GenerateFlowFile ID: $GEN_ID"

echo ""
echo "📝 Step 3: Add LogAttribute Processor"
echo "==================================="

# Add LogAttribute processor
log_processor='{
  "revision": {"version": 0},
  "component": {
    "type": "org.apache.nifi.processors.standard.LogAttribute",
    "position": {"x": 400, "y": 100},
    "config": {
      "properties": {
        "Log Level": "INFO",
        "Log Payload": "true",
        "Attributes to Log": "filename,uuid"
      },
      "autoTerminatedRelationships": ["success"]
    }
  }
}'

log_response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$log_processor" \
    "http://localhost:8080/nifi-api/process-groups/$GROUP_ID/processors")

test_api_call "LogAttribute processor creation" "$log_response"

LOG_ID=$(echo "$log_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  LogAttribute ID: $LOG_ID"

echo ""
echo "🔗 Step 4: Create Connection Between Processors"
echo "=============================================="

# Create connection
connection_json='{
  "revision": {"version": 0},
  "component": {
    "source": {
      "id": "'$GEN_ID'",
      "groupId": "'$GROUP_ID'",
      "type": "PROCESSOR"
    },
    "destination": {
      "id": "'$LOG_ID'",
      "groupId": "'$GROUP_ID'",
      "type": "PROCESSOR"
    },
    "selectedRelationships": ["success"]
  }
}'

conn_response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$connection_json" \
    "http://localhost:8080/nifi-api/process-groups/$GROUP_ID/connections")

test_api_call "Connection creation" "$conn_response"

CONN_ID=$(echo "$conn_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Connection ID: $CONN_ID"

echo ""
echo "🔍 Step 5: Verify Pipeline Creation"
echo "================================="

# Store IDs for next test
echo "$GROUP_ID" > /tmp/test-pipeline-group-id
echo "$GEN_ID" > /tmp/test-pipeline-gen-id  
echo "$LOG_ID" > /tmp/test-pipeline-log-id
echo "$CONN_ID" > /tmp/test-pipeline-conn-id

# Verify pipeline exists
if kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/root" | grep -q "$PIPELINE_NAME"; then
    echo -e "  ${GREEN}✓ Pipeline visible in NiFi${NC}"
else
    echo -e "  ${RED}✗ Pipeline not found in NiFi${NC}"
    exit 1
fi

# Verify processors exist
group_details=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID")

if echo "$group_details" | grep -q "GenerateFlowFile" && echo "$group_details" | grep -q "LogAttribute"; then
    echo -e "  ${GREEN}✓ Both processors present${NC}"
else
    echo -e "  ${RED}✗ Processors missing${NC}"
    exit 1
fi

if echo "$group_details" | grep -q '"connections"'; then
    echo -e "  ${GREEN}✓ Connection established${NC}"
else
    echo -e "  ${RED}✗ Connection missing${NC}"
    exit 1
fi

echo ""
echo "📊 Pipeline Creation Summary"
echo "=========================="
echo -e "${GREEN}✅ Single test pipeline created successfully!${NC}"
echo ""
echo "🎯 Pipeline Details:"
echo "   • Name: $PIPELINE_NAME"
echo "   • Group ID: $GROUP_ID"
echo "   • Components: GenerateFlowFile → LogAttribute"
echo "   • Connection: Established on 'success' relationship"
echo ""
echo "📋 Pipeline Status:"
echo "   • Process Group: Created and visible"
echo "   • Processors: Both present and configured"
echo "   • Connection: Active between processors"
echo "   • Ready for: Version control testing"
echo ""
echo "🌐 Access Information:"
echo "   • NiFi UI: http://localhost/nifi"
echo "   • Find process group: '$PIPELINE_NAME'"
echo ""
echo "📋 Next Step: T1-03-verify-pipeline-creation.sh"
echo ""
echo "🎉 T1-02 completed successfully!"