#!/bin/bash
# test-traefik-ingress.sh
# TDD test script for Issue #5 - Traefik Ingress for NiFi UI Access

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TRAEFIK_MANIFEST="${PROJECT_ROOT}/deploy/kubernetes/traefik-config.yaml"

echo "🧪 Testing InfoMetis Traefik ingress..."

# Test manifest file exists
test_manifest_exists() {
    echo "📋 Test 1: Traefik manifest file exists"
    
    if [[ ! -f "${TRAEFIK_MANIFEST}" ]]; then
        echo "❌ Traefik manifest not found: ${TRAEFIK_MANIFEST}"
        return 1
    fi
    
    echo "✅ Traefik manifest file exists"
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

# Test NiFi is running
test_nifi_running() {
    echo "📋 Test 3: NiFi is running before applying ingress"
    
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    if ! $kubectl_cmd get pods -n infometis --no-headers 2>/dev/null | grep -q "Running"; then
        echo "❌ NiFi is not running - deploy NiFi first"
        return 1
    fi
    
    echo "✅ NiFi is running"
    return 0
}

# Test Traefik deployment
test_traefik_deployment() {
    echo "📋 Test 4: Traefik deployment applies successfully"
    
    # Apply Traefik manifest
    echo "🚀 Applying Traefik manifest..."
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    if ! $kubectl_cmd apply -f "${TRAEFIK_MANIFEST}" >/dev/null 2>&1; then
        echo "❌ Failed to apply Traefik manifest"
        return 1
    fi
    
    echo "✅ Traefik manifest applied successfully"
    return 0
}

# Test traefik ingress pod startup
test_traefik_pod_running() {
    echo "📋 Test 5: traefik ingress controller reaches Running status"
    
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    echo "⏳ Waiting for traefik ingress controller to start (timeout: 60 seconds)..."
    
    # Wait for pod to be running
    if timeout 60 bash -c "
        while true; do
            if $kubectl_cmd get pods -n kube-system -l app=traefik --no-headers 2>/dev/null | grep -q 'Running'; then
                exit 0
            fi
            sleep 5
        done
    "; then
        echo "✅ traefik ingress controller is running"
        return 0
    else
        echo "❌ traefik ingress controller did not reach Running status within 60 seconds"
        echo "Current traefik ingress controller status:"
        $kubectl_cmd get pods -n kube-system -l app=traefik 2>/dev/null || echo "Failed to get pod status"
        return 1
    fi
}

# Test ingress configuration
test_ingress_configured() {
    echo "📋 Test 6: NiFi ingress is configured"
    
    local kubectl_cmd
    if command -v kubectl &> /dev/null; then
        kubectl_cmd="kubectl"
    else
        kubectl_cmd="~/.local/bin/kubectl"
    fi
    
    # Check if ingress exists
    if ! $kubectl_cmd get ingress nifi-ingress -n infometis >/dev/null 2>&1; then
        echo "❌ NiFi ingress not found"
        return 1
    fi
    
    echo "✅ NiFi ingress is configured"
    return 0
}

# Test NiFi accessibility via ingress
test_nifi_accessibility() {
    echo "📋 Test 7: NiFi is accessible via localhost:8080"
    
    echo "⏳ Waiting for ingress to be ready (10 seconds)..."
    sleep 10
    
    # Test HTTP access to NiFi
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/nifi" 2>/dev/null || echo "000")
    
    # Accept 200 (success), 401 (unauthorized), or 302 (redirect) as NiFi might require auth or redirect
    if [[ "$http_code" == "200" || "$http_code" == "401" || "$http_code" == "302" ]]; then
        echo "✅ NiFi is accessible (HTTP $http_code)"
        return 0
    else
        echo "❌ NiFi is not accessible (HTTP $http_code)"
        echo "Troubleshooting information:"
        
        local kubectl_cmd
        if command -v kubectl &> /dev/null; then
            kubectl_cmd="kubectl"
        else
            kubectl_cmd="~/.local/bin/kubectl"
        fi
        
        echo "• traefik ingress pods:"
        $kubectl_cmd get pods -n kube-system -l app=traefik 2>/dev/null || echo "  Failed to get traefik ingress pods"
        
        echo "• traefik ingress service:"
        $kubectl_cmd get service traefik -n kube-system 2>/dev/null || echo "  Failed to get traefik ingress service"
        
        echo "• NiFi ingress:"
        $kubectl_cmd get ingress nifi-ingress -n infometis 2>/dev/null || echo "  Failed to get NiFi ingress"
        
        return 1
    fi
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
    
    echo "• traefik ingress Pods:"
    $kubectl_cmd get pods -n kube-system -l app=traefik 2>/dev/null || echo "  Failed to get traefik ingress pods"
    
    echo "• traefik ingress Service:"
    $kubectl_cmd get service traefik -n kube-system 2>/dev/null || echo "  Failed to get traefik ingress service"
    
    echo "• NiFi Ingress:"
    $kubectl_cmd get ingress nifi-ingress -n infometis 2>/dev/null || echo "  Failed to get NiFi ingress"
    
    echo "• IngressClass:"
    $kubectl_cmd get ingressclass traefik 2>/dev/null || echo "  Failed to get IngressClass"
    
    echo ""
}

# Main test execution
main() {
    echo "🎯 InfoMetis Traefik Ingress TDD Tests"
    echo "======================================"
    
    local exit_code=0
    
    # Run all tests
    test_manifest_exists || exit_code=1
    test_kubectl_context || exit_code=1
    test_nifi_running || exit_code=1
    test_traefik_deployment || exit_code=1
    test_traefik_pod_running || exit_code=1
    test_ingress_configured || exit_code=1
    test_nifi_accessibility || exit_code=1
    
    display_deployment_status
    
    if [[ $exit_code -eq 0 ]]; then
        echo "🎉 All tests passed! Issue #5 TDD success criteria met."
        echo ""
        echo "✅ GIVEN NiFi is deployed"
        echo "✅ WHEN I run kubectl apply -f traefik-config.yaml"  
        echo "✅ THEN opening http://localhost:8080/nifi in browser shows NiFi login screen"
        echo ""
        echo "🚀 NiFi is accessible via traefik ingress!"
        echo "   Visit: http://localhost:8080/nifi"
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