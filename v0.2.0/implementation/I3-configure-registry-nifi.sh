#!/bin/bash
set -eu

# InfoMetis v0.2.0 - I3: Configure Registry-NiFi Integration
# Configures NiFi to connect to NiFi Registry for flow version control

echo "🔗 InfoMetis v0.2.0 - I3: Configure Registry-NiFi Integration"
echo "============================================================"
echo "Connecting NiFi to Registry for flow version control"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function: Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check if NiFi is running
    if ! kubectl get pods -n infometis -l app=nifi | grep -q Running; then
        echo "❌ NiFi not running. Deploy foundation first."
        exit 1
    fi
    
    # Check if Registry is running
    if ! kubectl get pods -n infometis -l app=nifi-registry | grep -q Running; then
        echo "❌ NiFi Registry not running. Run I1-deploy-registry.sh first."
        exit 1
    fi
    
    # Verify NiFi API is accessible
    if ! kubectl exec -n infometis statefulset/nifi -- curl -f http://localhost:8080/nifi-api/controller >/dev/null 2>&1; then
        echo "❌ NiFi API not accessible"
        exit 1
    fi
    
    # Verify Registry API is accessible
    if ! kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry/ >/dev/null 2>&1; then
        echo "❌ Registry API not accessible"
        exit 1
    fi
    
    echo "✅ Prerequisites verified"
}

# Function: Get NiFi access token (if needed)
get_nifi_token() {
    echo "🔑 Checking NiFi authentication..."
    
    # Since NiFi is configured for minimal auth, we'll check if we can access directly
    if kubectl exec -n infometis statefulset/nifi -- curl -f http://localhost:8080/nifi-api/access/config >/dev/null 2>&1; then
        echo "✅ NiFi API accessible without token"
        return 0
    else
        echo "⚠️  NiFi API requires authentication"
        return 1
    fi
}

# Function: Create Registry client in NiFi
create_registry_client() {
    echo "🗂️  Configuring Registry client in NiFi..."
    
    # Get the Registry service URL within the cluster
    local registry_url="http://nifi-registry-service.infometis.svc.cluster.local:18080"
    
    # Check if Registry client already exists
    local existing_clients=$(kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients)
    
    if echo "$existing_clients" | grep -q '"name":"InfoMetis Registry"'; then
        echo "✅ Registry client already exists"
        
        # Extract the existing client ID
        local client_id=$(echo "$existing_clients" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "  Client ID: $client_id"
        
        # Store client ID for later use
        echo "$client_id" > /tmp/nifi-registry-client-id
        
        return 0
    fi
    
    echo "  Creating new Registry client..."
    echo "  Registry URL: $registry_url"
    
    # Create the Registry client configuration
    local client_config=$(cat <<EOF
{
  "revision": {
    "version": 0
  },
  "component": {
    "name": "InfoMetis Registry",
    "description": "InfoMetis NiFi Registry for flow version control",
    "type": "org.apache.nifi.registry.flow.NifiRegistryFlowRegistryClient",
    "properties": {
      "url": "$registry_url"
    }
  }
}
EOF
)
    
    # Create the Registry client via NiFi API
    local response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$client_config" \
        http://localhost:8080/nifi-api/controller/registry-clients)
    
    if echo "$response" | grep -q '"name":"InfoMetis Registry"'; then
        echo "✅ Registry client created successfully"
        
        # Extract the client ID for future reference
        local client_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "  Client ID: $client_id"
        
        # Store client ID for later use
        echo "$client_id" > /tmp/nifi-registry-client-id
        
        return 0
    else
        echo "❌ Failed to create Registry client"
        echo "Response: $response"
        return 1
    fi
}

# Function: Test Registry connection
test_registry_connection() {
    echo "🔌 Testing Registry connection..."
    
    if [ -f /tmp/nifi-registry-client-id ]; then
        local client_id=$(cat /tmp/nifi-registry-client-id)
        
        # Test the connection to Registry
        local response=$(kubectl exec -n infometis statefulset/nifi -- curl -s \
            http://localhost:8080/nifi-api/controller/registry-clients/$client_id)
        
        if echo "$response" | grep -q '"name":"InfoMetis Registry"'; then
            echo "✅ Registry client accessible from NiFi"
            
            # Try to list available buckets (should be empty initially)
            local buckets_response=$(kubectl exec -n infometis statefulset/nifi -- curl -s \
                http://localhost:8080/nifi-api/flow/registries/$client_id/buckets)
            
            if echo "$buckets_response" | grep -q '"buckets"'; then
                echo "✅ Can retrieve buckets from Registry"
                return 0
            else
                echo "⚠️  Registry client exists but bucket retrieval failed"
                echo "Response: $buckets_response"
                return 1
            fi
        else
            echo "❌ Registry client not found or accessible"
            return 1
        fi
    else
        echo "❌ No client ID found"
        return 1
    fi
}

# Function: Create default bucket
create_default_bucket() {
    echo "📦 Creating default bucket in Registry..."
    
    # Create bucket directly in Registry
    local bucket_config=$(cat <<EOF
{
  "name": "InfoMetis Flows",
  "description": "Default bucket for InfoMetis flow versions",
  "allowBundleRedeploy": false,
  "allowPublicRead": true
}
EOF
)
    
    local response=$(kubectl exec -n infometis deployment/nifi-registry -- curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$bucket_config" \
        http://localhost:18080/nifi-registry-api/buckets)
    
    if echo "$response" | grep -q '"name":"InfoMetis Flows"'; then
        echo "✅ Default bucket created in Registry"
        
        # Extract bucket ID
        local bucket_id=$(echo "$response" | grep -o '"identifier":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "  Bucket ID: $bucket_id"
        
        return 0
    else
        echo "⚠️  Default bucket creation failed (may already exist)"
        echo "Response: $response"
        return 0  # Continue anyway - bucket might already exist
    fi
}

# Function: Verify integration
verify_integration() {
    echo "🔍 Verifying Registry-NiFi integration..."
    
    # Check if Registry client exists in NiFi
    local clients_response=$(kubectl exec -n infometis statefulset/nifi -- curl -s \
        http://localhost:8080/nifi-api/controller/registry-clients)
    
    if echo "$clients_response" | grep -q '"name":"InfoMetis Registry"'; then
        echo "✅ Registry client configured in NiFi"
    else
        echo "❌ Registry client not found in NiFi"
        return 1
    fi
    
    # Check if Registry is accessible
    if kubectl exec -n infometis deployment/nifi-registry -- curl -f http://localhost:18080/nifi-registry-api/buckets >/dev/null 2>&1; then
        echo "✅ Registry API accessible"
    else
        echo "❌ Registry API not accessible"
        return 1
    fi
    
    # Check network connectivity between NiFi and Registry
    if kubectl exec -n infometis statefulset/nifi -- curl -f http://nifi-registry-service.infometis.svc.cluster.local:18080/nifi-registry/ >/dev/null 2>&1; then
        echo "✅ Network connectivity verified"
    else
        echo "❌ Network connectivity failed"
        return 1
    fi
    
    return 0
}

# Function: Show integration status
show_integration_status() {
    echo ""
    echo "📊 Registry-NiFi Integration Status:"
    echo "===================================="
    
    echo ""
    echo "🔗 NiFi Registry Clients:"
    kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients | grep -o '"name":"[^"]*"' || echo "  No clients found"
    
    echo ""
    echo "📦 Available Buckets:"
    kubectl exec -n infometis deployment/nifi-registry -- curl -s http://localhost:18080/nifi-registry-api/buckets | grep -o '"name":"[^"]*"' || echo "  No buckets found"
    
    echo ""
    echo "🌐 Access Information:"
    echo "  • NiFi UI: http://localhost/nifi"
    echo "  • Registry UI: http://localhost/nifi-registry"
    echo "  • Integration: View Registry clients in NiFi Settings > Registry Clients"
    
    echo ""
    echo "📋 Next Steps for Flow Version Control:"
    echo "  1. In NiFi UI, create a Process Group"
    echo "  2. Right-click Process Group > Version > Start version control"
    echo "  3. Select 'InfoMetis Registry' and 'InfoMetis Flows' bucket"
    echo "  4. Enter flow name and initial version description"
    echo "  5. Save version to Registry"
}

# Main execution
main() {
    check_prerequisites
    get_nifi_token
    create_registry_client
    test_registry_connection
    create_default_bucket
    
    if verify_integration; then
        show_integration_status
        echo ""
        echo "🎉 I3 completed successfully!"
        echo "   Registry-NiFi integration is configured and ready"
        echo ""
        echo "✨ Flow version control is now available:"
        echo "   • Create flows in NiFi"
        echo "   • Version them in Registry"
        echo "   • Track changes and deployments"
    else
        echo ""
        echo "⚠️  I3 completed with warnings"
        echo "   Integration configured but some tests failed"
        show_integration_status
    fi
}

# Run main function
main