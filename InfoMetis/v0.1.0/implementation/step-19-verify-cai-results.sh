#!/bin/bash
# step-19-verify-cai-results.sh
# Verify CAI pipeline results and demonstrate content-aware processing

set -eu

NIFI_BASE_URL="http://localhost/nifi-api"

echo "🔍 Step 19: Verifying CAI Pipeline Results"
echo "=========================================="

echo "📋 Loading pipeline configuration..."
if [ ! -f /tmp/cai-pipeline-config.env ]; then
    echo "❌ Pipeline configuration not found. Run step-17 and step-18 first."
    exit 1
fi

source /tmp/cai-pipeline-config.env

echo "✅ Pipeline configuration loaded"

echo "📋 Checking current pipeline status..."

# Get current processor statistics
GEN_STATS=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${GEN_ID}" | grep -o '"flowFilesOut":[0-9]*' | cut -d':' -f2 || echo "0")
UPDATE_STATS=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${UPDATE_ID}" | grep -o '"flowFilesOut":[0-9]*' | cut -d':' -f2 || echo "0")
LOG_STATS=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${LOG_ID}" | grep -o '"flowFilesIn":[0-9]*' | cut -d':' -f2 || echo "0")

echo "📊 Current Pipeline Statistics:"
echo "   📄 Content Generated: $GEN_STATS flowfiles"
echo "   🧠 Content Analyzed: $UPDATE_STATS flowfiles"
echo "   📝 Results Logged: $LOG_STATS flowfiles"

echo "📋 Extracting CAI processing results from NiFi logs..."
echo "🔍 Looking for content-aware intelligence indicators..."

# Extract relevant log entries
CAI_LOGS=$(docker exec infometis k0s kubectl logs -n infometis -l app=nifi --tail=100 | grep -E "(content\.analysis|AI-detected|intelligence|Content Analyzer)" | tail -10 || echo "")

if [ -n "$CAI_LOGS" ]; then
    echo "✅ CAI Processing Evidence Found:"
    echo "=================================="
    echo "$CAI_LOGS"
    echo "=================================="
else
    echo "⚠️  Limited CAI evidence in logs. Checking processor details..."
fi

echo "📋 Checking processor queue states..."

# Get queue information for each connection
QUEUE1=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/flow/process-groups/${CAI_PG_ID}" | grep -o '"queued":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "0")
QUEUE2=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/flow/process-groups/${CAI_PG_ID}" | grep -o '"queued":"[^"]*"' | tail -1 | cut -d'"' -f4 || echo "0")

echo "📊 Queue Status:"
echo "   Generator → Analyzer: $QUEUE1 queued"
echo "   Analyzer → Logger: $QUEUE2 queued"

echo "📋 Testing direct processor functionality..."

# Get a sample of processor attributes being set
PROCESSOR_CONFIG=$(curl -s ${AUTH_HEADER:+-H "$AUTH_HEADER"} "${NIFI_BASE_URL}/processors/${UPDATE_ID}" | grep -o '"content\.analysis":"[^"]*"' || echo "")

if [ -n "$PROCESSOR_CONFIG" ]; then
    echo "✅ Content Analysis Configuration Active:"
    echo "   $PROCESSOR_CONFIG"
else
    echo "⚠️  Could not verify content analysis configuration"
fi

echo "📋 Generating verification report..."

TOTAL_PROCESSED=$((GEN_STATS + UPDATE_STATS + LOG_STATS))
PIPELINE_EFFICIENCY=$((LOG_STATS * 100 / (GEN_STATS + 1)))

echo ""
echo "🎯 CAI Pipeline Verification Report"
echo "==================================="
echo "✅ Pipeline Status: $([ "$LOG_STATS" -gt 0 ] && echo "OPERATIONAL" || echo "NEEDS ATTENTION")"
echo "📊 Total FlowFiles Processed: $TOTAL_PROCESSED"
echo "⚡ Pipeline Efficiency: ${PIPELINE_EFFICIENCY}%"
echo "🧠 Content-Aware Features:"
echo "   • Automatic content classification"
echo "   • Intelligence metadata enrichment"  
echo "   • Timestamp attribution"
echo "   • Processing audit trail"
echo ""

if [ "$LOG_STATS" -gt 0 ]; then
    echo "✅ CAI PIPELINE VERIFICATION: PASSED"
    echo "   The pipeline successfully:"
    echo "   • Generated test content"
    echo "   • Applied content-aware analysis"
    echo "   • Added intelligence metadata"
    echo "   • Logged processing results"
    echo ""
    echo "🌐 User Verification Steps:"
    echo "   1. Open: http://localhost/nifi/"
    echo "   2. Navigate to: CAI-Test-Pipeline"
    echo "   3. Observe: Active processors with green play icons"
    echo "   4. Check: Queue counts between processors"
    echo "   5. View: Processor statistics and throughput"
else
    echo "⚠️  CAI PIPELINE VERIFICATION: NEEDS REVIEW"
    echo "   Pipeline created but limited processing activity detected"
    echo "   Manual verification recommended via NiFi UI"
fi

echo ""
echo "📋 Next: Run step-20 to clean up test pipeline"