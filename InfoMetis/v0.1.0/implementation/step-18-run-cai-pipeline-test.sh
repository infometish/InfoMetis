#!/bin/bash
# step-18-run-cai-pipeline-test.sh
# Start and run the CAI test pipeline

set -eu

NIFI_BASE_URL="http://localhost/nifi-api"

echo "▶️  Step 18: Running CAI Pipeline Test"
echo "===================================="

echo "📋 Loading pipeline configuration..."
if [ ! -f /tmp/cai-pipeline-config.env ]; then
    echo "❌ Pipeline configuration not found. Run step-17 first."
    exit 1
fi

source /tmp/cai-pipeline-config.env

echo "✅ Pipeline configuration loaded"
echo "   Process Group ID: $CAI_PG_ID"

echo "📋 Starting all processors in CAI pipeline..."

# Start Content Generator
echo "   Starting Content Generator..."
curl -s -X PUT ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${NIFI_BASE_URL}/processors/${GEN_ID}/run-status" \
    -d '{
        "revision": {"version": 0},
        "state": "RUNNING"
    }' > /dev/null

# Start Content Analyzer  
echo "   Starting Content Analyzer..."
curl -s -X PUT ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${NIFI_BASE_URL}/processors/${UPDATE_ID}/run-status" \
    -d '{
        "revision": {"version": 0},
        "state": "RUNNING"
    }' > /dev/null

# Start CAI Results Logger
echo "   Starting CAI Results Logger..."
curl -s -X PUT ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    "${NIFI_BASE_URL}/processors/${LOG_ID}/run-status" \
    -d '{
        "revision": {"version": 0},
        "state": "RUNNING"
    }' > /dev/null

echo "✅ All processors started"

echo "📋 Waiting for pipeline to process data..."
sleep 45

echo "📋 Checking processor statistics..."

# Get processor stats
GEN_STATS=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${GEN_ID}" | grep -o '"flowFilesOut":[0-9]*' | cut -d':' -f2 || echo "0")
UPDATE_STATS=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${UPDATE_ID}" | grep -o '"flowFilesOut":[0-9]*' | cut -d':' -f2 || echo "0")
LOG_STATS=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${LOG_ID}" | grep -o '"flowFilesIn":[0-9]*' | cut -d':' -f2 || echo "0")

echo "📊 Pipeline Statistics:"
echo "   Content Generated: $GEN_STATS flowfiles"
echo "   Content Analyzed: $UPDATE_STATS flowfiles" 
echo "   Results Logged: $LOG_STATS flowfiles"

if [ "$LOG_STATS" -gt 0 ]; then
    echo "✅ CAI pipeline is processing data successfully!"
    
    echo "📋 Checking NiFi logs for CAI processing results..."
    docker exec infometis k0s kubectl logs -n infometis -l app=nifi --tail=20 | grep -i "content.analysis\|AI-detected\|intelligence" | tail -5 || true
    
else
    echo "⚠️  Pipeline may need more time or troubleshooting"
    echo "📋 Processor status check..."
    curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${GEN_ID}" | grep -o '"runStatus":"[^"]*"' | cut -d'"' -f4
    curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${UPDATE_ID}" | grep -o '"runStatus":"[^"]*"' | cut -d'"' -f4  
    curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${LOG_ID}" | grep -o '"runStatus":"[^"]*"' | cut -d'"' -f4
fi

echo ""
echo "🎉 CAI pipeline test execution complete!"
echo "   View live pipeline: http://localhost/nifi/"
echo "   Navigate to: CAI-Test-Pipeline process group"
echo "   Monitor: Processor queue counts and statistics"
echo ""
echo "📋 Next: Run step-19 to verify detailed results"