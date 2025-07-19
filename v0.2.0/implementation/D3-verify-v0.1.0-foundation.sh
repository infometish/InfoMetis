#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Verify v0.1.0 Foundation
# Comprehensive verification of cluster, Traefik, and NiFi deployment

echo "🔍 InfoMetis v0.2.0 - Verify v0.1.0 Foundation"
echo "=============================================="
echo "Verifying: k0s cluster + Traefik + NiFi"
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

# Test cluster components
echo "🏗️  Testing Cluster Components"
echo "=============================="

run_test "k0s container running" "docker ps -q -f name=infometis"
run_test "kubectl connectivity" "kubectl cluster-info"
run_test "infometis namespace exists" "kubectl get namespace infometis"
run_test "cluster nodes ready" "kubectl get nodes | grep -q Ready"

echo ""

# Test Traefik
echo "🌐 Testing Traefik Ingress"
echo "=========================="

run_test "Traefik deployment exists" "kubectl get deployment traefik -n kube-system"
run_test "Traefik pod running" "kubectl get pods -n kube-system -l app=traefik | grep -q Running"
run_test "Traefik service accessible" "kubectl get service traefik -n kube-system"
run_test "Traefik dashboard port" "curl -f http://localhost:8082/api/rawdata >/dev/null 2>&1"

echo ""

# Test NiFi
echo "🌊 Testing NiFi Application"
echo "=========================="

run_test "NiFi statefulset exists" "kubectl get statefulset nifi -n infometis"
run_test "NiFi pod running" "kubectl get pods -n infometis -l app=nifi | grep -q Running"
run_test "NiFi service accessible" "kubectl get service nifi-service -n infometis"
run_test "NiFi ingress configured" "kubectl get ingress nifi-ingress -n infometis"

# Test NiFi API connectivity
if kubectl get pods -n infometis -l app=nifi | grep -q Running; then
    echo ""
    echo "🔌 Testing NiFi API Connectivity"
    echo "==============================="
    
    run_test "NiFi API system diagnostics" "kubectl exec -n infometis statefulset/nifi -- curl -f http://localhost:8080/nifi-api/system-diagnostics >/dev/null"
    run_test "NiFi API controller status" "kubectl exec -n infometis statefulset/nifi -- curl -f http://localhost:8080/nifi-api/controller >/dev/null"
    run_test "NiFi API access config" "kubectl exec -n infometis statefulset/nifi -- curl -f http://localhost:8080/nifi-api/access/config >/dev/null"
fi

echo ""

# Test Storage
echo "💾 Testing Persistent Storage"
echo "============================"

run_test "Storage class exists" "kubectl get storageclass local-storage"
run_test "NiFi persistent volumes exist" "kubectl get pv | grep -q nifi-"
run_test "NiFi PVCs bound" "kubectl get pvc -n infometis | grep nifi- | grep -q Bound"

echo ""

# Test Network Connectivity
echo "🔗 Testing Network Connectivity"
echo "=============================="

run_test "Cluster service connectivity" "kubectl exec -n infometis statefulset/nifi -- curl -m 5 -k https://kubernetes.default.svc.cluster.local:443 >/dev/null"
run_test "Internet connectivity" "kubectl exec -n infometis statefulset/nifi -- curl -f https://httpbin.org/status/200"

echo ""

# Summary
echo "📊 Test Summary"
echo "==============="
echo -e "Total tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! v0.1.0 Foundation is ready${NC}"
    echo ""
    echo "🔗 Access Information:"
    echo "=============================="
    echo "• Traefik Dashboard: http://localhost:8082"
    echo "• NiFi UI (via Traefik): http://localhost/nifi"
    echo "• NiFi Direct Access: kubectl port-forward -n infometis statefulset/nifi 8080:8080"
    echo "• NiFi Credentials: admin / infometis2024"
    echo ""
    echo "📋 Ready for v0.2.0 Features:"
    echo "=============================="
    echo "• ./I1-deploy-registry.sh           # Deploy NiFi Registry"
    echo "• ./I2-configure-git-integration.sh # Setup Git integration"
    echo "• ./I3-configure-registry-nifi.sh   # Connect Registry to NiFi"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Check the issues above${NC}"
    echo ""
    echo "🔧 Common Issues:"
    echo "================"
    echo "• Wait longer for NiFi to fully start (can take 5-10 minutes)"
    echo "• Check Docker resources (memory/CPU)"
    echo "• Verify network connectivity"
    echo "• Check kubectl configuration"
    echo ""
    echo "🔍 Debug Commands:"
    echo "=================="
    echo "• kubectl get pods -A"
    echo "• kubectl logs -n infometis statefulset/nifi"
    echo "• kubectl describe pod -n infometis -l app=nifi"
    echo "• docker logs infometis"
    echo ""
    exit 1
fi