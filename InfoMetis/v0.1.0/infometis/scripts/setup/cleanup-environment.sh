#!/bin/bash
set -eu

# InfoMetis k0s Environment Cleanup Script
# Removes k0s containers, contexts, and associated resources

CLUSTER_NAME="infometis"

echo "🧹 InfoMetis k0s Environment Cleanup"
echo "===================================="
echo "Cluster name: ${CLUSTER_NAME}"
echo ""

# Cleanup k0s container
cleanup_k0s_container() {
    echo "🐳 Cleaning up k0s container..."
    
    # Stop and remove k0s container
    if docker ps -a --format "{{.Names}}" | grep -q "^${CLUSTER_NAME}$"; then
        echo "  🛑 Stopping k0s container..."
        docker stop "${CLUSTER_NAME}" >/dev/null 2>&1 || echo "  ⚠️  Failed to stop container (may not be running)"
        
        echo "  🗑️  Removing k0s container..."
        docker rm "${CLUSTER_NAME}" >/dev/null 2>&1 || echo "  ⚠️  Failed to remove container"
        
        echo "  ✅ k0s container removed"
    else
        echo "  📋 No k0s container found"
    fi
}

# Cleanup kubectl context
cleanup_kubectl_context() {
    echo "⚙️  Cleaning up kubectl context..."
    
    local context_name="k0s-${CLUSTER_NAME}"
    
    # Check if context exists
    if kubectl config get-contexts -o name 2>/dev/null | grep -q "^${context_name}$"; then
        echo "  🗑️  Removing kubectl context: ${context_name}"
        kubectl config delete-context "${context_name}" >/dev/null 2>&1 || echo "  ⚠️  Failed to delete context"
        
        echo "  ✅ kubectl context removed"
    else
        echo "  📋 No kubectl context found"
    fi
    
    # Remove temporary kubeconfig file
    if [[ -f "/tmp/k0s-kubeconfig-${CLUSTER_NAME}" ]]; then
        rm "/tmp/k0s-kubeconfig-${CLUSTER_NAME}"
        echo "  ✅ Temporary kubeconfig removed"
    fi
}

# Cleanup Docker networks
cleanup_docker_networks() {
    echo "🌐 Cleaning up Docker networks..."
    
    local networks
    networks=$(docker network ls --format "{{.Name}}" 2>/dev/null | grep -E "(k0s|infometis|kind)" || echo "")
    
    if [[ -n "$networks" ]]; then
        echo "  🗑️  Removing Docker networks..."
        echo "$networks" | while read -r network; do
            if [[ -n "$network" ]]; then
                docker network rm "$network" >/dev/null 2>&1 || echo "  ⚠️  Failed to remove network: $network"
            fi
        done
        echo "  ✅ Docker networks cleaned"
    else
        echo "  📋 No Docker networks to clean"
    fi
}

# Cleanup Docker volumes
cleanup_docker_volumes() {
    echo "💾 Cleaning up Docker volumes..."
    
    local volumes
    volumes=$(docker volume ls --format "{{.Name}}" 2>/dev/null | grep -E "(k0s|infometis)" || echo "")
    
    if [[ -n "$volumes" ]]; then
        echo "  🗑️  Removing Docker volumes..."
        echo "$volumes" | while read -r volume; do
            if [[ -n "$volume" ]]; then
                docker volume rm "$volume" >/dev/null 2>&1 || echo "  ⚠️  Failed to remove volume: $volume"
            fi
        done
        echo "  ✅ Docker volumes cleaned"
    else
        echo "  📋 No Docker volumes to clean"
    fi
}

# Cleanup orphaned containers
cleanup_orphaned_containers() {
    echo "🔍 Cleaning up orphaned containers..."
    
    local containers
    containers=$(docker ps -a --format "{{.Names}}" 2>/dev/null | grep -E "(k0s|infometis|traefik|nifi)" || echo "")
    
    if [[ -n "$containers" ]]; then
        echo "  🗑️  Removing orphaned containers..."
        echo "$containers" | while read -r container; do
            if [[ -n "$container" && "$container" != "$CLUSTER_NAME" ]]; then
                docker rm -f "$container" >/dev/null 2>&1 || echo "  ⚠️  Failed to remove container: $container"
            fi
        done
        echo "  ✅ Orphaned containers cleaned"
    else
        echo "  📋 No orphaned containers found"
    fi
}

# Cleanup local files
cleanup_local_files() {
    echo "📁 Cleaning up local files..."
    
    # Remove temporary kubeconfig backup
    if [[ -f ~/.kube/config.backup ]]; then
        rm ~/.kube/config.backup
        echo "  ✅ Kubeconfig backup removed"
    fi
    
    # Remove any test pods
    if command -v kubectl &> /dev/null; then
        kubectl delete pod test-nifi-access --ignore-not-found=true >/dev/null 2>&1 || true
        echo "  ✅ Test pods cleaned"
    fi
    
    echo "  ✅ Local files cleaned"
}

# Verify cleanup
verify_cleanup() {
    echo "🔍 Verifying cleanup..."
    
    local issues=()
    
    # Check containers
    if docker ps -a --format "{{.Names}}" | grep -q "^${CLUSTER_NAME}$"; then
        issues+=("k0s container still exists")
    fi
    
    # Check contexts
    if kubectl config get-contexts -o name 2>/dev/null | grep -q "^k0s-${CLUSTER_NAME}$"; then
        issues+=("kubectl context still exists")
    fi
    
    # Check networks
    local networks
    networks=$(docker network ls --format "{{.Name}}" 2>/dev/null | grep -E "(k0s|infometis)" || echo "")
    if [[ -n "$networks" ]]; then
        issues+=("Docker networks still exist")
    fi
    
    if [[ ${#issues[@]} -eq 0 ]]; then
        echo "  ✅ Cleanup verification passed"
        return 0
    else
        echo "  ⚠️  Cleanup issues found:"
        for issue in "${issues[@]}"; do
            echo "    • $issue"
        done
        return 1
    fi
}

# Display cleanup status
display_cleanup_status() {
    echo ""
    echo "🔍 Cleanup Status:"
    echo "=================="
    
    echo "• k0s Containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -E "(NAME|${CLUSTER_NAME})" || echo "  No k0s containers found"
    
    echo "• kubectl Contexts:"
    kubectl config get-contexts -o name 2>/dev/null | grep -E "k0s" || echo "  No k0s contexts found"
    
    echo "• Docker Networks:"
    docker network ls --format "table {{.Name}}\t{{Driver}}" | grep -E "(NAME|k0s|infometis|kind)" || echo "  No k0s networks found"
    
    echo "• Docker Volumes:"
    docker volume ls --format "table {{.Name}}\t{{Driver}}" | grep -E "(NAME|k0s|infometis)" || echo "  No k0s volumes found"
    
    echo ""
}

# Main execution
main() {
    echo "⚠️  This will remove all InfoMetis k0s resources!"
    echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
    sleep 5
    
    cleanup_k0s_container
    cleanup_kubectl_context
    cleanup_docker_networks
    cleanup_docker_volumes
    cleanup_orphaned_containers
    cleanup_local_files
    
    display_cleanup_status
    
    if verify_cleanup; then
        echo "🎉 InfoMetis k0s environment cleanup complete!"
        echo ""
        echo "✅ All k0s resources removed"
        echo "✅ kubectl contexts cleaned"
        echo "✅ Docker resources cleaned"
        echo "✅ Local files cleaned"
        echo ""
        echo "🚀 Environment is ready for fresh deployment!"
        echo "   Run: ./scripts/setup/setup-cluster.sh"
        echo ""
    else
        echo "❌ Cleanup completed with some issues."
        echo "   Manual intervention may be required."
        echo ""
    fi
}

# Handle script arguments
case "${1:-}" in
    --force|-f)
        echo "🚀 Force cleanup (no confirmation)"
        cleanup_k0s_container
        cleanup_kubectl_context
        cleanup_docker_networks
        cleanup_docker_volumes
        cleanup_orphaned_containers
        cleanup_local_files
        verify_cleanup
        echo "🎉 Force cleanup completed!"
        ;;
    --help|-h)
        echo "InfoMetis k0s Environment Cleanup Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --force, -f    Force cleanup without confirmation"
        echo "  --help, -h     Show this help message"
        echo ""
        echo "This script removes all InfoMetis k0s resources to restore"
        echo "a fresh environment suitable for new deployments."
        ;;
    *)
        main "$@"
        ;;
esac