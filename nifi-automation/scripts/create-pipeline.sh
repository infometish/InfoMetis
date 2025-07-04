#!/bin/bash

# NiFi Pipeline Creation Script
# Usage: ./create-pipeline.sh <pipeline-definition.yaml>

set -e

PIPELINE_DEF="$1"
NIFI_URL="${NIFI_URL:-http://nifi-service:8080}"
KUBECTL="${KUBECTL:-docker exec infometis-control-plane kubectl}"
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINES_DIR="$SCRIPTS_DIR/../pipelines"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if pipeline definition exists
if [ -z "$PIPELINE_DEF" ] || [ ! -f "$PIPELINE_DEF" ]; then
    error "Pipeline definition file not found: $PIPELINE_DEF"
fi

# Check if yq is available for YAML parsing
if ! command -v yq &> /dev/null; then
    error "yq is required for YAML parsing. Install with: npm install -g yq"
fi

log "Creating pipeline from definition: $PIPELINE_DEF"

# Parse pipeline definition
NAME=$(yq eval '.pipeline.name' "$PIPELINE_DEF")
DESCRIPTION=$(yq eval '.pipeline.description // "Automated pipeline"' "$PIPELINE_DEF")
INPUT_PATH=$(yq eval '.pipeline.input.path' "$PIPELINE_DEF")
OUTPUT_PATH=$(yq eval '.pipeline.output.path' "$PIPELINE_DEF")
INPUT_FORMAT=$(yq eval '.pipeline.input.format // "auto"' "$PIPELINE_DEF")
OUTPUT_FORMAT=$(yq eval '.pipeline.output.format // "auto"' "$PIPELINE_DEF")

if [ "$NAME" = "null" ] || [ "$INPUT_PATH" = "null" ] || [ "$OUTPUT_PATH" = "null" ]; then
    error "Invalid pipeline definition. Required: pipeline.name, pipeline.input.path, pipeline.output.path"
fi

PIPELINE_ID=$(echo "$NAME" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g')

log "Pipeline Details:"
echo "  Name: $NAME"
echo "  ID: $PIPELINE_ID"
echo "  Description: $DESCRIPTION"
echo "  Input: $INPUT_PATH ($INPUT_FORMAT)"
echo "  Output: $OUTPUT_PATH ($OUTPUT_FORMAT)"

# Create API test pod if needed
create_api_pod() {
    if ! $KUBECTL get pod api-test -n infometis &>/dev/null; then
        log "Creating API test pod..."
        $KUBECTL run api-test --image=nicolaka/netshoot -n infometis -- sleep 3600
        $KUBECTL wait --for=condition=ready pod/api-test -n infometis --timeout=60s
    fi
}

# Make API call through kubectl
nifi_api() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    if [ -n "$data" ]; then
        $KUBECTL exec -n infometis api-test -- curl -s -X "$method" \
            "$NIFI_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        $KUBECTL exec -n infometis api-test -- curl -s -X "$method" \
            "$NIFI_URL$endpoint"
    fi
}

# Get root process group ID
get_root_group_id() {
    nifi_api "GET" "/nifi-api/process-groups/root" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# Create processor
create_processor() {
    local processor_type="$1"
    local processor_name="$2"
    local x_pos="$3"
    local y_pos="$4"
    local properties="$5"
    
    local data="{
        \"revision\": {\"version\": 0},
        \"component\": {
            \"type\": \"$processor_type\",
            \"name\": \"$processor_name\",
            \"position\": {\"x\": $x_pos, \"y\": $y_pos}
        }
    }"
    
    nifi_api "POST" "/nifi-api/process-groups/$ROOT_GROUP_ID/processors" "$data" | \
        grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# Configure processor
configure_processor() {
    local processor_id="$1"
    local properties="$2"
    local auto_terminate="$3"
    
    local data="{
        \"revision\": {\"version\": 1},
        \"component\": {
            \"id\": \"$processor_id\",
            \"config\": {
                \"properties\": $properties"
    
    if [ -n "$auto_terminate" ]; then
        data="$data,\"autoTerminatedRelationships\": $auto_terminate"
    fi
    
    data="$data}
        }
    }"
    
    nifi_api "PUT" "/nifi-api/processors/$processor_id" "$data" > /dev/null
}

# Create connection
create_connection() {
    local source_id="$1"
    local dest_id="$2"
    local relationship="$3"
    
    local data="{
        \"revision\": {\"version\": 0},
        \"component\": {
            \"source\": {\"id\": \"$source_id\", \"type\": \"PROCESSOR\"},
            \"destination\": {\"id\": \"$dest_id\", \"type\": \"PROCESSOR\"},
            \"selectedRelationships\": [\"$relationship\"]
        }
    }"
    
    nifi_api "POST" "/nifi-api/process-groups/$ROOT_GROUP_ID/connections" "$data" | \
        grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# Start processor
start_processor() {
    local processor_id="$1"
    local version="$2"
    
    local data="{
        \"revision\": {\"version\": $version},
        \"state\": \"RUNNING\"
    }"
    
    nifi_api "PUT" "/nifi-api/processors/$processor_id/run-status" "$data" > /dev/null
}

# Main pipeline creation logic
main() {
    # Ensure API pod exists
    create_api_pod
    
    # Get root process group
    log "Getting root process group..."
    ROOT_GROUP_ID=$(get_root_group_id)
    
    if [ -z "$ROOT_GROUP_ID" ]; then
        error "Failed to get root process group ID"
    fi
    
    log "Root Process Group ID: $ROOT_GROUP_ID"
    
    # Create GetFile processor
    log "Creating GetFile processor..."
    GETFILE_ID=$(create_processor \
        "org.apache.nifi.processors.standard.GetFile" \
        "$NAME - Input" \
        100 100)
    
    if [ -z "$GETFILE_ID" ]; then
        error "Failed to create GetFile processor"
    fi
    
    success "GetFile processor created: $GETFILE_ID"
    
    # Configure GetFile processor
    log "Configuring GetFile processor..."
    GETFILE_PROPS="{
        \"Input Directory\": \"$INPUT_PATH\",
        \"Keep Source File\": \"true\",
        \"Recurse Subdirectories\": \"false\"
    }"
    
    configure_processor "$GETFILE_ID" "$GETFILE_PROPS"
    
    # Create PutFile processor
    log "Creating PutFile processor..."
    PUTFILE_ID=$(create_processor \
        "org.apache.nifi.processors.standard.PutFile" \
        "$NAME - Output" \
        400 100)
    
    if [ -z "$PUTFILE_ID" ]; then
        error "Failed to create PutFile processor"
    fi
    
    success "PutFile processor created: $PUTFILE_ID"
    
    # Configure PutFile processor
    log "Configuring PutFile processor..."
    PUTFILE_PROPS="{
        \"Directory\": \"$OUTPUT_PATH\",
        \"Conflict Resolution Strategy\": \"replace\"
    }"
    PUTFILE_AUTO_TERMINATE='["success", "failure"]'
    
    configure_processor "$PUTFILE_ID" "$PUTFILE_PROPS" "$PUTFILE_AUTO_TERMINATE"
    
    # Create connection
    log "Creating connection between processors..."
    CONNECTION_ID=$(create_connection "$GETFILE_ID" "$PUTFILE_ID" "success")
    
    if [ -z "$CONNECTION_ID" ]; then
        error "Failed to create connection"
    fi
    
    success "Connection created: $CONNECTION_ID"
    
    # Start processors
    log "Starting GetFile processor..."
    start_processor "$GETFILE_ID" 2
    
    log "Starting PutFile processor..."
    start_processor "$PUTFILE_ID" 2
    
    # Save pipeline metadata
    log "Saving pipeline configuration..."
    mkdir -p "$PIPELINES_DIR"
    
    cat > "$PIPELINES_DIR/$PIPELINE_ID.json" << EOF
{
  "id": "$PIPELINE_ID",
  "name": "$NAME",
  "description": "$DESCRIPTION",
  "input_path": "$INPUT_PATH",
  "output_path": "$OUTPUT_PATH",
  "processors": {
    "getfile": {
      "id": "$GETFILE_ID",
      "type": "GetFile",
      "name": "$NAME - Input"
    },
    "putfile": {
      "id": "$PUTFILE_ID",
      "type": "PutFile", 
      "name": "$NAME - Output"
    }
  },
  "connections": [
    {
      "id": "$CONNECTION_ID",
      "source": "$GETFILE_ID",
      "destination": "$PUTFILE_ID",
      "relationship": "success"
    }
  ],
  "root_group_id": "$ROOT_GROUP_ID",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "RUNNING"
}
EOF

    # Generate links
    NIFI_UI_URL="$NIFI_URL/nifi/?processGroupId=$ROOT_GROUP_ID"
    DASHBOARD_URL="http://localhost:3000/pipeline/$PIPELINE_ID"
    
    echo ""
    success "Pipeline '$NAME' created successfully!"
    echo ""
    echo "📊 Management Links:"
    echo "   Dashboard: $DASHBOARD_URL"
    echo "   NiFi UI: $NIFI_UI_URL"
    echo "   Config: $PIPELINES_DIR/$PIPELINE_ID.json"
    echo ""
    echo "🔧 Quick Commands:"
    echo "   Status: ./pipeline-status.sh $PIPELINE_ID"
    echo "   Stop: ./stop-pipeline.sh $PIPELINE_ID"
    echo "   Remove: ./remove-pipeline.sh $PIPELINE_ID"
    echo ""
    echo "📁 Test Data:"
    echo "   Add files to: $INPUT_PATH"
    echo "   Check output: $OUTPUT_PATH"
}

# Run main function
main "$@"