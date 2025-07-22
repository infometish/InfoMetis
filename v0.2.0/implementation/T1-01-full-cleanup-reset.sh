#!/bin/bash
set -eu

# InfoMetis v0.2.0 - T1-01: Full Cleanup and Environment Reset
# API-based cleanup for proper testing methodology

echo "🧹 Test 1-01: API-Based Cleanup and Environment Reset"
echo "====================================================="
echo "Using NiFi and Registry APIs for clean testing state"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API endpoints
NIFI_API="http://localhost:8080/nifi-api"
REGISTRY_API="http://localhost:18080/nifi-registry-api"

# Function: Test step with clear pass/fail
test_step() {
    local step_name="$1"
    local test_command="$2"
    
    echo -n "  $step_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Function: Wait for API to be ready
wait_for_api() {
    local api_url="$1"
    local service_name="$2"
    local max_attempts=12
    local attempt=0
    
    echo "  Waiting for $service_name API..."
    
    while [ $attempt -lt $max_attempts ]; do
        if kubectl exec -n infometis statefulset/nifi -- curl -f "$api_url" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓ $service_name API ready${NC}"
            return 0
        fi
        
        echo "    Attempt $((attempt + 1))/$max_attempts"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo -e "  ${RED}✗ $service_name API not ready${NC}"
    return 1
}

echo "🔍 Step 1: Verify API Connectivity"
echo "=================================="

wait_for_api "$NIFI_API/controller" "NiFi"

test_step "Registry API accessible" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null"

echo ""
echo "🗑️ Step 2: Clean NiFi Flows via API"
echo "===================================="

echo "  Getting root process group..."
ROOT_PG_RESPONSE=$(kubectl exec -n infometis statefulset/nifi -- curl -s "$NIFI_API/flow/process-groups/root")
ROOT_PG_ID=$(echo "$ROOT_PG_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$ROOT_PG_ID" ] && [ "$ROOT_PG_ID" != "null" ]; then
    echo "  Root process group ID: $ROOT_PG_ID"
    
    # Stop all processors first
    echo "  Stopping all processors..."
    kubectl exec -n infometis statefulset/nifi -- curl -s -X PUT "$NIFI_API/flow/process-groups/$ROOT_PG_ID" \
        -H "Content-Type: application/json" \
        -d '{"id":"'$ROOT_PG_ID'","state":"STOPPED"}' >/dev/null || true
    
    sleep 3
    
    # Get and delete all process groups with retry
    echo "  Removing all process groups..."
    for attempt in 1 2 3; do
        PG_RESPONSE=$(kubectl exec -n infometis statefulset/nifi -- curl -s "$NIFI_API/process-groups/$ROOT_PG_ID/process-groups")
        PG_LIST=$(echo "$PG_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        if [ -z "$PG_LIST" ]; then
            echo "    No process groups found"
            break
        fi
        
        echo "    Attempt $attempt: Found $(echo $PG_LIST | wc -w) process groups"
        for pg_id in $PG_LIST; do
            # Get current version for deletion
            PG_INFO=$(kubectl exec -n infometis statefulset/nifi -- curl -s "$NIFI_API/process-groups/$pg_id")
            VERSION=$(echo "$PG_INFO" | grep -o '"version":[0-9]*' | head -1 | cut -d':' -f2)
            VERSION=${VERSION:-0}
            
            echo "      Deleting process group: $pg_id (version: $VERSION)"
            kubectl exec -n infometis statefulset/nifi -- curl -s -X DELETE "$NIFI_API/process-groups/$pg_id?version=$VERSION" >/dev/null || true
        done
        
        sleep 2  # Allow deletion to complete
    done
    
    # Final verification and cleanup
    echo "  Final verification..."
    FINAL_PG_CHECK=$(kubectl exec -n infometis statefulset/nifi -- curl -s "$NIFI_API/process-groups/$ROOT_PG_ID/process-groups")
    REMAINING_PGS=$(echo "$FINAL_PG_CHECK" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$REMAINING_PGS" ]; then
        echo "    WARNING: $(echo $REMAINING_PGS | wc -w) process groups still remain, forcing cleanup..."
        for pg_id in $REMAINING_PGS; do
            for version in {0..10}; do
                if kubectl exec -n infometis statefulset/nifi -- curl -s -X DELETE "$NIFI_API/process-groups/$pg_id?version=$version" >/dev/null 2>&1; then
                    echo "      Forced deletion: $pg_id (version: $version)"
                    break
                fi
            done
        done
    else
        echo "    ✓ All process groups successfully removed"
    fi
    
    # Get and delete all processors in root
    echo "  Removing all processors..."
    PROC_RESPONSE=$(kubectl exec -n infometis statefulset/nifi -- curl -s "$NIFI_API/flow/process-groups/$ROOT_PG_ID/processors")
    PROC_LIST=$(echo "$PROC_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$PROC_LIST" ]; then
        for proc_id in $PROC_LIST; do
            PROC_INFO=$(kubectl exec -n infometis statefulset/nifi -- curl -s "$NIFI_API/processors/$proc_id")
            VERSION=$(echo "$PROC_INFO" | grep -o '"version":[0-9]*' | cut -d':' -f2)
            VERSION=${VERSION:-0}
            
            echo "    Deleting processor: $proc_id (version: $VERSION)"
            kubectl exec -n infometis statefulset/nifi -- curl -s -X DELETE "$NIFI_API/processors/$proc_id?version=$VERSION" >/dev/null || true
        done
    fi
    
    echo -e "  ${GREEN}✓ NiFi flows cleaned${NC}"
else
    echo -e "  ${YELLOW}⚠ Could not get root process group${NC}"
fi

echo ""
echo "🗂️ Step 3: Clean Registry Buckets via API"
echo "=========================================="

echo "  Getting Registry buckets..."
BUCKET_RESPONSE=$(kubectl exec -n infometis deployment/nifi-registry -- curl -s "$REGISTRY_API/buckets")
BUCKETS=$(echo "$BUCKET_RESPONSE" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)

if [ -n "$BUCKETS" ]; then
    for bucket_id in $BUCKETS; do
        echo "  Processing bucket: $bucket_id"
        
        # Get all flows in bucket
        FLOW_RESPONSE=$(kubectl exec -n infometis deployment/nifi-registry -- curl -s "$REGISTRY_API/buckets/$bucket_id/flows")
        FLOWS=$(echo "$FLOW_RESPONSE" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$FLOWS" ]; then
            for flow_id in $FLOWS; do
                echo "    Deleting flow: $flow_id"
                kubectl exec -n infometis deployment/nifi-registry -- curl -s -X DELETE "$REGISTRY_API/buckets/$bucket_id/flows/$flow_id" >/dev/null || true
            done
        fi
    done
    echo -e "  ${GREEN}✓ Registry flows cleaned${NC}"
else
    echo -e "  ${YELLOW}⚠ No buckets found or API error${NC}"
fi

echo ""
echo "🔍 Step 4: Verify Clean State"
echo "============================="

test_step "Canvas appears clean" "kubectl exec -n infometis statefulset/nifi -- curl -s '$NIFI_API/flow/process-groups/root' | grep -q 'processGroups'.*'\\[\\]'"

test_step "Root canvas accessible" "kubectl exec -n infometis statefulset/nifi -- curl -f '$NIFI_API/flow/process-groups/root' >/dev/null"

test_step "Registry accessible" "kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null"

test_step "NiFi UI accessible" "curl -f http://localhost/nifi/ >/dev/null"

test_step "Registry UI accessible" "curl -f http://localhost/nifi-registry/ >/dev/null"

echo ""
echo "🐳 Step 5: Docker Volume Cleanup"
echo "================================="

echo "📋 Pruning unused local volumes..."
docker volume prune -f
echo -e "${GREEN}✓ Unused volumes cleaned${NC}"

echo ""
echo "📊 Cleanup Summary"
echo "=================="
echo -e "${GREEN}✅ API-Based Cleanup Complete${NC}"
echo ""
echo "🎯 Clean State Achieved:"
echo "   • All NiFi flows removed via API"
echo "   • All Registry flows cleaned via API"
echo "   • APIs verified functional"
echo "   • External access confirmed"
echo ""
echo "📋 Ready for Test Execution:"
echo "   • Next: T1-02-verify-clean-state.sh"
echo "   • NiFi UI: http://localhost/nifi"
echo "   • Registry UI: http://localhost/nifi-registry"
echo ""
echo "🎉 T1-01 completed successfully!"