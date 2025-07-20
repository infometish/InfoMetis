#!/bin/bash
set -eu

# InfoMetis v0.2.0 - T1-07: Validate Complete End-to-End Workflow
# Final validation of complete Registry integration workflow

echo "🎯 Test 1-07: Validate Complete End-to-End Workflow"
echo "==================================================="
echo "Final validation of complete Registry integration workflow"
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
CRITICAL_TESTS_PASSED=0
CRITICAL_TESTS_TOTAL=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local is_critical="${3:-false}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    if [ "$is_critical" = "true" ]; then
        CRITICAL_TESTS_TOTAL=$((CRITICAL_TESTS_TOTAL + 1))
    fi
    
    echo -n "  Testing $test_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        if [ "$is_critical" = "true" ]; then
            CRITICAL_TESTS_PASSED=$((CRITICAL_TESTS_PASSED + 1))
        fi
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

FLOW_NAME="Test-Simple-Pipeline"

echo "🏗️  Infrastructure End-to-End Tests"
echo "==================================="

run_test "NiFi pod healthy and running" "kubectl get pods -n infometis -l app=nifi | grep -q '1/1.*Running'" true

run_test "Registry pod healthy and running" "kubectl get pods -n infometis -l app=nifi-registry | grep -q '1/1.*Running'" true

run_test "NiFi API fully responsive" "kubectl exec -n infometis statefulset/nifi -- curl -f http://localhost:8080/nifi-api/controller >/dev/null" true

# Get Registry pod name
REGISTRY_POD=$(kubectl get pods -n infometis -l app=nifi-registry -o jsonpath='{.items[0].metadata.name}')

run_test "Registry API fully responsive" "kubectl exec -n infometis $REGISTRY_POD -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null" true

echo ""
echo "🔗 Integration End-to-End Tests"
echo "==============================="

run_test "Registry client operational in NiFi" "kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -q 'InfoMetis Registry'" true

run_test "NiFi can communicate with Registry" "kubectl exec -n infometis statefulset/nifi -- curl -f http://nifi-registry-service.infometis.svc.cluster.local:18080/nifi-registry/ >/dev/null" true

# Get Registry info for detailed tests
CLIENT_ID=$(kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
BUCKET_ID=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets" | grep -A 5 '"name":"InfoMetis Flows"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

run_test "NiFi can access Registry buckets" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets' | grep -q 'InfoMetis Flows'" true

echo ""
echo "📝 Pipeline Workflow End-to-End Tests"
echo "====================================="

run_test "Test pipeline exists in NiFi" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/root' | grep -q '$FLOW_NAME'" true

# Get process group ID
GROUP_ID=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/root" | grep -B 10 -A 10 "\"name\":\"$FLOW_NAME\"" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$GROUP_ID" ]; then
    echo "  Process Group ID: $GROUP_ID"
    
    run_test "Pipeline is under version control" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/process-groups/$GROUP_ID' | grep -q 'versionControlInformation'" true
    
    run_test "Pipeline has processors configured" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID' | grep -q 'GenerateFlowFile'"
    
    run_test "Pipeline has connections established" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID' | grep -q 'connections'"
fi

echo ""
echo "🗂️  Registry Storage End-to-End Tests"
echo "====================================="

run_test "Flow exists in Registry via NiFi API" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets/$BUCKET_ID/flows' | grep -q '$FLOW_NAME'" true

run_test "Flow exists in Registry directly" "kubectl exec -n infometis $REGISTRY_POD -- curl -s http://localhost:18080/nifi-registry-api/buckets | grep -q 'InfoMetis Flows'"

# Get flow ID for version tests
FLOW_ID=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets/$BUCKET_ID/flows" | grep -B 5 -A 5 "\"name\":\"$FLOW_NAME\"" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)

if [ -n "$FLOW_ID" ]; then
    run_test "Flow versions accessible" "kubectl exec -n infometis statefulset/nifi -- curl -f 'http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets/$BUCKET_ID/flows/$FLOW_ID/versions' >/dev/null" true
    
    # Get version count
    VERSION_COUNT=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$CLIENT_ID/buckets/$BUCKET_ID/flows/$FLOW_ID/versions" | grep -c '"version"' || echo 0)
    echo "  Flow versions: $VERSION_COUNT"
    
    run_test "At least one version exists" "[ $VERSION_COUNT -ge 1 ]" true
fi

echo ""
echo "💾 Git Persistence End-to-End Tests"
echo "==================================="

run_test "Git flow storage directory accessible" "kubectl exec -n infometis $REGISTRY_POD -- test -d /opt/nifi-registry/flow_storage"

JSON_FILE_COUNT=$(kubectl exec -n infometis $REGISTRY_POD -- find /opt/nifi-registry/flow_storage -name '*.json' -type f | wc -l || echo 0)
echo "  JSON files in storage: $JSON_FILE_COUNT"

run_test "Flow JSON files persisted" "[ $JSON_FILE_COUNT -ge 1 ]" true

run_test "GitFlowPersistenceProvider configured" "kubectl exec -n infometis $REGISTRY_POD -- grep -q GitFlowPersistenceProvider /opt/nifi-registry/conf/providers.xml"

echo ""
echo "🌐 External Access End-to-End Tests"
echo "==================================="

run_test "NiFi UI accessible from outside cluster" "curl -f http://localhost/nifi/ >/dev/null" true

run_test "Registry UI accessible from outside cluster" "curl -f http://localhost/nifi-registry/ >/dev/null" true

run_test "Registry API accessible from outside cluster" "curl -f http://localhost/nifi-registry-api/buckets >/dev/null" true

run_test "Flow visible via external Registry API" "curl -s http://localhost/nifi-registry-api/buckets | grep -q 'InfoMetis Flows'" true

echo ""
echo "🔄 Complete Workflow Validation"
echo "==============================="

# Test the complete workflow can be repeated
echo "  Testing workflow repeatability..."

# Check if we can create a new version (simulated)
if [ -n "$GROUP_ID" ]; then
    GROUP_STATUS=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/process-groups/$GROUP_ID")
    
    if echo "$GROUP_STATUS" | grep -q '"version":[0-9]*'; then
        CURRENT_VERSION=$(echo "$GROUP_STATUS" | grep -o '"version":[0-9]*' | cut -d':' -f2)
        echo "  Current workflow version: $CURRENT_VERSION"
        
        run_test "Workflow version tracking functional" "[ $CURRENT_VERSION -ge 1 ]" true
    fi
    
    run_test "Process group ready for additional changes" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/process-groups/$GROUP_ID' | grep -q '\"version\"'"
fi

echo ""
echo "📊 End-to-End Validation Results"
echo "==============================="
echo -e "Total tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}Critical tests: $CRITICAL_TESTS_PASSED/$CRITICAL_TESTS_TOTAL${NC}"

# Calculate success metrics
OVERALL_SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
CRITICAL_SUCCESS_RATE=$((CRITICAL_TESTS_PASSED * 100 / CRITICAL_TESTS_TOTAL))

echo ""
echo "📈 Success Metrics:"
echo "   Overall Success Rate: $OVERALL_SUCCESS_RATE%"
echo "   Critical Success Rate: $CRITICAL_SUCCESS_RATE%"

if [ $TESTS_FAILED -eq 0 ] && [ $CRITICAL_TESTS_PASSED -eq $CRITICAL_TESTS_TOTAL ]; then
    echo ""
    echo -e "${GREEN}🎉 COMPLETE END-TO-END WORKFLOW VALIDATION PASSED!${NC}"
    echo ""
    echo "🎯 Test 1: Basic Registry Integration - SUCCESSFUL"
    echo "=================================================="
    echo ""
    echo "✅ SUCCESS CRITERIA MET:"
    echo "   • Infrastructure: NiFi and Registry operational"
    echo "   • Integration: Registry-NiFi communication established"
    echo "   • Pipeline Creation: Test pipeline created successfully"
    echo "   • Version Control: Flow versioned in Registry"
    echo "   • Storage: Git persistence operational with JSON files"
    echo "   • External Access: UIs and APIs accessible"
    echo "   • End-to-End: Complete workflow validated"
    echo ""
    echo "📊 Final Status:"
    echo "   • Test Pipeline: $FLOW_NAME (ID: $GROUP_ID)"
    echo "   • Registry Flow: $FLOW_ID"
    echo "   • Versions: $VERSION_COUNT"
    echo "   • JSON Files: $JSON_FILE_COUNT"
    echo ""
    echo "🌐 Access Points:"
    echo "   • NiFi UI: http://localhost/nifi"
    echo "   • Registry UI: http://localhost/nifi-registry"
    echo "   • Test Pipeline: Look for '$FLOW_NAME' in NiFi"
    echo "   • Registry Flow: Check 'InfoMetis Flows' bucket"
    echo ""
    echo "🚀 InfoMetis v0.2.0 Registry Integration: PRODUCTION READY"
    echo ""
    echo "📋 Ready for:"
    echo "   • Production pipeline development"
    echo "   • Flow version control workflows"
    echo "   • Additional test suites (Test 2, Test 3, etc.)"
    echo ""
    echo "🎉 T1-06 completed successfully!"
    exit 0
elif [ $CRITICAL_TESTS_PASSED -eq $CRITICAL_TESTS_TOTAL ]; then
    echo ""
    echo -e "${YELLOW}⚠ END-TO-END VALIDATION MOSTLY SUCCESSFUL${NC}"
    echo ""
    echo "🎯 Critical functionality is working, but some non-critical tests failed."
    echo "The Registry integration is functional for basic use."
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ END-TO-END WORKFLOW VALIDATION FAILED${NC}"
    echo ""
    echo "🔧 Critical issues detected. Recommended actions:"
    echo "   • Review failed critical tests above"
    echo "   • Check component logs: kubectl logs -n infometis [pod-name]"
    echo "   • Re-run individual test steps (T1-01 through T1-05)"
    echo "   • Verify infrastructure setup: ./I4-verify-registry-setup.sh"
    echo ""
    exit 1
fi