#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Configure Registry-NiFi Integration
# Single concern: Connect NiFi Registry to NiFi for flow versioning

echo "🔗 InfoMetis v0.2.0 - Configure Registry-NiFi Integration"
echo "======================================================="
echo "Configuring: NiFi to connect with Registry for flow versioning"
echo ""

# Check if both NiFi and Registry are running
echo "🔍 Checking deployments..."
if ! kubectl get pods -n infometis -l app=nifi | grep -q Running; then
    echo "❌ NiFi not running. Check NiFi deployment"
    exit 1
fi

if ! kubectl get pods -n infometis -l app=nifi-registry | grep -q Running; then
    echo "❌ Registry not running. Run I1-deploy-registry.sh first"
    exit 1
fi

echo "✅ Both NiFi and Registry are running"

# Get Registry service URL
REGISTRY_URL="http://registry-service.infometis.svc.cluster.local:18080"
echo ""
echo "🔧 Registry URL: $REGISTRY_URL"

# Configure NiFi Registry client
echo ""
echo "⚙️  Configuring NiFi Registry client..."

# Create Registry client in NiFi
REGISTRY_CLIENT_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"revision\": {\"version\": 0},
        \"component\": {
            \"name\": \"InfoMetis Registry\",
            \"uri\": \"$REGISTRY_URL\",
            \"description\": \"InfoMetis NiFi Registry for flow versioning\"
        }
    }" \
    http://localhost:8080/nifi-api/controller/registry-clients)

if echo "$REGISTRY_CLIENT_RESPONSE" | grep -q "\"name\":\"InfoMetis Registry\""; then
    echo "✅ Registry client configured in NiFi"
    REGISTRY_CLIENT_ID=$(echo "$REGISTRY_CLIENT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Client ID: $REGISTRY_CLIENT_ID"
else
    echo "❌ Failed to configure Registry client"
    echo "Response: $REGISTRY_CLIENT_RESPONSE"
    exit 1
fi

# Verify Registry connectivity from NiFi
echo ""
echo "🔍 Verifying Registry connectivity from NiFi..."

CONNECTIVITY_TEST=$(kubectl exec -n infometis deployment/nifi -- curl -s -f "$REGISTRY_URL/nifi-registry-api/buckets" || echo "FAILED")

if [[ "$CONNECTIVITY_TEST" != "FAILED" ]]; then
    echo "✅ NiFi can reach Registry API"
    BUCKET_COUNT=$(echo "$CONNECTIVITY_TEST" | grep -o '"name"' | wc -l)
    echo "   Available buckets: $BUCKET_COUNT"
else
    echo "❌ NiFi cannot reach Registry API"
    exit 1
fi

# Create or verify InfoMetis bucket exists
echo ""
echo "🪣 Ensuring InfoMetis bucket exists in Registry..."

BUCKET_RESPONSE=$(kubectl exec -n infometis deployment/nifi-registry -- curl -s http://localhost:18080/nifi-registry-api/buckets)

if echo "$BUCKET_RESPONSE" | grep -q "InfoMetis"; then
    echo "✅ InfoMetis bucket already exists"
    BUCKET_ID=$(echo "$BUCKET_RESPONSE" | grep -A5 -B5 "InfoMetis" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)
    echo "   Bucket ID: $BUCKET_ID"
else
    echo "📝 Creating InfoMetis bucket..."
    BUCKET_CREATE_RESPONSE=$(kubectl exec -n infometis deployment/nifi-registry -- curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"name":"InfoMetis","description":"InfoMetis flows for v0.2.0 testing and development"}' \
        http://localhost:18080/nifi-registry-api/buckets)
    
    if echo "$BUCKET_CREATE_RESPONSE" | grep -q "InfoMetis"; then
        echo "✅ InfoMetis bucket created"
        BUCKET_ID=$(echo "$BUCKET_CREATE_RESPONSE" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)
        echo "   Bucket ID: $BUCKET_ID"
    else
        echo "❌ Failed to create InfoMetis bucket"
        exit 1
    fi
fi

# Test Registry client from NiFi UI
echo ""
echo "🧪 Testing Registry client from NiFi..."

REGISTRY_CLIENTS_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients)

if echo "$REGISTRY_CLIENTS_RESPONSE" | grep -q "InfoMetis Registry"; then
    echo "✅ Registry client visible in NiFi"
    
    # Test Registry client connectivity
    REGISTRY_TEST_RESPONSE=$(kubectl exec -n infometis deployment/nifi -- curl -s \
        "http://localhost:8080/nifi-api/controller/registry-clients/$REGISTRY_CLIENT_ID/buckets")
    
    if echo "$REGISTRY_TEST_RESPONSE" | grep -q "InfoMetis"; then
        echo "✅ Registry client can list buckets from NiFi"
    else
        echo "⚠️  Registry client configured but bucket listing may not be working yet"
    fi
else
    echo "❌ Registry client not visible in NiFi"
    exit 1
fi

echo ""
echo "🎉 Registry-NiFi Integration Complete!"
echo "===================================="
echo ""
echo "📊 Integration Summary:"
echo "  • Registry Client Name: InfoMetis Registry"
echo "  • Registry Client ID: $REGISTRY_CLIENT_ID"
echo "  • Registry URL: $REGISTRY_URL"
echo "  • Default Bucket: InfoMetis"
echo "  • Bucket ID: $BUCKET_ID"
echo ""
echo "🔗 Access Information:"
echo "  • NiFi UI: http://localhost/nifi"
echo "  • Registry UI: http://localhost/nifi-registry"
echo "  • To version control a flow: Right-click process group → Version → Start version control"
echo ""
echo "📋 Next Steps:"
echo "  ./I4-verify-registry-setup.sh       # Verify complete Registry setup"
echo "  ./P1-create-test-pipeline.sh        # Create test pipeline for versioning"