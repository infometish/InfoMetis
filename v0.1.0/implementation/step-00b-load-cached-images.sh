#!/bin/bash
# step-00b-load-cached-images.sh
# Load cached images for offline deployment

set -eu

echo "🔄 Step 0b: Loading Cached Images"
echo "================================="

# Use the main cache script
CACHE_SCRIPT="./cache-images.sh"

if [[ ! -f "$CACHE_SCRIPT" ]]; then
    echo "❌ Cache script not found: $CACHE_SCRIPT"
    exit 1
fi

# Check if cache exists
if [[ ! -d "./cache/images" ]]; then
    echo "❌ No image cache found"
    echo "   Run step 0a (Cache images) first"
    exit 1
fi

echo "📦 Loading cached images into Docker..."
echo ""

# Load cached images into Docker first
if "$CACHE_SCRIPT" load; then
    echo "📦 Importing images into k0s containerd..."
    
    # Import NiFi image specifically
    echo "  Importing apache/nifi:1.23.2..."
    docker save apache/nifi:1.23.2 | docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"
    
    # Import other images  
    echo "  Importing k0sproject/k0s:latest..."
    docker save k0sproject/k0s:latest | docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"
    
    echo "  Importing traefik:latest..."
    docker save traefik:latest | docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"
    echo ""
    echo "🎉 Step 0b completed!"
    echo "   All cached images loaded successfully"
    echo "   Ready for offline deployment"
else
    echo ""
    echo "❌ Step 0b failed!"
    echo "   Some cached images could not be loaded"
    exit 1
fi