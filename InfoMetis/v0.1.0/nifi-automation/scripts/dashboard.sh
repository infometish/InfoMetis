#!/bin/bash

# Simple Pipeline Dashboard
# Usage: ./dashboard.sh [--watch]

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINES_DIR="$SCRIPTS_DIR/../pipelines"
NIFI_URL="${NIFI_URL:-http://nifi-service:8080}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
BOLD='\033[1m'
NC='\033[0m'

# Clear screen function
clear_screen() {
    if [ "$1" = "--watch" ]; then
        clear
    fi
}

# Get status emoji
get_status_emoji() {
    local status="$1"
    case "$status" in
        "RUNNING") echo "🟢" ;;
        "STOPPED") echo "🔴" ;;
        "PARTIAL") echo "🟡" ;;
        *) echo "⚪" ;;
    esac
}

# Main dashboard function
show_dashboard() {
    clear_screen "$1"
    
    echo -e "${BOLD}${BLUE}📊 NiFi Pipeline Operations Dashboard${NC}"
    echo -e "${GRAY}$(date)${NC}"
    echo ""
    
    # System overview
    echo -e "${BOLD}🏠 System Overview${NC}"
    
    if [ ! -d "$PIPELINES_DIR" ] || [ -z "$(ls -A "$PIPELINES_DIR" 2>/dev/null)" ]; then
        echo "   No pipelines found"
        echo ""
        echo -e "${BLUE}🚀 Quick Start:${NC}"
        echo "   1. Create your first pipeline: ./create-pipeline.sh ../templates/customer-pipeline.yaml"
        echo "   2. List available templates: ./list-templates.sh"
        echo ""
        return
    fi
    
    # Count pipelines
    total_pipelines=0
    running_pipelines=0
    stopped_pipelines=0
    
    for config in "$PIPELINES_DIR"/*.json; do
        if [ -f "$config" ]; then
            total_pipelines=$((total_pipelines + 1))
            # For now, assume all are running (we'd need API calls to check real status)
            running_pipelines=$((running_pipelines + 1))
        fi
    done
    
    echo "   ├── Total Pipelines: $total_pipelines"
    echo "   ├── Running: $(get_status_emoji "RUNNING") $running_pipelines"
    echo "   ├── Stopped: $(get_status_emoji "STOPPED") $stopped_pipelines"
    echo "   └── NiFi URL: $NIFI_URL"
    echo ""
    
    # Pipeline list
    echo -e "${BOLD}🔄 Active Pipelines${NC}"
    echo ""
    
    for config in "$PIPELINES_DIR"/*.json; do
        if [ -f "$config" ]; then
            if command -v jq &> /dev/null; then
                name=$(jq -r '.name' "$config")
                id=$(jq -r '.id' "$config")
                description=$(jq -r '.description' "$config")
                input_path=$(jq -r '.input_path' "$config")
                output_path=$(jq -r '.output_path' "$config")
                created=$(jq -r '.created' "$config")
                root_group_id=$(jq -r '.root_group_id' "$config")
                
                echo -e "${GREEN}📄 $name${NC}"
                echo "   ├── ID: $id"
                echo "   ├── Status: $(get_status_emoji "RUNNING") RUNNING (assumed)"
                echo "   ├── Input: $input_path"
                echo "   ├── Output: $output_path"
                echo "   ├── Created: $created"
                echo "   └── Links:"
                echo "      ├── Status: ./pipeline-status.sh $id"
                echo "      ├── NiFi UI: $NIFI_URL/nifi/?processGroupId=$root_group_id"
                echo "      └── Config: $config"
                echo ""
            else
                filename=$(basename "$config" .json)
                echo -e "${GREEN}📄 $filename${NC}"
                echo "   └── (Install jq for detailed information)"
                echo ""
            fi
        fi
    done
    
    # Quick actions
    echo -e "${BOLD}⚡ Quick Actions${NC}"
    echo "   ├── 🚀 Create Pipeline: ./create-pipeline.sh <definition.yaml>"
    echo "   ├── 📋 List Templates: ./list-templates.sh"
    echo "   ├── 📊 Pipeline Status: ./pipeline-status.sh <pipeline-id>"
    echo "   ├── 🔄 Refresh Dashboard: $0"
    echo "   └── 📖 Documentation: ../docs/nifi-pipeline-automation-design.md"
    echo ""
    
    if [ "$1" = "--watch" ]; then
        echo -e "${GRAY}Refreshing in 30 seconds... (Ctrl+C to exit)${NC}"
    fi
}

# Main execution
if [ "$1" = "--watch" ]; then
    # Watch mode - refresh every 30 seconds
    while true; do
        show_dashboard --watch
        sleep 30
    done
else
    # Single run
    show_dashboard
fi