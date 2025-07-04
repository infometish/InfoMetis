#!/bin/bash
# test-cluster-setup.sh
# TDD test script for Issue #3 - kind Cluster Setup for WSL

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP_SCRIPT="${SCRIPT_DIR}/../setup/setup-cluster.sh"

echo "🧪 Testing InfoMetis kind cluster setup..."

# Test setup script execution
test_setup_execution() {
    echo "📋 Test 1: Setup script execution"
    
    if [[ ! -f "${SETUP_SCRIPT}" ]]; then
        echo "❌ Setup script not found: ${SETUP_SCRIPT}"
        return 1
    fi
    
    if [[ ! -x "${SETUP_SCRIPT}" ]]; then
        echo "❌ Setup script is not executable"
        return 1
    fi
    
    echo "✅ Setup script exists and is executable"
    return 0
}

# Test cluster creation
test_cluster_ready() {
    echo "📋 Test 2: Cluster nodes ready"
    
    # Run setup script silently
    echo "🔧 Running setup script..."
    if ! "${SETUP_SCRIPT}" >/dev/null 2>&1; then
        echo "❌ Setup script failed"
        return 1
    fi
    
    # Check if kubectl can connect
    if ! kubectl cluster-info --context kind-infometis >/dev/null 2>&1; then
        echo "❌ Cannot connect to cluster"
        return 1
    fi
    
    # Check if nodes are ready
    if ! kubectl get nodes --no-headers 2>/dev/null | grep -q "Ready"; then
        echo "❌ No ready nodes found"
        return 1
    fi
    
    echo "✅ Cluster nodes are ready"
    return 0
}

# Test namespace creation
test_namespace_exists() {
    echo "📋 Test 3: infometis namespace exists"
    
    if ! kubectl get namespace infometis >/dev/null 2>&1; then
        echo "❌ infometis namespace not found"
        return 1
    fi
    
    echo "✅ infometis namespace exists"
    return 0
}

# Main test execution
main() {
    echo "🎯 InfoMetis Cluster Setup TDD Tests"
    echo "====================================="
    
    local exit_code=0
    
    # Run all tests
    test_setup_execution || exit_code=1
    test_cluster_ready || exit_code=1
    test_namespace_exists || exit_code=1
    
    echo ""
    if [[ $exit_code -eq 0 ]]; then
        echo "🎉 All tests passed! Issue #3 TDD success criteria met."
        echo ""
        echo "✅ GIVEN fresh WSL environment with Docker"
        echo "✅ WHEN I run ./setup-cluster.sh"  
        echo "✅ THEN kubectl get nodes shows ready kind cluster with infometis namespace created"
    else
        echo "❌ Some tests failed. TDD success criteria not met."
    fi
    
    echo ""
    echo "Final verification:"
    echo "  • Nodes: $(kubectl get nodes --no-headers 2>/dev/null | wc -l) ready"
    echo "  • Namespace: $(kubectl get namespace infometis --no-headers 2>/dev/null | wc -l) infometis"
    echo ""
    
    return $exit_code
}

# Execute tests
main "$@"
exit $?