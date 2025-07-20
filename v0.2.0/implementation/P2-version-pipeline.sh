#!/bin/bash
set -eu

# InfoMetis v0.2.0 - P2: Version Pipeline in Registry
# Automates pipeline versioning workflow

echo "InfoMetis v0.2.0 - P2: Version Pipeline in Registry"
echo "==================================================="
echo "Automating pipeline versioning workflow"
echo ""

FLOW_NAME="${1:-Test-Simple-Pipeline}"
VERSION="${2:-1.0}"
DESCRIPTION="${3:-Initial version of test pipeline}"

echo "Pipeline Versioning Parameters:"
echo "   Flow Name: $FLOW_NAME"
echo "   Version: $VERSION"
echo "   Description: $DESCRIPTION"
echo ""

# Function: Get Registry client ID
get_registry_client_id() {
    echo "Finding Registry client..."
    
    local clients=$(kubectl exec -n infometis statefulset/nifi -- curl -s http://localhost:8080/nifi-api/controller/registry-clients)
    local client_id=$(echo "$clients" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$client_id" ]; then
        echo "Registry client found: $client_id"
        echo "$client_id"
    else
        echo "Registry client not found"
        return 1
    fi
}

# Function: Get bucket ID
get_bucket_id() {
    local client_id="$1"
    
    echo "Finding InfoMetis Flows bucket..."
    
    local buckets=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$client_id/buckets")
    local bucket_id=$(echo "$buckets" | grep -A 5 '"name":"InfoMetis Flows"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$bucket_id" ]; then
        echo "InfoMetis Flows bucket found: $bucket_id"
        echo "$bucket_id"
    else
        echo "InfoMetis Flows bucket not found"
        return 1
    fi
}

# Function: Find process group by name
find_process_group() {
    local flow_name="$1"
    
    echo "Finding process group: $flow_name"
    
    local groups=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/process-groups/root")
    local group_id=$(echo "$groups" | grep -B 5 -A 5 "\"name\":\"$flow_name\"" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$group_id" ]; then
        echo "Process group found: $group_id"
        echo "$group_id"
    else
        echo "Process group '$flow_name' not found"
        echo "   Available groups:"
        echo "$groups" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | sed 's/^/     /'
        return 1
    fi
}

# Function: Start version control for process group
start_version_control() {
    local group_id="$1"
    local client_id="$2"
    local bucket_id="$3"
    local flow_name="$4"
    local version="$5"
    local description="$6"
    
    echo "Starting version control for process group..."
    
    # Check if already under version control
    local group_info=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/process-groups/$group_id")
    
    if echo "$group_info" | grep -q '"versionControlInformation"'; then
        echo "Process group is already under version control"
        echo "   Checking current version..."
        
        local current_version=$(echo "$group_info" | grep -o '"version":[0-9]*' | cut -d':' -f2)
        echo "   Current version: $current_version"
        
        # Create new version
        echo "Creating new version..."
        create_new_version "$group_id" "$version" "$description"
    else
        echo "Initiating version control..."
        
        # Start version control
        local version_request=$(cat <<EOF
{
  "processGroupRevision": {
    "version": 0
  },
  "versionControlInformation": {
    "registryId": "$client_id",
    "bucketId": "$bucket_id",
    "flowName": "$flow_name",
    "flowDescription": "$description",
    "comments": "Initial version control setup - $description"
  }
}
EOF
)
        
        local response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X PUT \
            -H "Content-Type: application/json" \
            -d "$version_request" \
            "http://localhost:8080/nifi-api/process-groups/$group_id/version-control")
        
        if echo "$response" | grep -q '"versionControlInformation"'; then
            echo "Version control started successfully!"
            
            local flow_id=$(echo "$response" | grep -o '"flowId":"[^"]*"' | cut -d'"' -f4)
            echo "   Flow ID in Registry: $flow_id"
            echo "   Version: $version"
        else
            echo "Failed to start version control"
            echo "Response: $response"
            return 1
        fi
    fi
}

# Function: Create new version of existing flow
create_new_version() {
    local group_id="$1"
    local version="$2"
    local description="$3"
    
    echo "Creating new version..."
    
    local commit_request=$(cat <<EOF
{
  "processGroupRevision": {
    "version": 0
  },
  "versionControlInformation": {
    "comments": "Version $version - $description"
  }
}
EOF
)
    
    local response=$(kubectl exec -n infometis statefulset/nifi -- curl -s -X PUT \
        -H "Content-Type: application/json" \
        -d "$commit_request" \
        "http://localhost:8080/nifi-api/process-groups/$group_id/version-control")
    
    if echo "$response" | grep -q '"versionControlInformation"'; then
        echo "New version created successfully!"
        local new_version=$(echo "$response" | grep -o '"version":[0-9]*' | cut -d':' -f2)
        echo "   New version: $new_version"
    else
        echo "Failed to create new version"
        echo "Response: $response"
        return 1
    fi
}

# Function: Verify version in Registry
verify_version_in_registry() {
    local client_id="$1"
    local bucket_id="$2"
    local flow_name="$3"
    
    echo "Verifying version in Registry..."
    
    # Get flows in bucket
    local flows=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$client_id/buckets/$bucket_id/flows")
    
    if echo "$flows" | grep -q "\"name\":\"$flow_name\""; then
        echo "Flow found in Registry"
        
        # Get flow ID
        local flow_id=$(echo "$flows" | grep -B 5 -A 5 "\"name\":\"$flow_name\"" | grep -o '"identifier":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$flow_id" ]; then
            # Get versions
            local versions=$(kubectl exec -n infometis statefulset/nifi -- curl -s "http://localhost:8080/nifi-api/flow/registries/$client_id/buckets/$bucket_id/flows/$flow_id/versions")
            
            echo "Available versions:"
            echo "$versions" | grep -o '"version":[0-9]*' | cut -d':' -f2 | sed 's/^/   v/'
        fi
    else
        echo "Flow not found in Registry"
        echo "   Available flows:"
        echo "$flows" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | sed 's/^/     /'
        return 1
    fi
}

# Main execution
main() {
    # Get Registry client ID
    local client_id
    client_id=$(get_registry_client_id)
    [ $? -eq 0 ] || exit 1
    
    # Get bucket ID
    local bucket_id
    bucket_id=$(get_bucket_id "$client_id")
    [ $? -eq 0 ] || exit 1
    
    # Find process group
    local group_id
    group_id=$(find_process_group "$FLOW_NAME")
    [ $? -eq 0 ] || exit 1
    
    # Start version control or create new version
    start_version_control "$group_id" "$client_id" "$bucket_id" "$FLOW_NAME" "$VERSION" "$DESCRIPTION"
    [ $? -eq 0 ] || exit 1
    
    # Verify in Registry
    verify_version_in_registry "$client_id" "$bucket_id" "$FLOW_NAME"
    
    echo ""
    echo "Pipeline versioning completed!"
    echo "   Flow: $FLOW_NAME"
    echo "   Version: $VERSION"
    echo "   Registry: http://localhost/nifi-registry"
    echo "   NiFi UI: http://localhost/nifi"
}

# Run main function
main