#!/bin/bash
# test-fresh-environment.sh
# Verifies that the environment is fresh and ready for InfoMetis deployment

set -euo pipefail

echo "🧪 Testing InfoMetis Fresh Environment..."

# Test Docker availability
test_docker() {
    echo "📋 Test 1: Docker availability"
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "❌ Docker daemon is not running"
        return 1
    fi
    
    echo "✅ Docker is installed and running"
    return 0
}

# Test kind availability
test_kind() {
    echo "📋 Test 2: kind availability"
    
    if ! command -v kind &> /dev/null; then
        echo "❌ kind is not installed"
        return 1
    fi
    
    echo "✅ kind is installed"
    return 0
}

# Test kubectl availability
test_kubectl() {
    echo "📋 Test 3: kubectl availability"
    
    if ! command -v kubectl &> /dev/null && ! command -v ~/.local/bin/kubectl &> /dev/null; then
        echo "❌ kubectl is not installed"
        return 1
    fi
    
    echo "✅ kubectl is installed"
    return 0
}

# Test no existing clusters
test_no_existing_clusters() {
    echo "📋 Test 4: No existing kind clusters"
    
    local clusters
    clusters=$(kind get clusters 2>/dev/null || echo "")
    
    if [[ -n "$clusters" ]]; then
        echo "⚠️  Existing kind clusters found:"
        echo "$clusters"
        echo "❌ Environment is not fresh - clusters exist"
        return 1
    fi
    
    echo "✅ No existing kind clusters found"
    return 0
}

# Test Docker network conflicts
test_docker_networks() {
    echo "📋 Test 5: Docker network conflicts"
    
    # Check for networks that might conflict with kind
    local conflicting_networks
    conflicting_networks=$(docker network ls --format "{{.Name}}" 2>/dev/null | grep -E "(kind|infometis)" || echo "")
    
    if [[ -n "$conflicting_networks" ]]; then
        echo "⚠️  Potentially conflicting Docker networks found:"
        echo "$conflicting_networks"
        echo "❌ Docker networks may conflict with kind"
        return 1
    fi
    
    echo "✅ No conflicting Docker networks found"
    return 0
}

# Test port availability
test_port_availability() {
    echo "📋 Test 6: Required port availability"
    
    local ports=(8080 8443 9090)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -ln 2>/dev/null | grep -q ":${port} " || ss -ln 2>/dev/null | grep -q ":${port} "; then
            occupied_ports+=("$port")
        fi
    done
    
    if [[ ${#occupied_ports[@]} -gt 0 ]]; then
        echo "⚠️  Some required ports are occupied: ${occupied_ports[*]}"
        echo "❌ Port conflicts may prevent proper setup"
        return 1
    fi
    
    echo "✅ All required ports (8080, 8443, 9090) are available"
    return 0
}

# Display environment info
display_environment_info() {
    echo ""
    echo "🔍 Environment Information:"
    echo "=========================="
    echo "• OS: $(uname -s) $(uname -r)"
    echo "• Docker: $(docker --version)"
    echo "• kind: $(kind version | head -1)"
    
    if command -v kubectl &> /dev/null; then
        echo "• kubectl: $(kubectl version --client 2>/dev/null | head -1)"
    elif command -v ~/.local/bin/kubectl &> /dev/null; then
        echo "• kubectl: $(~/.local/bin/kubectl version --client 2>/dev/null | head -1)"
    fi
    
    if grep -q Microsoft /proc/version 2>/dev/null; then
        echo "• Platform: WSL (Windows Subsystem for Linux)"
    else
        echo "• Platform: Native Linux"
    fi
    echo ""
}

# Main test execution
main() {
    echo "🎯 InfoMetis Fresh Environment Test"
    echo "==================================="
    
    local exit_code=0
    
    # Run all tests
    test_docker || exit_code=1
    test_kind || exit_code=1
    test_kubectl || exit_code=1
    test_no_existing_clusters || exit_code=1
    test_docker_networks || exit_code=1
    test_port_availability || exit_code=1
    
    display_environment_info
    
    if [[ $exit_code -eq 0 ]]; then
        echo "🎉 Environment is fresh and ready for InfoMetis deployment!"
        echo ""
        echo "✅ Ready to run: ./scripts/setup/setup-cluster.sh"
    else
        echo "❌ Environment is not fresh or has issues that need resolution"
        echo ""
        echo "Please resolve the issues above before proceeding with InfoMetis deployment."
    fi
    
    echo ""
    return $exit_code
}

# Execute tests
main "$@"
exit $?