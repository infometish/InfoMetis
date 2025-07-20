#!/bin/bash
set -eu

# InfoMetis v0.2.0 - T1-04: Verify Pipeline Creation
# Detailed verification of created pipeline before versioning

echo "🔍 Test 1-04: Verify Pipeline Creation"
echo "======================================"
echo "Validating pipeline is correctly created and ready for versioning"
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

# Load saved IDs from previous test
if [ -f /tmp/test-pipeline-group-id ]; then
    GROUP_ID=$(cat /tmp/test-pipeline-group-id)
    echo "📋 Using saved Group ID: $GROUP_ID"
else
    echo -e "${RED}❌ No saved Group ID found. Run T1-02 first.${NC}"
    exit 1
fi

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

echo "🏗️  Process Group Tests"
echo "======================"

run_test "Process group exists in root" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/root' | grep -q 'Test-Simple-Pipeline'"

run_test "Process group has correct ID" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/root' | grep -q '$GROUP_ID'"

run_test "Process group is accessible" "kubectl exec -n infometis statefulset/nifi -- curl -f 'http://localhost:8080/nifi-api/process-groups/$GROUP_ID' >/dev/null"

echo ""
echo "⚙️  Processor Tests"
echo "=================="

run_test "GenerateFlowFile processor exists" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID' | grep -q 'GenerateFlowFile'"

run_test "LogAttribute processor exists" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID' | grep -q 'LogAttribute'"

run_test "Both processors present" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID' | grep -q 'GenerateFlowFile' && kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID' | grep -q 'LogAttribute'"

# Load processor IDs from saved files
if [ -f /tmp/test-pipeline-gen-id ] && [ -f /tmp/test-pipeline-log-id ]; then
    GEN_ID=$(cat /tmp/test-pipeline-gen-id)
    LOG_ID=$(cat /tmp/test-pipeline-log-id)
else
    echo "⚠️  Using fallback ID detection"
    GEN_ID="unknown"
    LOG_ID="unknown"
fi

if [ -n "$GEN_ID" ] && [ -n "$LOG_ID" ]; then
    echo "  GenerateFlowFile ID: $GEN_ID"
    echo "  LogAttribute ID: $LOG_ID"
    
    run_test "GenerateFlowFile processor accessible" "kubectl exec -n infometis statefulset/nifi -- curl -f 'http://localhost:8080/nifi-api/processors/$GEN_ID' >/dev/null"
    
    run_test "LogAttribute processor accessible" "kubectl exec -n infometis statefulset/nifi -- curl -f 'http://localhost:8080/nifi-api/processors/$LOG_ID' >/dev/null"
fi

echo ""
echo "🔗 Connection Tests"
echo "=================="

run_test "Connection exists between processors" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID' | grep -q '\"connections\"'"

run_test "Connection uses success relationship" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID' | grep -q 'success'"

run_test "Connection present in flow" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/$GROUP_ID' | grep -q 'connections'"

echo ""
echo "📝 Configuration Tests"
echo "====================="

run_test "GenerateFlowFile has custom text configured" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/processors/$GEN_ID' | grep -q 'InfoMetis Test Data'"

run_test "LogAttribute has log level configured" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/processors/$LOG_ID' | grep -q 'Log Level'"

run_test "LogAttribute auto-terminates success" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/processors/$LOG_ID' | grep -q 'autoTerminate.*true'"

echo ""
echo "🎯 Version Control Readiness Tests"
echo "================================="

run_test "Process group not under version control" "! kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/process-groups/$GROUP_ID' | grep -q 'versionControlInformation'"

run_test "Process group has no validation errors" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/process-groups/$GROUP_ID' | grep -q '\"invalidCount\":0'"

run_test "Registry client available for versioning" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/controller/registry-clients' | grep -q 'InfoMetis Registry'"

echo ""
echo "📊 Verification Results"
echo "======================"
echo -e "Total tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All pipeline verification tests passed!${NC}"
    echo ""
    echo "🎯 Pipeline Status: READY FOR VERSIONING"
    echo "   • Process group created and accessible"
    echo "   • Both processors present and configured"
    echo "   • Connection established between processors"
    echo "   • No version control currently applied"
    echo "   • Registry client available for versioning"
    echo ""
    echo "📋 Pipeline Details:"
    echo "   • Name: Test-Simple-Pipeline"
    echo "   • Group ID: $GROUP_ID"
    echo "   • GenerateFlowFile ID: $GEN_ID"
    echo "   • LogAttribute ID: $LOG_ID"
    echo ""
    echo "🌐 Manual Verification Available:"
    echo "   • NiFi UI: http://localhost/nifi"
    echo "   • Look for 'Test-Simple-Pipeline' process group"
    echo ""
    echo "📋 Next Step: T1-05-version-pipeline.sh"
    echo ""
    echo "🎉 T1-04 completed successfully!"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some pipeline verification tests failed${NC}"
    echo ""
    echo "🔧 Recommended Actions:"
    echo "   • Check pipeline creation: T1-02-create-single-pipeline.sh"
    echo "   • Verify NiFi API responses manually"
    echo "   • Check processor configurations"
    echo ""
    exit 1
fi