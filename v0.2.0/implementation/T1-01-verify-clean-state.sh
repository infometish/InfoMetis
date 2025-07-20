#!/bin/bash
set -eu

# InfoMetis v0.2.0 - T1-01: Verify Clean NiFi State
# Detailed verification of clean environment before testing

echo "🔍 Test 1-01: Verify Clean NiFi State"
echo "====================================="
echo "Validating environment is ready for testing"
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

echo "🏗️  Infrastructure Tests"
echo "======================="

run_test "NiFi pod is running" "kubectl get pods -n infometis -l app=nifi | grep -q Running"
run_test "Registry pod is running" "kubectl get pods -n infometis -l app=nifi-registry | grep -q Running"
run_test "NiFi API responsive" "kubectl exec -n infometis statefulset/nifi -- curl -f http://localhost:8080/nifi-api/controller >/dev/null"
run_test "Registry API responsive" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null"

echo ""
echo "🧹 Clean State Tests"
echo "==================="

run_test "No existing process groups" "[ \$(kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/root' | grep -c '\"processGroups\":\\[\\]' || echo 0) -eq 1 ]"
run_test "No Test-Simple-Pipeline groups" "[ \$(kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/root' | grep -c 'Test-Simple-Pipeline' || echo 0) -eq 0 ]"
run_test "No existing processors in root" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/root' | grep -q '\"processors\":\\[\\]'"

echo ""
echo "🔗 Registry Integration Tests"
echo "============================="

run_test "Registry client exists in NiFi" "kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -q 'InfoMetis Registry'"
run_test "InfoMetis Flows bucket exists" "kubectl exec -n infometis deployment/nifi-registry -- curl -s http://localhost:18080/nifi-registry-api/buckets | grep -q 'InfoMetis Flows'"
run_test "NiFi can reach Registry" "kubectl exec -n infometis statefulset/nifi -- curl -f http://nifi-registry-service.infometis.svc.cluster.local:18080/nifi-registry/ >/dev/null"

echo ""
echo "🌐 External Access Tests"
echo "======================="

run_test "NiFi UI accessible externally" "curl -f http://localhost/nifi/ >/dev/null"
run_test "Registry UI accessible externally" "curl -f http://localhost/nifi-registry/ >/dev/null"
run_test "Registry API accessible externally" "curl -f http://localhost/nifi-registry-api/buckets >/dev/null"

echo ""
echo "📊 Verification Results"
echo "======================"
echo -e "Total tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All clean state verification tests passed!${NC}"
    echo ""
    echo "🎯 Environment Status: READY FOR TESTING"
    echo "   • Clean NiFi with no existing process groups"
    echo "   • Registry integration properly configured"
    echo "   • External access confirmed working"
    echo ""
    echo "📋 Next Step: T1-02-create-single-pipeline.sh"
    echo ""
    echo "🎉 T1-01 completed successfully!"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some verification tests failed${NC}"
    echo ""
    echo "🔧 Recommended Actions:"
    echo "   • Re-run T1-00-full-cleanup-reset.sh"
    echo "   • Check pod logs: kubectl logs -n infometis [pod-name]"
    echo "   • Verify network connectivity"
    echo ""
    exit 1
fi