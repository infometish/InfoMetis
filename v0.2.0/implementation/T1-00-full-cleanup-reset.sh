#!/bin/bash
set -eu

# InfoMetis v0.2.0 - T1-00: Full Cleanup and Environment Reset
# Complete environment reset for clean testing

echo "🧹 Test 1-00: Full Cleanup and Environment Reset"
echo "================================================"
echo "Preparing clean environment for Registry integration testing"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function: Test step with clear pass/fail
test_step() {
    local step_name="$1"
    local test_command="$2"
    
    echo -n "  $step_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

echo "🔄 Step 1: Restart NiFi pod for complete reset"
echo "=============================================="

kubectl rollout restart statefulset/nifi -n infometis
echo "  Waiting for NiFi restart..."
kubectl rollout status statefulset/nifi -n infometis --timeout=300s

test_step "NiFi pod running" "kubectl get pods -n infometis -l app=nifi | grep -q Running"
test_step "Registry pod running" "kubectl get pods -n infometis -l app=nifi-registry | grep -q Running"

echo ""
echo "🔗 Step 2: Re-establish Registry-NiFi integration"
echo "================================================"

# Wait a moment for NiFi to fully start
echo "  Waiting for NiFi API to be ready..."
sleep 30

# Check if NiFi API is responsive
if kubectl exec -n infometis statefulset/nifi -- curl -f http://localhost:8080/nifi-api/controller >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓ NiFi API ready${NC}"
else
    echo -e "  ${YELLOW}⚠ NiFi API not ready, waiting longer...${NC}"
    sleep 30
fi

# Re-establish Registry integration
echo "  Running Registry-NiFi integration setup..."
if ./I3-configure-registry-nifi.sh >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Registry integration configured${NC}"
else
    echo -e "  ${RED}✗ Registry integration failed${NC}"
    exit 1
fi

echo ""
echo "🔍 Step 3: Verify clean environment state"
echo "========================================"

test_step "No Test-Simple-Pipeline groups exist" "[ \$(kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/root' | grep -c 'Test-Simple-Pipeline' || echo 0) -eq 0 ]"

test_step "Registry client configured" "kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -q 'InfoMetis Registry'"

test_step "InfoMetis Flows bucket exists" "kubectl exec -n infometis deployment/nifi-registry -- curl -s http://localhost:18080/nifi-registry-api/buckets | grep -q 'InfoMetis Flows'"

test_step "NiFi UI accessible" "curl -f http://localhost/nifi/ >/dev/null"

test_step "Registry UI accessible" "curl -f http://localhost/nifi-registry/ >/dev/null"

echo ""
echo "📊 Cleanup Summary"
echo "=================="
echo -e "${GREEN}✅ Environment Reset Complete${NC}"
echo ""
echo "🎯 Clean State Achieved:"
echo "   • NiFi pod restarted and running"
echo "   • Registry-NiFi integration established"
echo "   • No existing test process groups"
echo "   • Registry client configured"
echo "   • External access confirmed"
echo ""
echo "📋 Ready for Test Execution:"
echo "   • Next: T1-01-verify-clean-state.sh"
echo "   • NiFi UI: http://localhost/nifi"
echo "   • Registry UI: http://localhost/nifi-registry"
echo ""
echo "🎉 T1-00 completed successfully!"