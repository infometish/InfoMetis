#!/bin/bash
# cleanup-environment.sh
# Cleans up InfoMetis environment to restore fresh state

set -euo pipefail

echo "🧹 InfoMetis Environment Cleanup"
echo "================================"

# Cleanup kind clusters
cleanup_kind_clusters() {
    echo "🔧 Cleaning up kind clusters..."
    
    local clusters
    clusters=$(kind get clusters 2>/dev/null || echo "")
    
    if [[ -n "$clusters" ]]; then
        echo "🗑️  Removing existing kind clusters:"
        while IFS= read -r cluster; do
            if [[ -n "$cluster" ]]; then
                echo "  • Deleting cluster: $cluster"
                kind delete cluster --name="$cluster"
            fi
        done <<< "$clusters"
        echo "✅ All kind clusters removed"
    else
        echo "✅ No kind clusters to remove"
    fi
}

# Cleanup Docker networks
cleanup_docker_networks() {
    echo "🌐 Cleaning up Docker networks..."
    
    # Find InfoMetis-related networks
    local networks
    networks=$(docker network ls --format "{{.Name}}" 2>/dev/null | grep -E "(kind|infometis)" || echo "")
    
    if [[ -n "$networks" ]]; then
        echo "🗑️  Removing InfoMetis-related Docker networks:"
        while IFS= read -r network; do
            if [[ -n "$network" && "$network" != "bridge" && "$network" != "host" && "$network" != "none" ]]; then
                echo "  • Removing network: $network"
                docker network rm "$network" 2>/dev/null || echo "    ⚠️  Failed to remove $network (may be in use)"
            fi
        done <<< "$networks"
        echo "✅ Docker networks cleanup completed"
    else
        echo "✅ No InfoMetis-related Docker networks to remove"
    fi
}

# Cleanup kubectl contexts
cleanup_kubectl_contexts() {
    echo "⚙️  Cleaning up kubectl contexts..."
    
    # Find kind-related contexts
    local contexts
    if command -v kubectl &> /dev/null; then
        contexts=$(kubectl config get-contexts --no-headers 2>/dev/null | awk '{print $2}' | grep -E "^kind-" || echo "")
    elif command -v ~/.local/bin/kubectl &> /dev/null; then
        contexts=$(~/.local/bin/kubectl config get-contexts --no-headers 2>/dev/null | awk '{print $2}' | grep -E "^kind-" || echo "")
    else
        contexts=""
    fi
    
    if [[ -n "$contexts" ]]; then
        echo "🗑️  Removing kind-related kubectl contexts:"
        while IFS= read -r context; do
            if [[ -n "$context" ]]; then
                echo "  • Removing context: $context"
                if command -v kubectl &> /dev/null; then
                    kubectl config delete-context "$context" 2>/dev/null || true
                elif command -v ~/.local/bin/kubectl &> /dev/null; then
                    ~/.local/bin/kubectl config delete-context "$context" 2>/dev/null || true
                fi
            fi
        done <<< "$contexts"
        echo "✅ kubectl contexts cleanup completed"
    else
        echo "✅ No kind-related kubectl contexts to remove"
    fi
}

# Stop processes using required ports
cleanup_port_conflicts() {
    echo "🚪 Checking for port conflicts..."
    
    local ports=(8080 8443 9090)
    local conflicts_found=false
    
    for port in "${ports[@]}"; do
        local pids
        pids=$(lsof -ti:$port 2>/dev/null || echo "")
        
        if [[ -n "$pids" ]]; then
            conflicts_found=true
            echo "⚠️  Port $port is in use by processes: $pids"
            echo "  To free port $port, run: sudo kill $pids"
        fi
    done
    
    if [[ "$conflicts_found" == "false" ]]; then
        echo "✅ No port conflicts found"
    else
        echo ""
        echo "⚠️  Manual intervention required for port conflicts"
        echo "   Run the kill commands above if you want to free the ports"
        echo "   Or ensure the services using these ports can coexist with InfoMetis"
    fi
}

# Cleanup Docker containers
cleanup_docker_containers() {
    echo "📦 Cleaning up InfoMetis Docker containers..."
    
    # Find InfoMetis-related containers
    local containers
    containers=$(docker ps -a --format "{{.Names}}" 2>/dev/null | grep -E "(kind|infometis)" || echo "")
    
    if [[ -n "$containers" ]]; then
        echo "🗑️  Removing InfoMetis-related containers:"
        while IFS= read -r container; do
            if [[ -n "$container" ]]; then
                echo "  • Removing container: $container"
                docker rm -f "$container" 2>/dev/null || echo "    ⚠️  Failed to remove $container"
            fi
        done <<< "$containers"
        echo "✅ Docker containers cleanup completed"
    else
        echo "✅ No InfoMetis-related containers to remove"
    fi
}

# Cleanup Docker volumes
cleanup_docker_volumes() {
    echo "💾 Cleaning up InfoMetis Docker volumes..."
    
    # Find InfoMetis-related volumes
    local volumes
    volumes=$(docker volume ls --format "{{.Name}}" 2>/dev/null | grep -E "(kind|infometis)" || echo "")
    
    if [[ -n "$volumes" ]]; then
        echo "🗑️  Removing InfoMetis-related volumes:"
        while IFS= read -r volume; do
            if [[ -n "$volume" ]]; then
                echo "  • Removing volume: $volume"
                docker volume rm "$volume" 2>/dev/null || echo "    ⚠️  Failed to remove $volume (may be in use)"
            fi
        done <<< "$volumes"
        echo "✅ Docker volumes cleanup completed"
    else
        echo "✅ No InfoMetis-related volumes to remove"
    fi
}

# Verify cleanup
verify_cleanup() {
    echo "🔍 Verifying cleanup..."
    
    # Check clusters
    local clusters
    clusters=$(kind get clusters 2>/dev/null || echo "")
    if [[ -n "$clusters" ]]; then
        echo "⚠️  Some clusters still exist: $clusters"
    else
        echo "✅ No kind clusters remaining"
    fi
    
    # Check networks
    local networks
    networks=$(docker network ls --format "{{.Name}}" 2>/dev/null | grep -E "(kind|infometis)" || echo "")
    if [[ -n "$networks" ]]; then
        echo "⚠️  Some InfoMetis networks still exist: $networks"
    else
        echo "✅ No InfoMetis networks remaining"
    fi
    
    echo "✅ Cleanup verification completed"
}

# Main cleanup execution
main() {
    echo "⚠️  This will remove all InfoMetis-related infrastructure!"
    echo "   • kind clusters"
    echo "   • Docker networks, containers, and volumes"
    echo "   • kubectl contexts"
    echo ""
    
    read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cleanup cancelled"
        exit 0
    fi
    
    echo ""
    echo "🚀 Starting cleanup..."
    
    cleanup_kind_clusters
    cleanup_kubectl_contexts
    cleanup_docker_containers
    cleanup_docker_volumes
    cleanup_docker_networks
    cleanup_port_conflicts
    verify_cleanup
    
    echo ""
    echo "🎉 InfoMetis environment cleanup completed!"
    echo ""
    echo "Environment should now be fresh. Run:"
    echo "  ./scripts/test/test-fresh-environment.sh"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    --force|-f)
        echo "🚀 Force cleanup (no confirmation)"
        cleanup_kind_clusters
        cleanup_kubectl_contexts
        cleanup_docker_containers
        cleanup_docker_volumes
        cleanup_docker_networks
        cleanup_port_conflicts
        verify_cleanup
        echo "🎉 Force cleanup completed!"
        ;;
    --help|-h)
        echo "InfoMetis Environment Cleanup Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --force, -f    Force cleanup without confirmation"
        echo "  --help, -h     Show this help message"
        echo ""
        echo "This script removes all InfoMetis-related infrastructure to restore"
        echo "a fresh environment suitable for new deployments."
        ;;
    *)
        main "$@"
        ;;
esac