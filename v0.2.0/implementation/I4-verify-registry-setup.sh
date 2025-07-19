#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Verify Registry Setup
# Single concern: Comprehensive verification of Registry integration

echo "🔍 InfoMetis v0.2.0 - Verify Registry Setup"
echo "=========================================="
echo "Verifying: Complete Registry integration and Git setup"
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

# Test Registry deployment
echo "🗂️  Testing Registry Deployment"
echo "=============================="

run_test "Registry deployment exists" "kubectl get deployment nifi-registry -n infometis"
run_test "Registry pod running" "kubectl get pods -n infometis -l app=nifi-registry | grep -q Running"
run_test "Registry service accessible" "kubectl get service registry-service -n infometis"
run_test "Registry PVC bound" "kubectl get pvc registry-pvc -n infometis | grep -q Bound"

echo ""

# Test Registry API
echo "🔌 Testing Registry API"
echo "======================"

run_test "Registry API responding" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets"
run_test "Registry buckets endpoint" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets | grep -q '\[\]\\|InfoMetis'"
run_test "Registry flow endpoint" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/flows"

echo ""

# Test Git integration
echo "🔗 Testing Git Integration"
echo "========================="

run_test "Git repository exists" "kubectl exec -n infometis deployment/nifi-registry -- test -d /opt/nifi-registry/nifi-registry-current/flow_storage/git/.git"
run_test "Git config valid" "kubectl exec -n infometis deployment/nifi-registry -- bash -c 'cd /opt/nifi-registry/nifi-registry-current/flow_storage/git && git config user.name'"
run_test "Git initial commit" "kubectl exec -n infometis deployment/nifi-registry -- bash -c 'cd /opt/nifi-registry/nifi-registry-current/flow_storage/git && git log --oneline | grep -q \"Initial commit\"'"
run_test "Git working directory clean" "kubectl exec -n infometis deployment/nifi-registry -- bash -c 'cd /opt/nifi-registry/nifi-registry-current/flow_storage/git && git status --porcelain | wc -l | grep -q \"^0$\"'"

echo ""

# Test NiFi-Registry integration
echo "🔗 Testing NiFi-Registry Integration"
echo "==================================="

run_test "NiFi Registry client exists" "kubectl exec -n infometis deployment/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -q 'InfoMetis Registry'"
run_test "Registry reachable from NiFi" "kubectl exec -n infometis deployment/nifi -- curl -f http://registry-service.infometis.svc.cluster.local:18080/nifi-registry-api/buckets"
run_test "NiFi can list Registry buckets" "kubectl exec -n infometis deployment/nifi -- curl -s http://registry-service.infometis.svc.cluster.local:18080/nifi-registry-api/buckets | grep -q '\[\]\\|InfoMetis'"

echo ""

# Test InfoMetis bucket
echo "🪣 Testing InfoMetis Bucket"
echo "=========================="

BUCKET_RESPONSE=$(kubectl exec -n infometis deployment/nifi-registry -- curl -s http://localhost:18080/nifi-registry-api/buckets 2>/dev/null || echo "[]")

if echo "$BUCKET_RESPONSE" | grep -q "InfoMetis"; then
    run_test "InfoMetis bucket exists" "echo '$BUCKET_RESPONSE' | grep -q InfoMetis"
    
    BUCKET_ID=$(echo "$BUCKET_RESPONSE" | grep -A5 -B5 "InfoMetis" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4 || echo "")
    if [[ -n "$BUCKET_ID" ]]; then
        run_test "InfoMetis bucket accessible" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets/$BUCKET_ID"
        run_test "Bucket flows endpoint" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets/$BUCKET_ID/flows"
    else
        echo -e "${RED}  ✗ Could not extract bucket ID${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 2))
        TESTS_TOTAL=$((TESTS_TOTAL + 2))
    fi
else
    echo -e "${RED}  ✗ InfoMetis bucket not found${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 3))
    TESTS_TOTAL=$((TESTS_TOTAL + 3))
fi

echo ""

# Test configuration files
echo "⚙️  Testing Configuration"
echo "========================"

run_test "Registry providers.xml exists" "kubectl exec -n infometis deployment/nifi-registry -- test -f /opt/nifi-registry/nifi-registry-current/conf/providers.xml"
run_test "Git provider configured" "kubectl exec -n infometis deployment/nifi-registry -- grep -q GitFlowPersistenceProvider /opt/nifi-registry/nifi-registry-current/conf/providers.xml"
run_test "Flow storage directory exists" "kubectl exec -n infometis deployment/nifi-registry -- test -d /opt/nifi-registry/nifi-registry-current/flow_storage/git"

echo ""

# Summary
echo "📊 Test Summary"
echo "==============="
echo -e "Total tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Registry setup is complete${NC}"
    echo ""
    echo "📋 Registry Information:"
    echo "=============================="
    echo "• Registry UI: http://localhost/nifi-registry"
    echo "• Registry API: http://localhost:18080/nifi-registry-api"
    echo "• Git Repository: Initialized and ready"
    echo "• Default Bucket: InfoMetis"
    echo "• NiFi Integration: Connected and verified"
    echo ""
    echo "🔄 Version Control Workflow:"
    echo "=============================="
    echo "1. Create a process group in NiFi"
    echo "2. Right-click → Version → Start version control"
    echo "3. Select 'InfoMetis Registry' and 'InfoMetis' bucket"
    echo "4. Changes will be versioned in Git automatically"
    echo ""
    echo "📋 Ready for Pipeline Testing:"
    echo "=============================="
    echo "• ./P1-create-test-pipeline.sh        # Create test pipeline"
    echo "• ./P2-add-pipeline-to-registry.sh    # Add to Registry"
    echo "• ./V1-create-pipeline-versions.sh    # Create versions"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Check the issues above${NC}"
    echo ""
    echo "🔧 Common Issues:"
    echo "================"
    echo "• Registry may still be starting up (wait 2-3 minutes)"
    echo "• Check Registry logs: kubectl logs -n infometis deployment/nifi-registry"
    echo "• Verify Git integration: kubectl exec -n infometis deployment/nifi-registry -- git status"
    echo "• Check NiFi connectivity: kubectl exec -n infometis deployment/nifi -- curl registry-service.infometis.svc.cluster.local:18080"
    echo ""
    exit 1
fi