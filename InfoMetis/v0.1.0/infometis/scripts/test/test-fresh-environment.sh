#!/bin/bash
# test-fresh-environment.sh
# Verifies that the environment is fresh and ready for InfoMetis k0s deployment

set -eu

CLUSTER_NAME="infometis"

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

# Test kubectl availability
test_kubectl() {
    echo "📋 Test 2: kubectl availability"
    
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl is not installed"
        return 1
    fi
    
    echo "✅ kubectl is installed"
    return 0
}

# Test no existing k0s containers
test_no_existing_containers() {
    echo "📋 Test 3: No existing k0s containers"
    
    local containers
    containers=$(docker ps -a --format "{{.Names}}" 2>/dev/null | grep -E "^${CLUSTER_NAME}$" || echo "")
    
    if [[ -n "$containers" ]]; then
        echo "⚠️  Existing k0s containers found:"
        echo "$containers"
        echo "❌ Environment is not fresh - k0s containers exist"
        return 1
    fi
    
    echo "✅ No existing k0s containers found"
    return 0
}

# Test Docker network conflicts
test_docker_networks() {
    echo "📋 Test 4: Docker network conflicts"
    
    # Check for networks that might conflict with k0s
    local conflicting_networks
    conflicting_networks=$(docker network ls --format "{{.Name}}" 2>/dev/null | grep -E "(k0s|infometis)" || echo "")
    
    if [[ -n "$conflicting_networks" ]]; then
        echo "⚠️  Potentially conflicting Docker networks found:"
        echo "$conflicting_networks"
        echo "❌ Docker networks may conflict with k0s"
        return 1
    fi
    
    echo "✅ No conflicting Docker networks found"
    return 0
}

# Test port availability
test_port_availability() {
    echo "📋 Test 5: Required port availability"
    
    local ports=(6443 8080 8443)
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
    
    echo "✅ All required ports (6443, 8080, 8443) are available"
    return 0
}

# Test kubectl context cleanup
test_kubectl_context_cleanup() {
    echo "📋 Test 6: kubectl context cleanup"
    
    local existing_context
    existing_context=$(kubectl config get-contexts -o name 2>/dev/null | grep "k0s-${CLUSTER_NAME}" || echo "")
    
    if [[ -n "$existing_context" ]]; then
        echo "⚠️  Existing kubectl context found: $existing_context"
        echo "❌ kubectl context may conflict with fresh setup"
        return 1
    fi
    
    echo "✅ No conflicting kubectl contexts found"
    return 0
}

# Test disk space availability
test_disk_space() {
    echo "📋 Test 7: Disk space availability"
    
    # Check available disk space (need at least 2GB for containers)
    local available_space_kb
    available_space_kb=$(df . | tail -1 | awk '{print $4}')
    local available_space_gb=$((available_space_kb / 1024 / 1024))
    
    if [[ $available_space_gb -lt 2 ]]; then
        echo "❌ Insufficient disk space: ${available_space_gb}GB available (need at least 2GB)"
        return 1
    fi
    
    echo "✅ Sufficient disk space: ${available_space_gb}GB available"
    return 0
}

# Test container image cache
test_container_cache() {
    echo "📋 Test 8: Container image cache status"
    
    local cache_dir="../../cache/images"
    local cache_files=(
        "k0sproject-k0s-latest.tar"
        "traefik-latest.tar"
        "apache-nifi-latest.tar"
    )
    
    if [[ ! -d "$cache_dir" ]]; then
        echo "⚠️  Cache directory not found: $cache_dir"
        echo "📋 Cache will be created during deployment"
        return 0
    fi
    
    local cached_count=0
    for cache_file in "${cache_files[@]}"; do
        if [[ -f "$cache_dir/$cache_file" ]]; then
            cached_count=$((cached_count + 1))
        fi
    done
    
    if [[ $cached_count -eq ${#cache_files[@]} ]]; then
        echo "✅ All container images are cached (${cached_count}/${#cache_files[@]})"
        echo "📋 Use --cached flag for faster deployment"
    elif [[ $cached_count -gt 0 ]]; then
        echo "⚠️  Partial cache found (${cached_count}/${#cache_files[@]} images)"
        echo "📋 Some images will be downloaded during deployment"
    else
        echo "📋 No cached images found - will download during deployment"
    fi
    
    return 0
}

# Display environment info
display_environment_info() {
    echo ""
    echo "🔍 Environment Information:"
    echo "=========================="
    echo "• OS: $(uname -s) $(uname -r)"
    echo "• Docker: $(docker --version)"
    echo "• kubectl: $(kubectl version --client 2>/dev/null | head -1)"
    
    if grep -q Microsoft /proc/version 2>/dev/null; then
        echo "• Platform: WSL (Windows Subsystem for Linux)"
    else
        echo "• Platform: Native Linux"
    fi
    
    echo "• Available disk space: $(df -h . | tail -1 | awk '{print $4}')"
    echo "• Required ports: 6443 (k0s API), 8080 (HTTP), 8443 (HTTPS)"
    echo ""
}

# Main test execution
main() {
    echo "🎯 InfoMetis Fresh Environment Test (k0s)"
    echo "=========================================="
    
    local exit_code=0
    
    # Run all tests
    test_docker || exit_code=1
    test_kubectl || exit_code=1
    test_no_existing_containers || exit_code=1
    test_docker_networks || exit_code=1
    test_port_availability || exit_code=1
    test_kubectl_context_cleanup || exit_code=1
    test_disk_space || exit_code=1
    test_container_cache || exit_code=1
    
    display_environment_info
    
    if [[ $exit_code -eq 0 ]]; then
        echo "🎉 Environment is ready for InfoMetis k0s deployment!"
        echo ""
        echo "✅ GIVEN Docker and kubectl are available"
        echo "✅ WHEN the environment is clean and ports are free"
        echo "✅ THEN k0s cluster setup will succeed"
        echo ""
        echo "🚀 Next steps:"
        echo "  • Run: ./scripts/setup/setup-cluster.sh"
        echo "  • Or run: ./scripts/setup/setup-cluster.sh --cached"
        echo "  • Then test: ./scripts/test/test-cluster-setup.sh"
        echo ""
    else
        echo "❌ Environment issues detected. Please resolve before proceeding."
        echo ""
        echo "🔧 Common solutions:"
        echo "  • Stop conflicting services on required ports"
        echo "  • Remove existing containers: docker rm -f $CLUSTER_NAME"
        echo "  • Clean kubectl contexts: kubectl config delete-context k0s-$CLUSTER_NAME"
        echo "  • Free up disk space if needed"
        echo ""
    fi
    
    return $exit_code
}

# Execute tests
main "$@"
exit $?