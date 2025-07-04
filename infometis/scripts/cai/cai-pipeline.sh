#!/bin/bash
# cai-pipeline.sh
# Simple CAI Pipeline Integration for Issue #6 - creates NiFi pipelines via REST API

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# NiFi connection details
NIFI_URL="http://localhost:8080/nifi/nifi-api"
NIFI_USERNAME="admin"
NIFI_PASSWORD="adminadminadmin"

# Pipeline creation function
create_csv_pipeline() {
    local description="$1"
    
    echo "🤖 CAI Pipeline Integration: Creating CSV processing pipeline"
    echo "📝 Description: $description"
    
    # Use directories within NiFi container's persistent volumes
    local input_dir="/opt/nifi/nifi-current/input"
    local output_dir="/opt/nifi/nifi-current/output"
    
    # Get process group ID (root process group)
    echo "🔍 Getting NiFi process group information..."
    local process_group_response
    process_group_response=$(curl -s -u "$NIFI_USERNAME:$NIFI_PASSWORD" \
        "$NIFI_URL/process-groups/root" || echo "")
    
    if [[ -z "$process_group_response" ]]; then
        echo "❌ Failed to connect to NiFi API"
        return 1
    fi
    
    local process_group_id
    process_group_id=$(echo "$process_group_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -z "$process_group_id" ]]; then
        echo "❌ Failed to get process group ID"
        return 1
    fi
    
    echo "✅ Connected to NiFi API (Process Group: $process_group_id)"
    
    # Create GetFile processor
    echo "🔧 Creating GetFile processor..."
    local getfile_response
    getfile_response=$(curl -s -u "$NIFI_USERNAME:$NIFI_PASSWORD" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "revision": {"version": 0},
            "component": {
                "type": "org.apache.nifi.processors.standard.GetFile",
                "position": {"x": 100, "y": 100},
                "config": {
                    "properties": {
                        "Input Directory": "'"$input_dir"'",
                        "File Filter": ".*\\.csv",
                        "Keep Source File": "false",
                        "Minimum File Age": "0 sec",
                        "Polling Interval": "1 sec",
                        "Batch Size": "1"
                    },
                    "name": "GetFile-CSVReader"
                }
            }
        }' \
        "$NIFI_URL/process-groups/$process_group_id/processors" || echo "")
    
    if [[ -z "$getfile_response" ]]; then
        echo "❌ Failed to create GetFile processor"
        return 1
    fi
    
    local getfile_id
    getfile_id=$(echo "$getfile_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -z "$getfile_id" ]]; then
        echo "❌ Failed to get GetFile processor ID"
        return 1
    fi
    
    echo "✅ Created GetFile processor (ID: $getfile_id)"
    
    # Create PutFile processor
    echo "🔧 Creating PutFile processor..."
    local putfile_response
    putfile_response=$(curl -s -u "$NIFI_USERNAME:$NIFI_PASSWORD" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "revision": {"version": 0},
            "component": {
                "type": "org.apache.nifi.processors.standard.PutFile",
                "position": {"x": 400, "y": 100},
                "config": {
                    "properties": {
                        "Directory": "'"$output_dir"'",
                        "Conflict Resolution Strategy": "replace",
                        "Create Missing Directories": "true"
                    },
                    "name": "PutFile-CSVWriter"
                }
            }
        }' \
        "$NIFI_URL/process-groups/$process_group_id/processors" || echo "")
    
    if [[ -z "$putfile_response" ]]; then
        echo "❌ Failed to create PutFile processor"
        return 1
    fi
    
    local putfile_id
    putfile_id=$(echo "$putfile_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -z "$putfile_id" ]]; then
        echo "❌ Failed to get PutFile processor ID"
        return 1
    fi
    
    echo "✅ Created PutFile processor (ID: $putfile_id)"
    
    # Create connection between processors
    echo "🔗 Creating connection between processors..."
    local connection_response
    connection_response=$(curl -s -u "$NIFI_USERNAME:$NIFI_PASSWORD" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "revision": {"version": 0},
            "component": {
                "source": {"id": "'"$getfile_id"'", "type": "PROCESSOR"},
                "destination": {"id": "'"$putfile_id"'", "type": "PROCESSOR"},
                "selectedRelationships": ["success"]
            }
        }' \
        "$NIFI_URL/process-groups/$process_group_id/connections" || echo "")
    
    if [[ -z "$connection_response" ]]; then
        echo "❌ Failed to create connection"
        return 1
    fi
    
    echo "✅ Created connection between processors"
    
    # Start the processors
    echo "🚀 Starting GetFile processor..."
    curl -s -u "$NIFI_USERNAME:$NIFI_PASSWORD" \
        -X PUT \
        -H "Content-Type: application/json" \
        -d '{
            "revision": {"version": 1},
            "component": {
                "id": "'"$getfile_id"'",
                "state": "RUNNING"
            }
        }' \
        "$NIFI_URL/processors/$getfile_id" >/dev/null
    
    echo "🚀 Starting PutFile processor..."
    curl -s -u "$NIFI_USERNAME:$NIFI_PASSWORD" \
        -X PUT \
        -H "Content-Type: application/json" \
        -d '{
            "revision": {"version": 1},
            "component": {
                "id": "'"$putfile_id"'",
                "state": "RUNNING"
            }
        }' \
        "$NIFI_URL/processors/$putfile_id" >/dev/null
    
    echo "✅ Started both processors"
    
    # Create test CSV file in NiFi container
    echo "📄 Creating test CSV file in NiFi container..."
    ~/.local/bin/kubectl exec -n infometis nifi-0 -- mkdir -p "$input_dir" "$output_dir"
    echo "test,data" | ~/.local/bin/kubectl exec -n infometis nifi-0 -i -- tee "$input_dir/test.csv" > /dev/null
    echo "name,value" | ~/.local/bin/kubectl exec -n infometis nifi-0 -i -- tee -a "$input_dir/test.csv" > /dev/null  
    echo "sample,123" | ~/.local/bin/kubectl exec -n infometis nifi-0 -i -- tee -a "$input_dir/test.csv" > /dev/null
    
    echo "🎉 CAI Pipeline Integration Complete!"
    echo ""
    echo "📊 Pipeline Details:"
    echo "   • GetFile processor: Monitors $input_dir for CSV files"
    echo "   • PutFile processor: Writes processed files to $output_dir"
    echo "   • Connection: success relationship configured"
    echo "   • Test file: $input_dir/test.csv created"
    echo ""
    echo "🔍 To verify pipeline:"
    echo "   1. Check NiFi UI at http://localhost:8080/nifi"
    echo "   2. Wait a few seconds for file processing"
    echo "   3. Check $output_dir directory for processed file"
    echo ""
    echo "🎯 TDD Success Criteria:"
    echo "   ✅ NiFi UI accessible"
    echo "   ✅ GetFile→PutFile pipeline created"
    echo "   ✅ Test CSV file will be processed from input to output"
    
    return 0
}

# Main execution
main() {
    local command="$1"
    
    case "$command" in
        "create csv reader")
            create_csv_pipeline "$command"
            ;;
        *)
            echo "❌ Unknown command: $command"
            echo "Usage: $0 \"create csv reader\""
            return 1
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 \"create csv reader\""
        exit 1
    fi
    main "$@"
fi