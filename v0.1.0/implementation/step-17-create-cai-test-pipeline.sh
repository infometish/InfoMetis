#!/bin/bash
# step-17-create-cai-test-pipeline.sh
# Create a simple CAI test pipeline in NiFi for content-aware processing

set -eu

NAMESPACE="infometis"
NIFI_BASE_URL="http://localhost/nifi-api"

echo "🧠 Step 17: Creating CAI Test Pipeline"
echo "====================================="

echo "📋 Waiting for NiFi API to be ready..."
timeout=300
while [ $timeout -gt 0 ]; do
    if curl -s -f "${NIFI_BASE_URL}/access/config" > /dev/null 2>&1; then
        echo "✅ NiFi API is ready"
        break
    fi
    echo "   Waiting for NiFi API... ($timeout seconds remaining)"
    sleep 5
    timeout=$((timeout - 5))
done

if [ $timeout -eq 0 ]; then
    echo "❌ NiFi API not ready after 5 minutes"
    exit 1
fi

echo "📋 Getting NiFi access token..."
# For single-user mode, we need to get a token
ACCESS_TOKEN=$(curl -s -X POST "${NIFI_BASE_URL}/access/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=adminadminadmin" 2>/dev/null || echo "")

if [ -z "$ACCESS_TOKEN" ]; then
    echo "⚠️  No access token needed (unsecured mode)"
    AUTH_HEADER=""
else
    echo "✅ Access token obtained"
    AUTH_HEADER="Authorization: Bearer $ACCESS_TOKEN"
fi

echo "📋 Getting root process group..."
ROOT_PG=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/flow/process-groups/root" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ROOT_PG" ]; then
    echo "❌ Could not get root process group"
    exit 1
fi

echo "✅ Root process group: $ROOT_PG"

echo "📋 Creating CAI test process group..."
CAI_PG_RESPONSE=$(curl -s -X POST ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${NIFI_BASE_URL}/process-groups/${ROOT_PG}/process-groups" \
    -d '{
        "revision": {"version": 0},
        "component": {
            "name": "CAI-Test-Pipeline",
            "position": {"x": 100, "y": 100}
        }
    }' 2>/dev/null || echo "")

if [ -z "$CAI_PG_RESPONSE" ]; then
    echo "❌ Failed to create CAI process group"
    exit 1
fi

CAI_PG_ID=$(echo "$CAI_PG_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Created CAI process group: $CAI_PG_ID"

echo "📋 Creating GenerateFlowFile processor (data source)..."
GEN_PROCESSOR=$(curl -s -X POST ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${NIFI_BASE_URL}/process-groups/${CAI_PG_ID}/processors" \
    -d '{
        "revision": {"version": 0},
        "component": {
            "type": "org.apache.nifi.processors.standard.GenerateFlowFile",
            "name": "Content Generator",
            "position": {"x": 100, "y": 200},
            "config": {
                "properties": {
                    "File Size": "1 KB",
                    "Batch Size": "1",
                    "Data Format": "Text",
                    "Custom Text": "This is test content for Content-Aware Intelligence processing. Keywords: AI, machine learning, data processing."
                },
                "schedulingPeriod": "30 sec",
                "schedulingStrategy": "TIMER_DRIVEN"
            }
        }
    }' 2>/dev/null || echo "")

GEN_ID=$(echo "$GEN_PROCESSOR" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Created content generator: $GEN_ID"

echo "📋 Creating UpdateAttribute processor (content analysis)..."
UPDATE_PROCESSOR=$(curl -s -X POST ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${NIFI_BASE_URL}/process-groups/${CAI_PG_ID}/processors" \
    -d '{
        "revision": {"version": 0},
        "component": {
            "type": "org.apache.nifi.processors.attributes.UpdateAttribute",
            "name": "Content Analyzer",
            "position": {"x": 400, "y": 200},
            "config": {
                "properties": {
                    "content.analysis": "AI-detected",
                    "processing.timestamp": "${now()}",
                    "content.type": "text-intelligence"
                }
            }
        }
    }' 2>/dev/null || echo "")

UPDATE_ID=$(echo "$UPDATE_PROCESSOR" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Created content analyzer: $UPDATE_ID"

echo "📋 Creating LogAttribute processor (result viewer)..."
LOG_PROCESSOR=$(curl -s -X POST ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${NIFI_BASE_URL}/process-groups/${CAI_PG_ID}/processors" \
    -d '{
        "revision": {"version": 0},
        "component": {
            "type": "org.apache.nifi.processors.standard.LogAttribute",
            "name": "CAI Results",
            "position": {"x": 700, "y": 200},
            "config": {
                "properties": {
                    "Log Level": "INFO",
                    "Log Payload": "true",
                    "Attributes to Log": "content.analysis,processing.timestamp,content.type"
                }
            }
        }
    }' 2>/dev/null || echo "")

LOG_ID=$(echo "$LOG_PROCESSOR" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Created results logger: $LOG_ID"

echo "📋 Creating connections between processors..."

# Connection 1: Generator -> Analyzer
CONNECTION1=$(curl -s -X POST ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${NIFI_BASE_URL}/process-groups/${CAI_PG_ID}/connections" \
    -d "{
        \"revision\": {\"version\": 0},
        \"component\": {
            \"source\": {\"id\": \"$GEN_ID\", \"groupId\": \"$CAI_PG_ID\", \"type\": \"PROCESSOR\"},
            \"destination\": {\"id\": \"$UPDATE_ID\", \"groupId\": \"$CAI_PG_ID\", \"type\": \"PROCESSOR\"},
            \"selectedRelationships\": [\"success\"]
        }
    }" 2>/dev/null || echo "")

# Connection 2: Analyzer -> Logger
CONNECTION2=$(curl -s -X POST ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${NIFI_BASE_URL}/process-groups/${CAI_PG_ID}/connections" \
    -d "{
        \"revision\": {\"version\": 0},
        \"component\": {
            \"source\": {\"id\": \"$UPDATE_ID\", \"groupId\": \"$CAI_PG_ID\", \"type\": \"PROCESSOR\"},
            \"destination\": {\"id\": \"$LOG_ID\", \"groupId\": \"$CAI_PG_ID\", \"type\": \"PROCESSOR\"},
            \"selectedRelationships\": [\"success\"]
        }
    }" 2>/dev/null || echo "")

echo "✅ Created processor connections"

echo "📋 Saving pipeline configuration..."
echo "CAI_PG_ID=$CAI_PG_ID" > /tmp/cai-pipeline-config.env
echo "GEN_ID=$GEN_ID" >> /tmp/cai-pipeline-config.env
echo "UPDATE_ID=$UPDATE_ID" >> /tmp/cai-pipeline-config.env  
echo "LOG_ID=$LOG_ID" >> /tmp/cai-pipeline-config.env
echo "AUTH_HEADER=$AUTH_HEADER" >> /tmp/cai-pipeline-config.env

echo ""
echo "🎉 CAI test pipeline created successfully!"
echo "   Process Group: CAI-Test-Pipeline"
echo "   Components: Content Generator → Content Analyzer → CAI Results"
echo "   Status: Ready for testing"
echo "   Config saved: /tmp/cai-pipeline-config.env"
echo ""
echo "📋 Next: Run step-18 to start the pipeline"
echo "   View in NiFi UI: http://localhost/nifi/"