#!/bin/bash
# test-cluster-setup.sh
# TDD test script for k0s-in-Docker cluster setup

set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CLUSTER_NAME="infometis"

echo "🧪 Testing InfoMetis k0s cluster setup..."

# Test Docker availability
test_docker_available() {
    echo "📋 Test 1: Docker availability"
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "❌ Docker daemon is not running"
        return 1
    fi
    
    echo "✅ Docker is available"
    return 0
}

# Test kubectl availability
test_kubectl_available() {
    echo "📋 Test 2: kubectl availability"
    
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl is not installed"
        return 1
    fi
    
    echo "✅ kubectl is available"
    return 0
}

# Test cluster connectivity
test_cluster_connectivity() {
    echo "📋 Test 3: Cluster connectivity"
    
    # Check kubectl context
    local current_context
    current_context=$(kubectl config current-context 2>/dev/null || echo "")
    
    if [[ "$current_context" != "k0s-${CLUSTER_NAME}" ]]; then
        echo "❌ Wrong kubectl context: $current_context (expected: k0s-${CLUSTER_NAME})"
        return 1
    fi
    
    # Test cluster access
    if ! kubectl cluster-info &>/dev/null; then
        echo "❌ Cannot access cluster"
        return 1
    fi
    
    echo "✅ Cluster connectivity verified"
    return 0
}

# Test node status
test_node_status() {
    echo "📋 Test 4: Node status"
    
    # Check if nodes are ready
    if ! kubectl get nodes --no-headers 2>/dev/null | grep -q "Ready"; then
        echo "❌ No nodes in Ready state"
        return 1
    fi
    
    # Check node count
    local node_count
    node_count=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
    
    if [[ $node_count -ne 1 ]]; then
        echo "❌ Expected 1 node, found $node_count"
        return 1
    fi
    
    echo "✅ Node is ready"
    return 0
}

# Test namespace creation
test_namespace_creation() {
    echo "📋 Test 5: Namespace creation"
    
    # Check if infometis namespace exists
    if ! kubectl get namespace infometis &>/dev/null; then
        echo "❌ infometis namespace not found"
        return 1
    fi
    
    echo "✅ infometis namespace exists"
    return 0
}

# Test Traefik ingress controller
test_traefik_deployment() {
    echo "📋 Test 6: Traefik ingress controller"
    
    # Check if Traefik deployment exists
    if ! kubectl get deployment traefik -n kube-system &>/dev/null; then
        echo "❌ Traefik deployment not found"
        return 1
    fi
    
    # Check if Traefik is ready
    if ! kubectl wait --for=condition=available --timeout=60s deployment/traefik -n kube-system &>/dev/null; then
        echo "❌ Traefik deployment not ready"
        return 1
    fi
    
    echo "✅ Traefik ingress controller is ready"
    return 0
}

# Test IngressClass
test_ingress_class() {
    echo "📋 Test 7: IngressClass configuration"
    
    # Check if traefik IngressClass exists
    if ! kubectl get ingressclass traefik &>/dev/null; then
        echo "❌ traefik IngressClass not found"
        return 1
    fi
    
    echo "✅ traefik IngressClass configured"
    return 0
}

# Test k0s container status
test_k0s_container() {
    echo "📋 Test 8: k0s container status"
    
    # Check if k0s container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^${CLUSTER_NAME}$"; then
        echo "❌ k0s container not running"
        return 1
    fi
    
    # Check container health
    local container_status
    container_status=$(docker inspect --format='{{.State.Status}}' "${CLUSTER_NAME}" 2>/dev/null || echo "not found")
    
    if [[ "$container_status" != "running" ]]; then
        echo "❌ k0s container status: $container_status"
        return 1
    fi
    
    echo "✅ k0s container is running"
    return 0
}

# Test master taint removal
test_master_taint() {
    echo "📋 Test 9: Master taint removal"
    
    # Check if master taint is removed
    local taint_count
    taint_count=$(kubectl get nodes -o json | jq '.items[0].spec.taints | length' 2>/dev/null || echo "0")
    
    if [[ $taint_count -gt 0 ]]; then
        echo "⚠️  Node still has taints (may be OK for some setups)"
        kubectl get nodes -o json | jq '.items[0].spec.taints' 2>/dev/null || echo "  Could not check taints"
    else
        echo "✅ Master taint removed"
    fi
    
    return 0
}

# Display cluster status
display_cluster_status() {
    echo ""
    echo "🔍 Cluster Status:"
    echo "=================="
    
    echo "• k0s Container:"
    docker ps --filter "name=${CLUSTER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  Failed to get container status"
    
    echo "• Cluster Nodes:"
    kubectl get nodes 2>/dev/null || echo "  Failed to get nodes"
    
    echo "• Traefik Status:"
    kubectl get pods -n kube-system -l app=traefik 2>/dev/null || echo "  Failed to get Traefik pods"
    
    echo "• Namespaces:"
    kubectl get namespaces 2>/dev/null || echo "  Failed to get namespaces"
    
    echo "• kubectl Context:"
    kubectl config current-context 2>/dev/null || echo "  Failed to get current context"
    
    echo ""
}

# Main test execution
main() {
    echo "🎯 InfoMetis k0s Cluster Setup TDD Tests"
    echo "========================================"
    
    local exit_code=0
    
    # Run all tests
    test_docker_available || exit_code=1
    test_kubectl_available || exit_code=1
    test_cluster_connectivity || exit_code=1
    test_node_status || exit_code=1
    test_namespace_creation || exit_code=1
    test_traefik_deployment || exit_code=1
    test_ingress_class || exit_code=1
    test_k0s_container || exit_code=1
    test_master_taint || exit_code=1
    
    display_cluster_status
    
    if [[ $exit_code -eq 0 ]]; then
        echo "🎉 All tests passed! k0s cluster setup successful."
        echo ""
        echo "✅ GIVEN Docker and kubectl are available"
        echo "✅ WHEN k0s cluster is set up"
        echo "✅ THEN cluster is ready with Traefik ingress"
        echo ""
        echo "🚀 k0s cluster is ready for NiFi deployment!"
        echo "   Context: k0s-${CLUSTER_NAME}"
        echo "   Namespace: infometis"
        echo "   Ingress: Traefik"
    else
        echo "❌ Some tests failed. Cluster setup incomplete."
    fi
    
    echo ""
    return $exit_code
}

# Execute tests
main "$@"
exit $?