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

run_test "k0s container running" "docker ps -q -f name=k0s-infometis"
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
run_test "Traefik dashboard port" "curl -f http://localhost:8080/api/rawdata >/dev/null 2>&1"

echo ""

# Test NiFi
echo "🌊 Testing NiFi Application"
echo "=========================="

run_test "NiFi deployment exists" "kubectl get deployment nifi -n infometis"
run_test "NiFi pod running" "kubectl get pods -n infometis -l app=nifi | grep -q Running"
run_test "NiFi service accessible" "kubectl get service nifi-service -n infometis"
run_test "NiFi ingress configured" "kubectl get ingress nifi-ingress -n infometis"

# Test NiFi API connectivity
if kubectl get pods -n infometis -l app=nifi | grep -q Running; then
    echo ""
    echo "🔌 Testing NiFi API Connectivity"
    echo "==============================="
    
    run_test "NiFi API system diagnostics" "kubectl exec -n infometis deployment/nifi -- curl -f http://localhost:8080/nifi-api/system-diagnostics"
    run_test "NiFi API controller status" "kubectl exec -n infometis deployment/nifi -- curl -f http://localhost:8080/nifi-api/controller"
    run_test "NiFi API access status" "kubectl exec -n infometis deployment/nifi -- curl -f http://localhost:8080/nifi-api/access"
fi

echo ""

# Test Storage
echo "💾 Testing Persistent Storage"
echo "============================"

run_test "Storage class exists" "kubectl get storageclass local-storage"
run_test "Persistent volume exists" "kubectl get pv nifi-pv"
run_test "PVC bound" "kubectl get pvc nifi-pvc -n infometis | grep -q Bound"

echo ""

# Test Network Connectivity
echo "🔗 Testing Network Connectivity"
echo "=============================="

run_test "Cluster DNS working" "kubectl exec -n infometis deployment/nifi -- nslookup kubernetes.default.svc.cluster.local"
run_test "Internet connectivity" "kubectl exec -n infometis deployment/nifi -- curl -f https://httpbin.org/status/200"

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
    echo "• Traefik Dashboard: http://localhost:8080"
    echo "• NiFi UI (via Traefik): http://localhost/nifi"
    echo "• NiFi Direct Access: kubectl port-forward -n infometis deployment/nifi 8080:8080"
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
    echo "• kubectl logs -n infometis deployment/nifi"
    echo "• kubectl describe pod -n infometis -l app=nifi"
    echo "• docker logs k0s-infometis"
    echo ""
    exit 1
fi