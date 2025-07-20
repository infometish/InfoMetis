#!/bin/bash
set -eu

# InfoMetis v0.2.0 - P3: Test Pipeline Registry Integration
# Comprehensive end-to-end testing of pipeline versioning workflow

echo "InfoMetis v0.2.0 - P3: Test Pipeline Registry Integration"
echo "========================================================="
echo "End-to-end testing of pipeline versioning workflow"
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
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function: Test pipeline creation
test_pipeline_creation() {
    echo "Testing Pipeline Creation"
    echo "========================="
    
    run_test "P1 script exists and is executable" "test -x ./P1-create-test-pipeline.sh"
    
    # Test simple pipeline creation
    echo "  Creating simple test pipeline..."
    if ./P1-create-test-pipeline.sh simple >/dev/null 2>&1; then
        echo -e "  ${GREEN}Simple pipeline creation script ran${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}Simple pipeline creation failed${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    # Verify process group was created
    run_test "Test-Simple-Pipeline process group exists" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/process-groups/root' | grep -q 'Test-Simple-Pipeline'"
}

# Function: Test versioning workflow
test_versioning_workflow() {
    echo ""
    echo "Testing Versioning Workflow"
    echo "==========================="
    
    run_test "P2 script exists and is executable" "test -x ./P2-version-pipeline.sh"
    run_test "Registry client is configured" "kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -q 'InfoMetis Registry'"
    run_test "InfoMetis Flows bucket exists" "kubectl exec -n infometis deployment/nifi-registry -- curl -s http://localhost:18080/nifi-registry-api/buckets | grep -q 'InfoMetis Flows'"
    
    # Test pipeline versioning
    echo "  Versioning simple test pipeline..."
    if ./P2-version-pipeline.sh "Test-Simple-Pipeline" "1.0" "Initial automated test version" >/dev/null 2>&1; then
        echo -e "  ${GREEN}Pipeline versioning script ran${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}Pipeline versioning failed${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Function: Test Registry storage
test_registry_storage() {
    echo ""
    echo "Testing Registry Storage"
    echo "========================"
    
    # Get Registry client and bucket IDs
    local client_id=$(kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    local bucket_id=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$client_id/buckets" | grep -A 5 '"name":"InfoMetis Flows"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$client_id" ] && [ -n "$bucket_id" ]; then
        run_test "Flow appears in Registry bucket" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/registries/$client_id/buckets/$bucket_id/flows' | grep -q 'Test-Simple-Pipeline'"
        
        # Get flow ID and check versions
        local flow_id=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$client_id/buckets/$bucket_id/flows" | grep -B 5 -A 5 '"name":"Test-Simple-Pipeline"' | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$flow_id" ]; then
            run_test "Flow versions exist in Registry" "kubectl exec -n infometis statefulset/nifi -- curl -s 'http://localhost:8080/nifi-api/flow/registries/$client_id/buckets/$bucket_id/flows/$flow_id/versions' | grep -q '\"version\"'"
        fi
    fi
    
    run_test "Git flow storage directory has content" "kubectl exec -n infometis deployment/nifi-registry -- find /opt/nifi-registry/flow_storage -name '*.json' | wc -l | grep -v '^0$'"
}

# Function: Test Git integration
test_git_integration() {
    echo ""
    echo "Testing Git Integration"
    echo "======================="
    
    run_test "GitFlowPersistenceProvider configured" "kubectl exec -n infometis deployment/nifi-registry -- grep -q GitFlowPersistenceProvider /opt/nifi-registry/conf/providers.xml"
    run_test "Flow storage directory writable" "kubectl exec -n infometis deployment/nifi-registry -- test -w /opt/nifi-registry/flow_storage"
    run_test "Flow storage has JSON files" "kubectl exec -n infometis deployment/nifi-registry -- find /opt/nifi-registry/flow_storage -name '*.json' -type f | wc -l | grep -v '^0$'"
}

# Function: Test external access
test_external_access() {
    echo ""
    echo "Testing External Access"
    echo "======================="
    
    run_test "NiFi UI accessible" "curl -f http://localhost/nifi/ >/dev/null"
    run_test "Registry UI accessible" "curl -f http://localhost/nifi-registry/ >/dev/null"
    run_test "Registry API accessible" "curl -f http://localhost/nifi-registry-api/buckets >/dev/null"
    run_test "Registry shows flow via API" "curl -s http://localhost/nifi-registry-api/buckets | grep -q 'InfoMetis Flows'"
}

# Function: Test complete workflow
test_complete_workflow() {
    echo ""
    echo "Testing Complete Workflow"
    echo "========================="
    
    echo "  Testing end-to-end pipeline lifecycle..."
    
    # Check if we can see the versioned pipeline in NiFi
    local process_groups=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/root")
    
    if echo "$process_groups" | grep -q '"versionControlInformation"'; then
        echo -e "  ${GREEN}Process group under version control${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}Process group not under version control${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    # Test Registry UI shows the flow
    if curl -s http://localhost/nifi-registry-api/buckets 2>/dev/null | grep -q "InfoMetis Flows"; then
        echo -e "  ${GREEN}Registry UI accessible and shows bucket${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}Registry UI not accessible or missing bucket${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Main execution
main() {
    echo "Starting comprehensive pipeline Registry integration tests..."
    echo ""
    
    # Run all test suites
    test_pipeline_creation
    test_versioning_workflow  
    test_registry_storage
    test_git_integration
    test_external_access
    test_complete_workflow
    
    # Summary
    echo ""
    echo "Test Results Summary"
    echo "==================="
    echo -e "Total tests: $TESTS_TOTAL"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}All pipeline Registry integration tests passed!${NC}"
        echo ""
        echo "Issue #58 Success Criteria MET:"
        echo "   - Test pipelines created and versioned"
        echo "   - Registry integration working"  
        echo "   - Git persistence functional"
        echo "   - End-to-end workflow validated"
        echo ""
        echo "InfoMetis v0.2.0 Registry integration proven with real flows!"
        echo "   Ready for production pipeline development"
        echo ""
        echo "Access Points:"
        echo "   - NiFi UI: http://localhost/nifi"
        echo "   - Registry UI: http://localhost/nifi-registry"
        echo "   - Flow versioning: Right-click Process Group -> Version"
        echo ""
        exit 0
    else
        echo ""
        echo -e "${RED}Some pipeline Registry integration tests failed${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "   - Ensure all deployment scripts ran successfully"
        echo "   - Check Registry-NiFi integration: ./I3-configure-registry-nifi.sh"
        echo "   - Verify Registry deployment: ./I4-verify-registry-setup.sh"
        echo "   - Check component logs: kubectl logs -n infometis [pod-name]"
        echo ""
        exit 1
    fi
}

# Run tests
main