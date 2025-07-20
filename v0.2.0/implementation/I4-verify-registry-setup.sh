#!/bin/bash
set -eu

# InfoMetis v0.2.0 - I4: Verify Registry Setup
# Comprehensive verification of Registry integration and functionality

echo "🔍 InfoMetis v0.2.0 - I4: Verify Registry Setup"
echo "=============================================="
echo "Comprehensive verification of Registry integration"
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

# Test Registry Deployment
echo "🗂️  Testing Registry Deployment"
echo "==============================="

run_test "Registry deployment exists" "kubectl get deployment nifi-registry -n infometis"
run_test "Registry pod running" "kubectl get pods -n infometis -l app=nifi-registry | grep -q Running"
run_test "Registry service accessible" "kubectl get service nifi-registry-service -n infometis"
run_test "Registry ingress configured" "kubectl get ingress nifi-registry-ingress -n infometis"

echo ""

# Test Registry API
echo "🔌 Testing Registry API"
echo "======================="

if kubectl get pods -n infometis -l app=nifi-registry | grep -q Running; then
    run_test "Registry API responsive" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry/ >/dev/null"
    run_test "Registry buckets API" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null"
    run_test "InfoMetis Flows bucket exists" "kubectl exec -n infometis deployment/nifi-registry -- curl -s http://localhost:18080/nifi-registry-api/buckets | grep -q 'InfoMetis Flows'"
fi

echo ""

# Test Registry Storage
echo "💾 Testing Registry Storage"
echo "==========================="

run_test "Registry PV exists" "kubectl get pv nifi-registry-pv"
run_test "Registry PVC bound" "kubectl get pvc nifi-registry-pvc -n infometis | grep -q Bound"
run_test "Flow storage directory exists" "kubectl exec -n infometis deployment/nifi-registry -- test -d /opt/nifi-registry/flow_storage"
run_test "Database directory exists" "kubectl exec -n infometis deployment/nifi-registry -- test -d /opt/nifi-registry/database"

echo ""

# Test Git Integration
echo "🔗 Testing Git Integration"
echo "=========================="

run_test "Git providers config exists" "kubectl exec -n infometis deployment/nifi-registry -- test -f /opt/nifi-registry/conf/providers.xml"
run_test "GitFlowPersistenceProvider configured" "kubectl exec -n infometis deployment/nifi-registry -- grep -q GitFlowPersistenceProvider /opt/nifi-registry/conf/providers.xml"
run_test "Flow storage writable" "kubectl exec -n infometis deployment/nifi-registry -- test -w /opt/nifi-registry/flow_storage"

echo ""

# Test Registry-NiFi Integration
echo "🤝 Testing Registry-NiFi Integration"
echo "===================================="

if kubectl get pods -n infometis -l app=nifi | grep -q Running; then
    run_test "NiFi API accessible" "kubectl exec -n infometis statefulset/nifi -- curl -f http://localhost:8080/nifi-api/controller >/dev/null"
    run_test "Registry client configured in NiFi" "kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -q 'InfoMetis Registry'"
    run_test "NiFi can reach Registry service" "kubectl exec -n infometis statefulset/nifi -- curl -f http://nifi-registry-service.infometis.svc.cluster.local:18080/nifi-registry/ >/dev/null"
fi

echo ""

# Test External Access
echo "🌐 Testing External Access"
echo "=========================="

run_test "Registry UI accessible via Traefik" "curl -f http://localhost/nifi-registry/ >/dev/null"
run_test "Registry API via Traefik" "curl -f http://localhost/nifi-registry-api/buckets >/dev/null"

echo ""

# Summary
echo "📊 Verification Summary"
echo "======================"
echo -e "Total tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All Registry verification tests passed!${NC}"
    echo ""
    echo "🔗 Registry Integration Status:"
    echo "=============================="
    echo "• Registry: ✅ Deployed and running"
    echo "• Git Integration: ✅ Configured with flow persistence"
    echo "• NiFi Integration: ✅ Registry client configured"
    echo "• External Access: ✅ Available via http://localhost/nifi-registry"
    echo ""
    echo "📋 Ready for Pipeline Testing:"
    echo "=============================="
    echo "• Create flows in NiFi UI: http://localhost/nifi"
    echo "• Version control: Right-click Process Group → Version → Start version control"
    echo "• Select Registry: Choose 'InfoMetis Registry' and 'InfoMetis Flows' bucket"
    echo "• Access Registry UI: http://localhost/nifi-registry"
    echo ""
    echo "🚀 Registry setup verification complete - ready for flow versioning!"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some Registry verification tests failed${NC}"
    echo ""
    echo "🔧 Common Issues:"
    echo "================"
    echo "• Registry still starting up (wait 2-3 minutes after deployment)"
    echo "• Network connectivity between NiFi and Registry"
    echo "• Storage permissions or PVC binding issues"
    echo "• Traefik routing configuration"
    echo ""
    echo "🔍 Debug Commands:"
    echo "=================="
    echo "• kubectl get pods -n infometis"
    echo "• kubectl logs -n infometis deployment/nifi-registry"
    echo "• kubectl describe pvc nifi-registry-pvc -n infometis"
    echo "• kubectl get ingress -n infometis"
    echo ""
    exit 1
fi