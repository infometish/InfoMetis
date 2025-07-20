#!/bin/bash
set -eu

# InfoMetis v0.2.0 - R1: Reset NiFi to Clean State
# Removes all process groups, flows, and resets NiFi to fresh state

echo "🧹 InfoMetis v0.2.0 - R1: Reset NiFi to Clean State"
echo "=================================================="
echo "Removing all process groups and resetting NiFi"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function: Get all process groups in root
get_process_groups() {
    echo "🔍 Finding all process groups..."
    
    local groups=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/root")
    local group_ids=$(echo "$groups" | grep -o '"id":"[^"]*"' | grep -v '"id":"root"' | cut -d'"' -f4)
    
    if [ -n "$group_ids" ]; then
        echo "📋 Found process groups:"
        # Get group names for display
        for id in $group_ids; do
            local name=$(echo "$groups" | grep -B 5 -A 5 "\"id\":\"$id\"" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
            echo "   - $name ($id)"
        done
        echo "$group_ids"
    else
        echo "✅ No process groups found (already clean)"
        echo ""
    fi
}

# Function: Stop all processors in a process group
stop_processors_in_group() {
    local group_id="$1"
    local group_name="$2"
    
    echo "⏹️  Stopping processors in $group_name..."
    
    # Get all processors in the group
    local processors=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/process-groups/$group_id/processors")
    local processor_ids=$(echo "$processors" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    for proc_id in $processor_ids; do
        # Stop the processor
        kubectl exec -n infometis statefulset/nifi -- curl -s -X PUT \
            -H "Content-Type: application/json" \
            -d '{"revision":{"version":0},"component":{"id":"'$proc_id'","state":"STOPPED"}}' \
            "http://localhost:8080/nifi-api/processors/$proc_id" >/dev/null 2>&1
    done
    
    echo "   ✅ Processors stopped in $group_name"
}

# Function: Delete process group
delete_process_group() {
    local group_id="$1"
    local group_name="$2"
    
    echo "🗑️  Deleting process group: $group_name"
    
    # First, stop all processors in the group
    stop_processors_in_group "$group_id" "$group_name"
    
    # Wait a moment for processors to stop
    sleep 2
    
    # Delete the process group
    local response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X DELETE \
        "http://localhost:8080/nifi-api/process-groups/$group_id?version=0" 2>/dev/null)
    
    if echo "$response" | grep -q "error\|Error" 2>/dev/null; then
        echo -e "   ${YELLOW}⚠️  Warning: Could not delete $group_name (may have active components)${NC}"
        
        # Try to force stop and delete again
        echo "   🔄 Attempting force cleanup..."
        
        # Force stop all components
        kubectl exec -n infometis statefulset/nifi -- curl -s -X PUT \
            -H "Content-Type: application/json" \
            -d '{"id":"'$group_id'","state":"STOPPED"}' \
            "http://localhost:8080/nifi-api/flow/process-groups/$group_id" >/dev/null 2>&1
        
        sleep 3
        
        # Try delete again
        kubectl exec -n infometis statefulset/nifi -- curl -s -X DELETE \
            "http://localhost:8080/nifi-api/process-groups/$group_id?version=0" >/dev/null 2>&1
    fi
    
    echo -e "   ${GREEN}✅ Deleted: $group_name${NC}"
}

# Function: Clear all process groups
clear_all_process_groups() {
    echo "🧹 Clearing all process groups..."
    
    local group_ids
    group_ids=$(get_process_groups)
    
    if [ -n "$group_ids" ]; then
        # Get group info for names
        local groups=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/root")
        
        for group_id in $group_ids; do
            local group_name=$(echo "$groups" | grep -B 5 -A 5 "\"id\":\"$group_id\"" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
            delete_process_group "$group_id" "$group_name"
        done
        
        echo -e "${GREEN}✅ All process groups cleared${NC}"
    else
        echo -e "${GREEN}✅ No process groups to clear${NC}"
    fi
}

# Function: Clear Registry version control (optional)
clear_registry_flows() {
    local clear_registry="${1:-no}"
    
    if [ "$clear_registry" = "yes" ] || [ "$clear_registry" = "y" ]; then
        echo ""
        echo "🗂️  Clearing Registry flows..."
        
        # Get Registry client ID
        local client_id=$(kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [ -n "$client_id" ]; then
            # Get bucket ID
            local bucket_id=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$client_id/buckets" | grep -A 5 '"name":"InfoMetis Flows"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
            
            if [ -n "$bucket_id" ]; then
                # Get all flows in bucket
                local flows=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$client_id/buckets/$bucket_id/flows")
                local flow_ids=$(echo "$flows" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)
                
                for flow_id in $flow_ids; do
                    local flow_name=$(echo "$flows" | grep -B 5 -A 5 "\"identifier\":\"$flow_id\"" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
                    echo "   🗑️  Deleting Registry flow: $flow_name"
                    
                    # Delete flow from Registry (via Registry API)
                    kubectl exec -n infometis deployment/nifi-registry -- curl -s -X DELETE \
                        "http://localhost:18080/nifi-registry-api/buckets/$bucket_id/flows/$flow_id" >/dev/null 2>&1
                done
                
                echo -e "   ${GREEN}✅ Registry flows cleared${NC}"
            fi
        fi
    else
        echo ""
        echo "ℹ️  Registry flows preserved (use 'yes' parameter to clear Registry)"
    fi
}

# Function: Restart NiFi for complete reset
restart_nifi() {
    local restart="${1:-no}"
    
    if [ "$restart" = "yes" ] || [ "$restart" = "y" ]; then
        echo ""
        echo "🔄 Restarting NiFi for complete reset..."
        
        kubectl rollout restart statefulset/nifi -n infometis
        
        echo "⏳ Waiting for NiFi to restart..."
        kubectl rollout status statefulset/nifi -n infometis --timeout=300s
        
        echo -e "${GREEN}✅ NiFi restarted successfully${NC}"
    else
        echo ""
        echo "ℹ️  NiFi restart skipped (use 'yes' parameter to restart)"
    fi
}

# Function: Verify clean state
verify_clean_state() {
    echo ""
    echo "🔍 Verifying clean state..."
    
    local groups=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/root")
    local group_count=$(echo "$groups" | grep -c '"processGroups":\[' || true)
    local processors=$(echo "$groups" | grep -o '"processors":\[[^]]*\]' | wc -l)
    
    if [ "$group_count" -eq 0 ] || [ "$processors" -eq 0 ]; then
        echo -e "${GREEN}✅ NiFi is in clean state${NC}"
        echo "   - No process groups"
        echo "   - No processors in root"
        echo "   - Ready for fresh pipeline creation"
    else
        echo -e "${YELLOW}⚠️  NiFi may still have some components${NC}"
        echo "   - Check NiFi UI: http://localhost/nifi"
    fi
}

# Main execution
main() {
    local clear_registry="${1:-no}"
    local restart_nifi="${2:-no}"
    
    echo "🚨 WARNING: This will delete ALL process groups in NiFi!"
    echo ""
    echo "Parameters:"
    echo "  Clear Registry flows: $clear_registry"
    echo "  Restart NiFi: $restart_nifi"
    echo ""
    
    # Confirmation prompt (can be skipped with -y)
    if [[ "${3:-}" != "-y" ]]; then
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [[ "$confirm" != "yes" && "$confirm" != "y" ]]; then
            echo "❌ Operation cancelled"
            exit 0
        fi
    fi
    
    echo ""
    echo "🧹 Starting NiFi cleanup..."
    
    # Clear all process groups
    clear_all_process_groups
    
    # Clear Registry flows if requested
    clear_registry_flows "$clear_registry"
    
    # Restart NiFi if requested
    restart_nifi "$restart_nifi"
    
    # Verify clean state
    verify_clean_state
    
    echo ""
    echo -e "${GREEN}🎉 NiFi reset completed!${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "   • Access clean NiFi: http://localhost/nifi"
    echo "   • Create new pipelines: ./P1-create-test-pipeline.sh"
    echo "   • Test Registry integration: ./P3-test-pipeline-registry-integration.sh"
}

# Usage information
show_usage() {
    echo "Usage: $0 [clear_registry] [restart_nifi] [-y]"
    echo ""
    echo "Parameters:"
    echo "  clear_registry  : 'yes' to clear Registry flows, 'no' to preserve (default: no)"
    echo "  restart_nifi    : 'yes' to restart NiFi pod, 'no' to skip (default: no)"
    echo "  -y              : Skip confirmation prompt"
    echo ""
    echo "Examples:"
    echo "  $0                    # Clear process groups only"
    echo "  $0 yes                # Clear process groups + Registry flows"
    echo "  $0 yes yes            # Clear everything + restart NiFi"
    echo "  $0 no yes -y          # Restart NiFi without confirmation"
}

# Check for help
if [[ "${1:-}" = "-h" || "${1:-}" = "--help" ]]; then
    show_usage
    exit 0
fi

# Run main function
main "$@"