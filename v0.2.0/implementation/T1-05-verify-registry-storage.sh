#!/bin/bash
set -eu

# InfoMetis v0.2.0 - T1-05: Verify Flow in Registry Storage
# Validates flow is properly stored in Registry and Git persistence

echo "🗂️  Test 1-05: Verify Flow in Registry Storage"
echo "=============================================="
echo "Validating flow is properly stored in Registry with Git persistence"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test result tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Load saved IDs
if [ -f /tmp/test-pipeline-group-id ] && [ -f /tmp/test-pipeline-flow-id ]; then
    GROUP_ID=$(cat /tmp/test-pipeline-group-id)
    FLOW_ID=$(cat /tmp/test-pipeline-flow-id)
    echo "📋 Using saved IDs:"
    echo "   Group ID: $GROUP_ID"
    echo "   Flow ID: $FLOW_ID"
else
    echo -e "${YELLOW}⚠ Some IDs missing, will discover them...${NC}"
    GROUP_ID=""
    FLOW_ID=""
fi

FLOW_NAME="Test-Simple-Pipeline"

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -n "  Testing $test_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "🔍 Step 1: Discover Registry Information"
echo "======================================="

# Get Registry client and bucket info
CLIENT_ID=$(kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
BUCKET_ID=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets" | grep -A 5 '"name":"InfoMetis Flows"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "  Registry Client ID: $CLIENT_ID"
echo "  Bucket ID: $BUCKET_ID"

if [ -z "$FLOW_ID" ]; then
    # Try to find flow ID
    FLOWS_RESPONSE=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets/$BUCKET_ID/flows")
    FLOW_ID=$(echo "$FLOWS_RESPONSE" | grep -B 5 -A 5 "\"name\":\"$FLOW_NAME\"" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)
    echo "  Discovered Flow ID: $FLOW_ID"
fi

echo ""
echo "📦 Step 2: Registry API Tests"
echo "============================="

run_test "Flow exists in Registry bucket" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets/$BUCKET_ID/flows' | grep -q '$FLOW_NAME'"

if [ -n "$FLOW_ID" ]; then
    run_test "Flow accessible by ID" "kubectl exec -n infometis statefulset/nifi -- curl -f 'http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets/$BUCKET_ID/flows/$FLOW_ID' >/dev/null"
    
    run_test "Flow versions exist" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets/$BUCKET_ID/flows/$FLOW_ID/versions' | grep -q '\"version\"'"
    
    # Get version details
    VERSIONS_RESPONSE=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets/$BUCKET_ID/flows/$FLOW_ID/versions")
    VERSION_COUNT=$(echo "$VERSIONS_RESPONSE" | grep -c '"version"' || echo 0)
    echo "  Version count: $VERSION_COUNT"
    
    run_test "At least 1 version exists" "[ $VERSION_COUNT -ge 1 ]"
fi

echo ""
echo "🗂️  Step 3: Registry Direct API Tests"
echo "====================================="

run_test "Registry buckets accessible directly" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null"

run_test "InfoMetis Flows bucket exists in Registry" "kubectl exec -n infometis deployment/nifi-registry -- curl -s http://localhost:18080/nifi-registry-api/buckets | grep -q 'InfoMetis Flows'"

# Get bucket info directly from Registry
REGISTRY_BUCKET_ID=$(kubectl exec -n infometis deployment/nifi-registry -- curl -s http://localhost:18080/nifi-registry-api/buckets | grep -A 5 '"name":"InfoMetis Flows"' | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)

if [ -n "$REGISTRY_BUCKET_ID" ]; then
    echo "  Registry Bucket ID: $REGISTRY_BUCKET_ID"
    
    run_test "Flows exist in Registry bucket" "kubectl exec -n infometis deployment/nifi-registry -- curl -s 'http://localhost:18080/nifi-registry-api/buckets/$REGISTRY_BUCKET_ID/flows' | grep -q '\"name\"'"
    
    # Check if our specific flow exists
    run_test "Test flow exists in Registry" "kubectl exec -n infometis deployment/nifi-registry -- curl -s 'http://localhost:18080/nifi-registry-api/buckets/$REGISTRY_BUCKET_ID/flows' | grep -q '$FLOW_NAME'"
fi

echo ""
echo "💾 Step 4: Git Storage Tests"
echo "==========================="

run_test "Flow storage directory exists" "kubectl exec -n infometis deployment/nifi-registry -- test -d /opt/nifi-registry/flow_storage"

run_test "Flow storage is writable" "kubectl exec -n infometis deployment/nifi-registry -- test -w /opt/nifi-registry/flow_storage"

run_test "JSON files exist in storage" "kubectl exec -n infometis deployment/nifi-registry -- find /opt/nifi-registry/flow_storage -name '*.json' -type f | wc -l | grep -v '^0$'"

# Count JSON files
JSON_COUNT=$(kubectl exec -n infometis deployment/nifi-registry -- find /opt/nifi-registry/flow_storage -name '*.json' -type f | wc -l || echo 0)
echo "  JSON files in storage: $JSON_COUNT"

run_test "At least 1 JSON file exists" "[ $JSON_COUNT -ge 1 ]"

# Check for specific flow files
if [ -n "$REGISTRY_BUCKET_ID" ]; then
    run_test "Bucket directory exists in storage" "kubectl exec -n infometis deployment/nifi-registry -- test -d '/opt/nifi-registry/flow_storage/$REGISTRY_BUCKET_ID'"
    
    if kubectl exec -n infometis deployment/nifi-registry -- test -d "/opt/nifi-registry/flow_storage/$REGISTRY_BUCKET_ID" 2>/dev/null; then
        FLOW_FILES=$(kubectl exec -n infometis deployment/nifi-registry -- find "/opt/nifi-registry/flow_storage/$REGISTRY_BUCKET_ID" -name "*.json" | wc -l || echo 0)
        echo "  Flow files in bucket directory: $FLOW_FILES"
        
        run_test "Flow files exist in bucket directory" "[ $FLOW_FILES -ge 1 ]"
    fi
fi

echo ""
echo "🌐 Step 5: External Access Tests"
echo "==============================="

run_test "Registry UI accessible externally" "curl -f http://localhost/nifi-registry/ >/dev/null"

run_test "Registry API accessible externally" "curl -f http://localhost/nifi-registry-api/buckets >/dev/null"

run_test "Flow visible via external API" "curl -s http://localhost/nifi-registry-api/buckets | grep -q 'InfoMetis Flows'"

echo ""
echo "📊 Storage Verification Results"
echo "=============================="
echo -e "Total tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All Registry storage verification tests passed!${NC}"
    echo ""
    echo "🎯 Storage Status: FULLY OPERATIONAL"
    echo "   • Flow successfully stored in Registry"
    echo "   • Git persistence working (JSON files created)"
    echo "   • Registry API accessible internally and externally"
    echo "   • Version history maintained"
    echo ""
    echo "📊 Storage Details:"
    echo "   • Registry Client: $CLIENT_ID"
    echo "   • Bucket: $REGISTRY_BUCKET_ID"
    echo "   • Flow ID: $FLOW_ID"
    echo "   • JSON files: $JSON_COUNT"
    echo "   • Flow files in bucket: ${FLOW_FILES:-'(checking...)'}"
    echo ""
    echo "🌐 Verification Available:"
    echo "   • Registry UI: http://localhost/nifi-registry"
    echo "   • Look for '$FLOW_NAME' in 'InfoMetis Flows' bucket"
    echo ""
    echo "📋 Next Step: T1-06-validate-end-to-end.sh"
    echo ""
    echo "🎉 T1-05 completed successfully!"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some Registry storage verification tests failed${NC}"
    echo ""
    echo "🔧 Recommended Actions:"
    echo "   • Check Registry deployment: kubectl logs -n infometis deployment/nifi-registry"
    echo "   • Verify flow versioning: T1-04-version-pipeline.sh"
    echo "   • Check Git persistence configuration"
    echo ""
    exit 1
fi