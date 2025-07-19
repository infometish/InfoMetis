#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Create Test Pipeline
# Single concern: Create a test pipeline in NiFi for Registry versioning

echo "🌊 InfoMetis v0.2.0 - Create Test Pipeline"
echo "========================================="
echo "Creating: Test pipeline for Registry versioning demonstration"
echo ""

# Check if NiFi is running
echo "🔍 Checking NiFi deployment..."
if ! kubectl get pods -n infometis -l app=nifi | grep -q Running; then
    echo "❌ NiFi not running. Check NiFi deployment"
    exit 1
fi

echo "✅ NiFi is running"

# Get root process group ID
echo ""
echo "🔍 Getting NiFi process group information..."

ROOT_PG_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s http://localhost:8080/nifi-api/flow/process-groups/root)
ROOT_PG_ID=$(echo "$ROOT_PG_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -z "$ROOT_PG_ID" ]]; then
    echo "❌ Could not get root process group ID"
    exit 1
fi

echo "✅ Root process group ID: $ROOT_PG_ID"

# Create InfoMetis test process group
echo ""
echo "📁 Creating InfoMetis test process group..."

TEST_PG_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"revision\": {\"version\": 0},
        \"component\": {
            \"name\": \"InfoMetis-Test-Pipeline\",
            \"position\": {\"x\": 100, \"y\": 100}
        }
    }" \
    "http://localhost:8080/nifi-api/process-groups/$ROOT_PG_ID/process-groups")

if echo "$TEST_PG_RESPONSE" | grep -q "InfoMetis-Test-Pipeline"; then
    TEST_PG_ID=$(echo "$TEST_PG_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "✅ Test process group created with ID: $TEST_PG_ID"
else
    echo "❌ Failed to create test process group"
    echo "Response: $TEST_PG_RESPONSE"
    exit 1
fi

# Create processors in the test pipeline
echo ""
echo "⚙️  Adding processors to test pipeline..."

# 1. GenerateFlowFile processor
echo "  Adding GenerateFlowFile processor..."
GFF_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"revision\": {\"version\": 0},
        \"component\": {
            \"type\": \"org.apache.nifi.processors.standard.GenerateFlowFile\",
            \"position\": {\"x\": 50, \"y\": 50},
            \"config\": {
                \"properties\": {
                    \"File Size\": \"1KB\",
                    \"Batch Size\": \"1\",
                    \"Data Format\": \"Text\",
                    \"Custom Text\": \"InfoMetis v0.2.0 Test Data - Generated at $(date)\"
                },
                \"schedulingPeriod\": \"30 sec\",
                \"schedulingStrategy\": \"TIMER_DRIVEN\"
            }
        }
    }" \
    "http://localhost:8080/nifi-api/process-groups/$TEST_PG_ID/processors")

GFF_ID=$(echo "$GFF_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

# 2. UpdateAttribute processor
echo "  Adding UpdateAttribute processor..."
UA_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"revision\": {\"version\": 0},
        \"component\": {
            \"type\": \"org.apache.nifi.processors.attributes.UpdateAttribute\",
            \"position\": {\"x\": 250, \"y\": 50},
            \"config\": {
                \"properties\": {
                    \"infometis.version\": \"v0.2.0\",
                    \"infometis.pipeline\": \"test-pipeline\",
                    \"infometis.timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }
            }
        }
    }" \
    "http://localhost:8080/nifi-api/process-groups/$TEST_PG_ID/processors")

UA_ID=$(echo "$UA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

# 3. LogAttribute processor
echo "  Adding LogAttribute processor..."
LA_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"revision\": {\"version\": 0},
        \"component\": {
            \"type\": \"org.apache.nifi.processors.standard.LogAttribute\",
            \"position\": {\"x\": 450, \"y\": 50},
            \"config\": {
                \"properties\": {
                    \"Log Level\": \"info\",
                    \"Log Payload\": \"true\",
                    \"Attributes to Log\": \"infometis.*\"
                }
            }
        }
    }" \
    "http://localhost:8080/nifi-api/process-groups/$TEST_PG_ID/processors")

LA_ID=$(echo "$LA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

# Create connections between processors
echo ""
echo "🔗 Creating connections between processors..."

if [[ -n "$GFF_ID" && -n "$UA_ID" ]]; then
    echo "  Connecting GenerateFlowFile → UpdateAttribute..."
    kubectl exec -n infometis deployment/nifi -- curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"revision\": {\"version\": 0},
            \"component\": {
                \"source\": {\"id\": \"$GFF_ID\", \"groupId\": \"$TEST_PG_ID\", \"type\": \"PROCESSOR\"},
                \"destination\": {\"id\": \"$UA_ID\", \"groupId\": \"$TEST_PG_ID\", \"type\": \"PROCESSOR\"},
                \"selectedRelationships\": [\"success\"]
            }
        }" \
        "http://localhost:8080/nifi-api/process-groups/$TEST_PG_ID/connections" >/dev/null
fi

if [[ -n "$UA_ID" && -n "$LA_ID" ]]; then
    echo "  Connecting UpdateAttribute → LogAttribute..."
    kubectl exec -n infometis deployment/nifi -- curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"revision\": {\"version\": 0},
            \"component\": {
                \"source\": {\"id\": \"$UA_ID\", \"groupId\": \"$TEST_PG_ID\", \"type\": \"PROCESSOR\"},
                \"destination\": {\"id\": \"LA_ID\", \"groupId\": \"$TEST_PG_ID\", \"type\": \"PROCESSOR\"},
                \"selectedRelationships\": [\"success\"]
            }
        }" \
        "http://localhost:8080/nifi-api/process-groups/$TEST_PG_ID/connections" >/dev/null
fi

# Auto-terminate relationships on LogAttribute
if [[ -n "$LA_ID" ]]; then
    echo "  Configuring LogAttribute auto-termination..."
    LA_VERSION_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s "http://localhost:8080/nifi-api/processors/$LA_ID")
    LA_VERSION=$(echo "$LA_VERSION_RESPONSE" | grep -o '"version":[0-9]*' | cut -d':' -f2)
    
    kubectl exec -n infometis deployment/nifi -- curl -s -X PUT \
        -H "Content-Type: application/json" \
        -d "{
            \"revision\": {\"version\": $LA_VERSION},
            \"component\": {
                \"id\": \"$LA_ID\",
                \"config\": {
                    \"autoTerminatedRelationships\": [\"success\"]
                }
            }
        }" \
        "http://localhost:8080/nifi-api/processors/$LA_ID" >/dev/null
fi

echo "✅ Test pipeline created successfully"

# Verify pipeline creation
echo ""
echo "🔍 Verifying pipeline creation..."

PIPELINE_VERIFICATION=$(kubectl exec -n infometis deployment/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/$TEST_PG_ID")

if echo "$PIPELINE_VERIFICATION" | grep -q "GenerateFlowFile\|UpdateAttribute\|LogAttribute"; then
    echo "✅ Pipeline processors verified"
    
    PROCESSOR_COUNT=$(echo "$PIPELINE_VERIFICATION" | grep -o '"type":"PROCESSOR"' | wc -l)
    CONNECTION_COUNT=$(echo "$PIPELINE_VERIFICATION" | grep -o '"type":"CONNECTION"' | wc -l)
    
    echo "   Processors: $PROCESSOR_COUNT"
    echo "   Connections: $CONNECTION_COUNT"
else
    echo "⚠️  Pipeline verification incomplete"
fi

echo ""
echo "🎉 Test Pipeline Creation Complete!"
echo "================================="
echo ""
echo "📊 Pipeline Summary:"
echo "  • Name: InfoMetis-Test-Pipeline"
echo "  • Process Group ID: $TEST_PG_ID"
echo "  • Processors: GenerateFlowFile → UpdateAttribute → LogAttribute"
echo "  • Purpose: Demonstrates flow versioning with Registry"
echo ""
echo "🔗 Access Information:"
echo "  • NiFi UI: http://localhost/nifi"
echo "  • Navigate to 'InfoMetis-Test-Pipeline' process group"
echo "  • Pipeline is ready for version control"
echo ""
echo "📋 Next Steps:"
echo "  ./P2-add-pipeline-to-registry.sh    # Add pipeline to Registry"
echo "  ./V1-create-pipeline-versions.sh    # Create multiple versions"
echo ""
echo "💡 Manual Version Control:"
echo "  1. Right-click on 'InfoMetis-Test-Pipeline' process group"
echo "  2. Select 'Version' → 'Start version control'"
echo "  3. Choose 'InfoMetis Registry' and 'InfoMetis' bucket"
echo "  4. Enter flow name and description"