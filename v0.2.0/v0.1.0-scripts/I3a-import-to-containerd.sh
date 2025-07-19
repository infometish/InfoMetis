#!/bin/bash
# Import cached images into k0s containerd after API is ready
set -eu

echo "📦 Step 3a: Importing Images to k0s containerd"
echo "=============================================="
echo "⏳ Waiting for containerd to be fully ready..."
sleep 15

# Use the main cache script (in same directory as this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_SCRIPT="$SCRIPT_DIR/cache-images.sh"

if [[ ! -f "$CACHE_SCRIPT" ]]; then
    echo "❌ Cache script not found: $CACHE_SCRIPT"
    exit 1
fi

# Check if cache exists (now in top level)
if [[ ! -d "../cache/images" ]]; then
    echo "❌ No image cache found"
    echo "   Run C2 (Cache images) first"
    exit 1
fi

echo "📦 Importing cached images into k0s containerd..."
echo ""

# Import NiFi image specifically (with retries)
echo "  Importing apache/nifi:1.23.2 (large image, may need retries)..."
nifi_imported=false
for attempt in 1 2 3; do
    echo "    Attempt $attempt/3..."
    if docker save apache/nifi:1.23.2 | docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"; then
        echo "  ✅ apache/nifi:1.23.2 imported successfully"
        nifi_imported=true
        break
    else
        echo "    Attempt $attempt failed, waiting 10 seconds..."
        sleep 10
    fi
done

if [ "$nifi_imported" = false ]; then
    echo "  ⚠️  NiFi image import failed after 3 attempts - deployment may pull from internet"
fi

# Import Traefik image  
echo "  Importing traefik:latest..."
if docker save traefik:latest | docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"; then
    echo "  ✅ traefik:latest imported"
else
    echo "  ❌ Failed to import traefik:latest"
fi

# Import k0s image (in case needed)
echo "  Importing k0sproject/k0s:latest..."
if docker save k0sproject/k0s:latest | docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"; then
    echo "  ✅ k0sproject/k0s:latest imported"
else
    echo "  ❌ Failed to import k0sproject/k0s:latest"
fi

echo ""
echo "🎉 Step 3a completed!"
echo "   All cached images imported to k0s containerd"
echo "   Ready for pod deployments"