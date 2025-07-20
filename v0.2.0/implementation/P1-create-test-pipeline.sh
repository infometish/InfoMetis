#!/bin/bash
set -eu

# InfoMetis v0.2.0 - P1: Create Test Pipeline
# Creates test pipelines for Registry validation

echo "🧪 InfoMetis v0.2.0 - P1: Create Test Pipeline"
echo "=============================================="
echo "Creating test pipelines for Registry validation"
echo ""

PIPELINE_TYPE="${1:-simple}"

# Function: Get process group template for simple pipeline
create_simple_pipeline() {
    local pipeline_name="Test-Simple-Pipeline"
    
    echo "📝 Creating Simple Pipeline: $pipeline_name"
    echo "   Components: GenerateFlowFile → LogAttribute"
    
    # Create process group with simple flow
    local process_group_json=$(cat <<'EOF'
{
  "revision": {
    "version": 0
  },
  "component": {
    "name": "Test-Simple-Pipeline",
    "position": {
      "x": 100,
      "y": 100
    }
  }
}
EOF
)
    
    echo "🔄 Creating process group via NiFi API..."
    local response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$process_group_json" \
        "http://localhost:8080/nifi-api/process-groups/root/process-groups")
    
    local group_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$group_id" ]; then
        echo "✅ Process group created with ID: $group_id"
        
        # Add GenerateFlowFile processor
        echo "📝 Adding GenerateFlowFile processor..."
        local generate_processor=$(cat <<EOF
{
  "revision": {
    "version": 0
  },
  "component": {
    "type": "org.apache.nifi.processors.standard.GenerateFlowFile",
    "position": {
      "x": 200,
      "y": 200
    },
    "config": {
      "properties": {
        "File Size": "1KB",
        "Batch Size": "1",
        "Data Format": "Text",
        "Custom Text": "InfoMetis Test Pipeline Data - Simple Flow"
      },
      "schedulingPeriod": "30 sec",
      "schedulingStrategy": "TIMER_DRIVEN"
    }
  }
}
EOF
)
        
        local gen_response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$generate_processor" \
            "http://localhost:8080/nifi-api/process-groups/$group_id/processors")
        
        local gen_id=$(echo "$gen_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        # Add LogAttribute processor
        echo "📝 Adding LogAttribute processor..."
        local log_processor=$(cat <<EOF
{
  "revision": {
    "version": 0
  },
  "component": {
    "type": "org.apache.nifi.processors.standard.LogAttribute",
    "position": {
      "x": 500,
      "y": 200
    },
    "config": {
      "properties": {
        "Log Level": "INFO",
        "Log Payload": "true",
        "Attributes to Log": "filename,uuid,flow.id"
      }
    }
  }
}
EOF
)
        
        local log_response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$log_processor" \
            "http://localhost:8080/nifi-api/process-groups/$group_id/processors")
        
        local log_id=$(echo "$log_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        # Create connection between processors
        if [ -n "$gen_id" ] && [ -n "$log_id" ]; then
            echo "🔗 Creating connection between processors..."
            local connection_json=$(cat <<EOF
{
  "revision": {
    "version": 0
  },
  "component": {
    "source": {
      "id": "$gen_id",
      "groupId": "$group_id",
      "type": "PROCESSOR"
    },
    "destination": {
      "id": "$log_id",
      "groupId": "$group_id", 
      "type": "PROCESSOR"
    },
    "selectedRelationships": ["success"]
  }
}
EOF
)
            
            kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
                -H "Content-Type: application/json" \
                -d "$connection_json" \
                "http://localhost:8080/nifi-api/process-groups/$group_id/connections" >/dev/null
            
            echo "✅ Simple pipeline created successfully!"
            echo "   Group ID: $group_id"
            echo "   Access: http://localhost/nifi"
            echo ""
            echo "📋 Next Steps:"
            echo "   1. Go to NiFi UI: http://localhost/nifi"
            echo "   2. Find 'Test-Simple-Pipeline' process group"
            echo "   3. Right-click → Version → Start version control"
            echo "   4. Select 'InfoMetis Registry' and 'InfoMetis Flows'"
            echo "   5. Save as version 1.0"
            
            # Store group ID for later versioning
            echo "$group_id" > /tmp/simple-pipeline-id
        else
            echo "❌ Failed to create processors"
            return 1
        fi
    else
        echo "❌ Failed to create process group"
        return 1
    fi
}

# Function: Create medium complexity pipeline  
create_medium_pipeline() {
    echo "📝 Creating Medium Pipeline: Test-Medium-Pipeline"
    echo "   Components: HTTP → JSON Processing → UpdateAttribute → LogAttribute"
    echo "⚠️  Medium pipeline creation - placeholder for future implementation"
    echo "   Use simple pipeline for now and extend manually in NiFi UI"
}

# Function: Create complex pipeline
create_complex_pipeline() {
    echo "📝 Creating Complex Pipeline: Test-Complex-Pipeline" 
    echo "   Components: Multi-source ingestion with branching logic"
    echo "⚠️  Complex pipeline creation - placeholder for future implementation"
    echo "   Use simple pipeline for now and extend manually in NiFi UI"
}

# Main execution
case "$PIPELINE_TYPE" in
    "simple")
        create_simple_pipeline
        ;;
    "medium")
        create_medium_pipeline
        ;;
    "complex")
        create_complex_pipeline
        ;;
    *)
        echo "Usage: $0 [simple|medium|complex]"
        echo "Default: simple"
        create_simple_pipeline
        ;;
esac

echo ""
echo "🎉 Pipeline creation completed!"
echo "Ready for Registry version control testing"