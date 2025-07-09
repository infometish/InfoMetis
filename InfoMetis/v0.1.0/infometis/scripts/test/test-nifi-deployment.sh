#!/bin/bash
# test-nifi-deployment.sh
# TDD test script for Issue #4 - NiFi Deployment in Kubernetes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
NIFI_MANIFEST="${PROJECT_ROOT}/deploy/kubernetes/nifi-k8s.yaml"

echo "🧪 Testing InfoMetis NiFi deployment..."

# Test manifest file exists
test_manifest_exists() {
    echo "📋 Test 1: NiFi manifest file exists"
    
    if [[ ! -f "${NIFI_MANIFEST}" ]]; then
        echo "❌ NiFi manifest not found: ${NIFI_MANIFEST}"
        return 1
    fi
    
    echo "✅ NiFi manifest file exists"
    return 0
}

# Test kubectl context is correct
test_kubectl_context() {
    echo "📋 Test 2: kubectl context is k0s-infometis"
    
    local current_context
    if command -v kubectl &> /dev/null; then
        current_context=$(kubectl config current-context 2>/dev/null || echo "")
    elif command -v ~/.local/bin/kubectl &> /dev/null; then
        current_context=$(~/.local/bin/kubectl config current-context 2>/dev/null || echo "")
    else
        echo "❌ kubectl not found"
        return 1
    fi
    
    if [[ "$current_context" != "k0s-infometis" ]]; then
        echo "❌ Wrong kubectl context: $current_context (expected: k0s-infometis)"
        return 1
    fi
    
    echo "✅ kubectl context is correct"
    return 0
}

# Test NiFi deployment
test_nifi_deployment() {
    echo "📋 Test 3: NiFi deployment applies successfully"
    
    # Apply NiFi manifest
    echo "🚀 Applying NiFi manifest..."
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    if ! $kubectl_cmd apply -f "${NIFI_MANIFEST}" >/dev/null 2>&1; then
        echo "❌ Failed to apply NiFi manifest"
        return 1
    fi
    
    echo "✅ NiFi manifest applied successfully"
    return 0
}

# Test NiFi pod startup
test_nifi_pod_running() {
    echo "📋 Test 4: NiFi pod reaches Running status within 2 minutes"
    
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    echo "⏳ Waiting for NiFi pod to start (timeout: 120 seconds)..."
    
    # Wait for pod to be running
    if timeout 120 bash -c "
        while true; do
            if $kubectl_cmd get pods -n infometis --no-headers 2>/dev/null | grep -q 'Running'; then
                exit 0
            fi
            sleep 5
        done
    "; then
        echo "✅ NiFi pod is running"
        return 0
    else
        echo "❌ NiFi pod did not reach Running status within 2 minutes"
        echo "Current pod status:"
        $kubectl_cmd get pods -n infometis 2>/dev/null || echo "Failed to get pod status"
        return 1
    fi
}

# Test NiFi service is accessible
test_nifi_service() {
    echo "📋 Test 5: NiFi service is accessible"
    
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    # Check if service exists
    if ! $kubectl_cmd get service nifi-service -n infometis >/dev/null 2>&1; then
        echo "❌ NiFi service not found"
        return 1
    fi
    
    echo "✅ NiFi service exists"
    return 0
}

# Test persistent volumes are bound
test_persistent_volumes() {
    echo "📋 Test 6: Persistent volumes are bound"
    
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    local pvcs=("nifi-content-repository" "nifi-database-repository" "nifi-flowfile-repository" "nifi-provenance-repository")
    local failed_pvcs=()
    
    for pvc in "${pvcs[@]}"; do
        local status
        status=$($kubectl_cmd get pvc "$pvc" -n infometis -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
        
        if [[ "$status" != "Bound" ]]; then
            failed_pvcs+=("$pvc:$status")
        fi
    done
    
    if [[ ${#failed_pvcs[@]} -gt 0 ]]; then
        echo "❌ Some PVCs are not bound: ${failed_pvcs[*]}"
        return 1
    fi
    
    echo "✅ All persistent volumes are bound"
    return 0
}

# Display deployment status
display_deployment_status() {
    echo ""
    echo "🔍 Deployment Status:"
    echo "===================="
    
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    echo "• Pods:"
    $kubectl_cmd get pods -n infometis 2>/dev/null || echo "  Failed to get pods"
    
    echo "• Services:"
    $kubectl_cmd get services -n infometis 2>/dev/null || echo "  Failed to get services"
    
    echo "• PVCs:"
    $kubectl_cmd get pvc -n infometis 2>/dev/null || echo "  Failed to get PVCs"
    
    echo ""
}

# Main test execution
main() {
    echo "🎯 InfoMetis NiFi Deployment TDD Tests"
    echo "======================================"
    
    local exit_code=0
    
    # Run all tests
    test_manifest_exists || exit_code=1
    test_kubectl_context || exit_code=1
    test_nifi_deployment || exit_code=1
    test_nifi_pod_running || exit_code=1
    test_nifi_service || exit_code=1
    test_persistent_volumes || exit_code=1
    
    display_deployment_status
    
    if [[ $exit_code -eq 0 ]]; then
        echo "🎉 All tests passed! Issue #4 TDD success criteria met."
        echo ""
        echo "✅ GIVEN kind cluster is running"
        echo "✅ WHEN I run kubectl apply -f nifi-k8s.yaml"  
        echo "✅ THEN kubectl get pods -n infometis shows NiFi pod in Running status within 2 minutes"
        echo ""
        echo "🚀 NiFi is ready! Access via:"
        echo "   kubectl port-forward -n infometis service/nifi-service 8080:8080"
        echo "   Then visit: http://localhost:8080/nifi"
        echo "   Credentials: admin / adminadminadmin"
    else
        echo "❌ Some tests failed. TDD success criteria not met."
    fi
    
    echo ""
    return $exit_code
}

# Execute tests
main "$@"
exit $?