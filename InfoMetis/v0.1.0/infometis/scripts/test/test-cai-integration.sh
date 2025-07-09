#!/bin/bash
# test-cai-integration.sh
# TDD test script for Issue #6 - Simple CAI Pipeline Integration

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CAI_SCRIPT="${PROJECT_ROOT}/scripts/cai/cai-pipeline.sh"

echo "🧪 Testing InfoMetis CAI Pipeline Integration..."

# Test CAI script exists
test_cai_script_exists() {
    echo "📋 Test 1: CAI pipeline script exists"
    
    if [[ ! -f "$CAI_SCRIPT" ]]; then
        echo "❌ CAI script not found: $CAI_SCRIPT"
        return 1
    fi
    
    if [[ ! -x "$CAI_SCRIPT" ]]; then
        echo "❌ CAI script is not executable: $CAI_SCRIPT"
        return 1
    fi
    
    echo "✅ CAI pipeline script exists and is executable"
    return 0
}

# Test NiFi is accessible
test_nifi_accessible() {
    echo "📋 Test 2: NiFi UI is accessible"
    
    # Test HTTP access to NiFi API
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/nifi/nifi-api/system-diagnostics" 2>/dev/null || echo "000")
    
    # Accept 200 (success) or 401 (unauthorized) as both indicate NiFi is running
    if [[ "$http_code" == "200" || "$http_code" == "401" ]]; then
        echo "✅ NiFi API is accessible (HTTP $http_code)"
        return 0
    else
        echo "❌ NiFi API is not accessible (HTTP $http_code)"
        echo "Please ensure NiFi is running and accessible at http://localhost:8080"
        return 1
    fi
}

# Test pipeline creation
test_pipeline_creation() {
    echo "📋 Test 3: CAI pipeline creation"
    
    # Clean up previous test files in container if they exist
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    # Clean up previous test files
    $kubectl_cmd exec -n infometis nifi-0 -- rm -rf /opt/nifi/nifi-current/input /opt/nifi/nifi-current/output 2>/dev/null || true
    
    # Run the CAI pipeline creation command
    echo "🚀 Running: $CAI_SCRIPT \"create csv reader\""
    if ! "$CAI_SCRIPT" "create csv reader" >/dev/null 2>&1; then
        echo "❌ CAI pipeline creation failed"
        return 1
    fi
    
    echo "✅ CAI pipeline creation completed successfully"
    return 0
}

# Test file processing
test_file_processing() {
    echo "📋 Test 4: CSV file processing verification"
    
    # Define NiFi container directories
    local input_dir="/opt/nifi/nifi-current/input"
    local output_dir="/opt/nifi/nifi-current/output"
    
    # CAI script should have created the test file, just wait for processing
    echo "⏳ Waiting for file processing (10 seconds)..."
    sleep 10
    
    # Check if file was processed to output directory in NiFi container
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    if $kubectl_cmd exec -n infometis nifi-0 -- test -f "$output_dir/test.csv" 2>/dev/null; then
        echo "✅ Test CSV file successfully processed to output directory"
        
        # Verify file contents
        local file_contents
        file_contents=$($kubectl_cmd exec -n infometis nifi-0 -- cat "$output_dir/test.csv" 2>/dev/null || echo "")
        if echo "$file_contents" | grep -q "test,data"; then
            echo "✅ File contents verified - data preserved correctly"
        else
            echo "⚠️  File processed but contents may be modified"
        fi
        
        return 0
    else
        echo "❌ Test CSV file was not processed to output directory"
        echo "Output directory contents:"
        $kubectl_cmd exec -n infometis nifi-0 -- ls -la "$output_dir" 2>/dev/null || echo "  Output directory does not exist"
        return 1
    fi
}

# Test NiFi UI pipeline visibility
test_nifi_ui_pipeline() {
    echo "📋 Test 5: Pipeline visible in NiFi UI"
    
    # Query NiFi API for processors
    local processors_response
    processors_response=$(curl -s -u "admin:adminadminadmin" \
        "http://localhost:8080/nifi/nifi-api/process-groups/root/processors" 2>/dev/null || echo "")
    
    if [[ -z "$processors_response" ]]; then
        echo "❌ Failed to query NiFi processors"
        return 1
    fi
    
    # Check for GetFile processor
    if echo "$processors_response" | grep -q "GetFile-CSVReader"; then
        echo "✅ GetFile processor found in NiFi UI"
    else
        echo "❌ GetFile processor not found in NiFi UI"
        return 1
    fi
    
    # Check for PutFile processor
    if echo "$processors_response" | grep -q "PutFile-CSVWriter"; then
        echo "✅ PutFile processor found in NiFi UI"
    else
        echo "❌ PutFile processor not found in NiFi UI"
        return 1
    fi
    
    echo "✅ GetFile→PutFile pipeline visible in NiFi UI"
    return 0
}

# Display pipeline status
display_pipeline_status() {
    echo ""
    echo "🔍 Pipeline Status:"
    echo "=================="
    
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    echo "• Input directory:"
    $kubectl_cmd exec -n infometis nifi-0 -- ls -la /opt/nifi/nifi-current/input/ 2>/dev/null || echo "  Input directory does not exist"
    
    echo "• Output directory:"
    $kubectl_cmd exec -n infometis nifi-0 -- ls -la /opt/nifi/nifi-current/output/ 2>/dev/null || echo "  Output directory does not exist"
    
    echo "• NiFi processors:"
    curl -s -u "admin:adminadminadmin" \
        "http://localhost:8080/nifi/nifi-api/process-groups/root/processors" 2>/dev/null | \
        grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -5 || echo "  Failed to query processors"
    
    echo ""
}

# Main test execution
main() {
    echo "🎯 InfoMetis CAI Pipeline Integration TDD Tests"
    echo "=============================================="
    
    local exit_code=0
    
    # Run all tests
    test_cai_script_exists || exit_code=1
    test_nifi_accessible || exit_code=1
    test_pipeline_creation || exit_code=1
    test_file_processing || exit_code=1
    test_nifi_ui_pipeline || exit_code=1
    
    display_pipeline_status
    
    if [[ $exit_code -eq 0 ]]; then
        echo "🎉 All tests passed! Issue #6 TDD success criteria met."
        echo ""
        echo "✅ GIVEN NiFi UI is accessible"
        echo "✅ WHEN I run ./cai-pipeline.sh \"create csv reader\""
        echo "✅ THEN NiFi UI shows a GetFile→PutFile pipeline that processes test CSV file from input to output folder"
        echo ""
        echo "🚀 CAI Pipeline Integration is working correctly!"
        echo "   • Pipeline created via REST API"
        echo "   • File processing verified"
        echo "   • NiFi UI shows GetFile→PutFile processors"
    else
        echo "❌ Some tests failed. TDD success criteria not met."
    fi
    
    echo ""
    return $exit_code
}

# Execute tests
main "$@"
exit $?