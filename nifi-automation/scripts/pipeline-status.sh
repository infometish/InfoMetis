#!/bin/bash

# NiFi Pipeline Status Monitor
# Usage: ./pipeline-status.sh <pipeline-id>

set -e

PIPELINE_ID="$1"
NIFI_URL="${NIFI_URL:-http://nifi-service:8080}"
KUBECTL="${KUBECTL:-docker exec infometis-control-plane kubectl}"
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINES_DIR="$SCRIPTS_DIR/../pipelines"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Usage information
if [ -z "$PIPELINE_ID" ]; then
    echo "Usage: $0 <pipeline-id>"
    echo ""
    echo "Available pipelines:"
    if [ -d "$PIPELINES_DIR" ]; then
        for file in "$PIPELINES_DIR"/*.json; do
            if [ -f "$file" ]; then
                name=$(jq -r '.name' "$file" 2>/dev/null || echo "Unknown")
                id=$(basename "$file" .json)
                echo "  $id - $name"
            fi
        done
    else
        echo "  No pipelines found"
    fi
    exit 1
fi

# Check if pipeline exists
PIPELINE_CONFIG="$PIPELINES_DIR/$PIPELINE_ID.json"
if [ ! -f "$PIPELINE_CONFIG" ]; then
    error "Pipeline not found: $PIPELINE_ID"
fi

# Make API call through kubectl
nifi_api() {
    local method="$1"
    local endpoint="$2"
    
    $KUBECTL exec -n infometis api-test -- curl -s -X "$method" \
        "$NIFI_URL$endpoint" 2>/dev/null || echo "{}"
}

# Get processor status
get_processor_status() {
    local processor_id="$1"
    nifi_api "GET" "/nifi-api/processors/$processor_id"
}

# Format uptime
format_uptime() {
    local start_time="$1"
    local current_time=$(date -u +%s)
    local start_timestamp=$(date -d "$start_time" +%s 2>/dev/null || echo "$current_time")
    local uptime_seconds=$((current_time - start_timestamp))
    
    if [ $uptime_seconds -lt 60 ]; then
        echo "${uptime_seconds}s"
    elif [ $uptime_seconds -lt 3600 ]; then
        echo "$((uptime_seconds / 60))m"
    elif [ $uptime_seconds -lt 86400 ]; then
        local hours=$((uptime_seconds / 3600))
        local minutes=$(((uptime_seconds % 3600) / 60))
        echo "${hours}h ${minutes}m"
    else
        local days=$((uptime_seconds / 86400))
        local hours=$(((uptime_seconds % 86400) / 3600))
        echo "${days}d ${hours}h"
    fi
}

# Get status emoji
get_status_emoji() {
    local status="$1"
    case "$status" in
        "Running") echo "🟢" ;;
        "Stopped") echo "🔴" ;;
        "Invalid") echo "🟡" ;;
        *) echo "⚪" ;;
    esac
}

# Main status check
main() {
    # Load pipeline configuration
    if ! command -v jq &> /dev/null; then
        error "jq is required for JSON parsing"
    fi
    
    NAME=$(jq -r '.name' "$PIPELINE_CONFIG")
    DESCRIPTION=$(jq -r '.description' "$PIPELINE_CONFIG")
    INPUT_PATH=$(jq -r '.input_path' "$PIPELINE_CONFIG")
    OUTPUT_PATH=$(jq -r '.output_path' "$PIPELINE_CONFIG")
    CREATED=$(jq -r '.created' "$PIPELINE_CONFIG")
    GETFILE_ID=$(jq -r '.processors.getfile.id' "$PIPELINE_CONFIG")
    PUTFILE_ID=$(jq -r '.processors.putfile.id' "$PIPELINE_CONFIG")
    ROOT_GROUP_ID=$(jq -r '.root_group_id' "$PIPELINE_CONFIG")
    
    # Check if API pod exists
    if ! $KUBECTL get pod api-test -n infometis &>/dev/null; then
        warn "API test pod not found. Creating one..."
        $KUBECTL run api-test --image=nicolaka/netshoot -n infometis -- sleep 3600
        $KUBECTL wait --for=condition=ready pod/api-test -n infometis --timeout=60s
    fi
    
    # Get processor statuses
    log "Fetching pipeline status..."
    
    GETFILE_DATA=$(get_processor_status "$GETFILE_ID")
    PUTFILE_DATA=$(get_processor_status "$PUTFILE_ID")
    
    # Parse status information
    GETFILE_STATUS=$(echo "$GETFILE_DATA" | jq -r '.status.aggregateSnapshot.runStatus // "Unknown"')
    PUTFILE_STATUS=$(echo "$PUTFILE_DATA" | jq -r '.status.aggregateSnapshot.runStatus // "Unknown"')
    
    GETFILE_FILES_OUT=$(echo "$GETFILE_DATA" | jq -r '.status.aggregateSnapshot.flowFilesOut // 0')
    PUTFILE_FILES_IN=$(echo "$PUTFILE_DATA" | jq -r '.status.aggregateSnapshot.flowFilesIn // 0')
    PUTFILE_FILES_OUT=$(echo "$PUTFILE_DATA" | jq -r '.status.aggregateSnapshot.flowFilesOut // 0')
    
    GETFILE_BYTES_OUT=$(echo "$GETFILE_DATA" | jq -r '.status.aggregateSnapshot.bytesOut // 0')
    PUTFILE_BYTES_IN=$(echo "$PUTFILE_DATA" | jq -r '.status.aggregateSnapshot.bytesIn // 0')
    
    # Determine overall status
    if [ "$GETFILE_STATUS" = "Running" ] && [ "$PUTFILE_STATUS" = "Running" ]; then
        OVERALL_STATUS="RUNNING"
        STATUS_EMOJI="🟢"
    elif [ "$GETFILE_STATUS" = "Stopped" ] && [ "$PUTFILE_STATUS" = "Stopped" ]; then
        OVERALL_STATUS="STOPPED"
        STATUS_EMOJI="🔴"
    else
        OVERALL_STATUS="PARTIAL"
        STATUS_EMOJI="🟡"
    fi
    
    # Calculate throughput (approximate)
    UPTIME=$(format_uptime "$CREATED")
    
    # Display status
    echo ""
    echo -e "${STATUS_EMOJI} ${GREEN}$NAME${NC} - ${OVERALL_STATUS}"
    echo -e "${GRAY}$DESCRIPTION${NC}"
    echo ""
    echo "📊 Pipeline Overview:"
    echo "   ├── Status: $OVERALL_STATUS"
    echo "   ├── Uptime: $UPTIME"
    echo "   ├── Input Path: $INPUT_PATH"
    echo "   └── Output Path: $OUTPUT_PATH"
    echo ""
    echo "🔧 Processor Status:"
    echo "   ├── GetFile: $(get_status_emoji "$GETFILE_STATUS") $GETFILE_STATUS"
    echo "   └── PutFile: $(get_status_emoji "$PUTFILE_STATUS") $PUTFILE_STATUS"
    echo ""
    echo "📈 Processing Metrics:"
    echo "   ├── Files Read: $GETFILE_FILES_OUT"
    echo "   ├── Files Written: $PUTFILE_FILES_OUT"
    echo "   ├── Bytes Processed: $GETFILE_BYTES_OUT"
    echo "   └── Success Rate: $([ "$GETFILE_FILES_OUT" -eq "$PUTFILE_FILES_OUT" ] && echo "100%" || echo "Calculating...")"
    echo ""
    echo "🔗 Management Links:"
    echo "   ├── NiFi UI: $NIFI_URL/nifi/?processGroupId=$ROOT_GROUP_ID"
    echo "   ├── Dashboard: http://localhost:3000/pipeline/$PIPELINE_ID"
    echo "   └── Config: $PIPELINE_CONFIG"
    echo ""
    echo "🔧 Quick Commands:"
    echo "   ├── Stop: ./stop-pipeline.sh $PIPELINE_ID"
    echo "   ├── Start: ./start-pipeline.sh $PIPELINE_ID"
    echo "   ├── Logs: ./pipeline-logs.sh $PIPELINE_ID"
    echo "   └── Remove: ./remove-pipeline.sh $PIPELINE_ID"
    echo ""
    
    # Show recent activity if available
    if [ "$GETFILE_FILES_OUT" -gt 0 ]; then
        echo "📁 Data Flow:"
        echo "   └── $GETFILE_FILES_OUT files → $PUTFILE_FILES_OUT files (processed)"
    else
        echo "📁 Data Flow:"
        echo "   └── No files processed yet"
    fi
    echo ""
}

# Run main function
main "$@"