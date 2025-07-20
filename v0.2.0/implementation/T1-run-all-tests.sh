#!/bin/bash
set -eu

# InfoMetis v0.2.0 - T1: Complete Test Suite Runner
# Runs all Test 1 scripts in sequence for automated validation

echo "🧪 InfoMetis v0.2.0 - Test 1: Basic Registry Integration Test Suite"
echo "=================================================================="
echo "Complete automated validation of Registry integration workflow"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test tracking
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
START_TIME=$(date +%s)

# Function to run individual test
run_test_script() {
    local test_num="$1"
    local test_name="$2"
    local script_name="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}Test $test_num: $test_name${NC}"
    echo -e "${BLUE}============================================${NC}"
    
    if [ ! -f "$script_name" ]; then
        echo -e "${RED}❌ Test script not found: $script_name${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    if ! chmod +x "$script_name"; then
        echo -e "${RED}❌ Cannot make script executable: $script_name${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    echo "🚀 Running: $script_name"
    echo ""
    
    if ./"$script_name"; then
        echo ""
        echo -e "${GREEN}✅ Test $test_num PASSED: $test_name${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo ""
        echo -e "${RED}❌ Test $test_num FAILED: $test_name${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "📋 Test Suite Overview:"
echo "======================"
echo "T1-00: Full cleanup and environment reset"
echo "T1-01: Verify clean NiFi state"  
echo "T1-02: Create single test pipeline"
echo "T1-03: Verify pipeline creation"
echo "T1-04: Version pipeline in Registry"
echo "T1-05: Verify flow in Registry storage"
echo "T1-06: Validate complete end-to-end workflow"
echo ""

read -p "🤔 Do you want to run the complete Test 1 suite? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "❌ Test suite cancelled by user"
    exit 0
fi

echo ""
echo "🚀 Starting Test 1: Basic Registry Integration Test Suite..."

# Run all tests in sequence
run_test_script "1-00" "Full cleanup and environment reset" "T1-00-full-cleanup-reset.sh"

if [ $TESTS_FAILED -eq 0 ]; then
    run_test_script "1-01" "Verify clean NiFi state" "T1-01-verify-clean-state.sh"
fi

if [ $TESTS_FAILED -eq 0 ]; then
    run_test_script "1-02" "Create single test pipeline" "T1-02-create-single-pipeline.sh"
fi

if [ $TESTS_FAILED -eq 0 ]; then
    run_test_script "1-03" "Verify pipeline creation" "T1-03-verify-pipeline-creation.sh"
fi

if [ $TESTS_FAILED -eq 0 ]; then
    run_test_script "1-04" "Version pipeline in Registry" "T1-04-version-pipeline.sh"
fi

if [ $TESTS_FAILED -eq 0 ]; then
    run_test_script "1-05" "Verify flow in Registry storage" "T1-05-verify-registry-storage.sh"
fi

if [ $TESTS_FAILED -eq 0 ]; then
    run_test_script "1-06" "Validate complete end-to-end workflow" "T1-06-validate-end-to-end.sh"
fi

# Calculate execution time
END_TIME=$(date +%s)
EXECUTION_TIME=$((END_TIME - START_TIME))
MINUTES=$((EXECUTION_TIME / 60))
SECONDS=$((EXECUTION_TIME % 60))

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Test Suite Execution Complete${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo "📊 Test Suite Results:"
echo "====================="
echo -e "Total tests run: $TESTS_RUN"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"
echo -e "Execution time: ${MINUTES}m ${SECONDS}s"

# Calculate success rate
if [ $TESTS_RUN -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_RUN))
    echo -e "Success rate: $SUCCESS_RATE%"
fi

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED - REGISTRY INTEGRATION VALIDATED!${NC}"
    echo ""
    echo "🎯 Test 1: Basic Registry Integration - COMPLETE SUCCESS"
    echo "======================================================="
    echo ""
    echo "✅ Validated Capabilities:"
    echo "   • Environment cleanup and reset"
    echo "   • Clean state verification"
    echo "   • Pipeline creation via API"
    echo "   • Pipeline component verification"
    echo "   • Registry version control establishment"
    echo "   • Git flow persistence validation"
    echo "   • End-to-end workflow confirmation"
    echo ""
    echo "🚀 InfoMetis v0.2.0 Status: PRODUCTION READY"
    echo ""
    echo "📋 Ready for:"
    echo "   • Production pipeline development"
    echo "   • Flow version control workflows"
    echo "   • Additional test suites (Test 2: Advanced Features)"
    echo ""
    echo "🌐 Access Points:"
    echo "   • NiFi UI: http://localhost/nifi"
    echo "   • Registry UI: http://localhost/nifi-registry"
    echo "   • Test Pipeline: Look for 'Test-Simple-Pipeline'"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED - REVIEW REQUIRED${NC}"
    echo ""
    echo "🔧 Next Steps:"
    echo "   • Review failed test output above"
    echo "   • Run individual tests to isolate issues"
    echo "   • Check component logs: kubectl logs -n infometis [pod-name]"
    echo "   • Re-run specific tests after fixes"
    echo ""
    echo "💡 Tip: You can run individual tests like:"
    echo "   ./T1-01-verify-clean-state.sh"
    echo "   ./T1-02-create-single-pipeline.sh"
    echo "   etc."
    echo ""
    exit 1
fi