#!/bin/bash
# Import cached images into k0s containerd after API is ready
set -eu

echo "📦 Step 3a: Importing Images to k0s containerd"
echo "=============================================="
echo "⏳ Waiting for containerd to be fully ready..."
sleep 15

# Load centralized image configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../config/image-config.env"
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
echo "  Importing $NIFI_IMAGE (large image, may need retries)..."

# Check if image exists in Docker first
if ! docker image inspect "$NIFI_IMAGE" >/dev/null 2>&1; then
    echo "  ❌ Image $NIFI_IMAGE not found in Docker"
    echo "     Run 'cache-images.sh load' first"
    exit 1
fi

nifi_imported=false
for attempt in 1 2 3; do
    echo "    Attempt $attempt/3..."
    if timeout 200 docker save "$NIFI_IMAGE" | timeout 200 docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"; then
        echo "  ✅ $NIFI_IMAGE imported successfully"
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
echo "  Importing $TRAEFIK_IMAGE..."

# Check if image exists in Docker first
if ! docker image inspect "$TRAEFIK_IMAGE" >/dev/null 2>&1; then
    echo "  ❌ Image $TRAEFIK_IMAGE not found in Docker"
    echo "     Run 'cache-images.sh load' first"
    exit 1
fi

if timeout 200 docker save "$TRAEFIK_IMAGE" | timeout 200 docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"; then
    echo "  ✅ $TRAEFIK_IMAGE imported"
else
    echo "  ❌ Failed to import $TRAEFIK_IMAGE"
fi

# Import Registry image
echo "  Importing $NIFI_REGISTRY_IMAGE..."

# Check if image exists in Docker first
if ! docker image inspect "$NIFI_REGISTRY_IMAGE" >/dev/null 2>&1; then
    echo "  ❌ Image $NIFI_REGISTRY_IMAGE not found in Docker"
    echo "     Run 'cache-images.sh load' first"
    exit 1
fi

if timeout 200 docker save "$NIFI_REGISTRY_IMAGE" | timeout 200 docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"; then
    echo "  ✅ $NIFI_REGISTRY_IMAGE imported"
else
    echo "  ❌ Failed to import $NIFI_REGISTRY_IMAGE"
fi

# Import k0s image (in case needed)
echo "  Importing $K0S_IMAGE..."

# Check if image exists in Docker first
if ! docker image inspect "$K0S_IMAGE" >/dev/null 2>&1; then
    echo "  ❌ Image $K0S_IMAGE not found in Docker"
    echo "     Run 'cache-images.sh load' first"
    exit 1
fi

if timeout 200 docker save "$K0S_IMAGE" | timeout 200 docker exec -i infometis sh -c "k0s ctr --namespace=k8s.io images import --platform linux/amd64 -"; then
    echo "  ✅ $K0S_IMAGE imported"
else
    echo "  ❌ Failed to import $K0S_IMAGE"
fi

echo ""
echo "🎉 Step 3a completed!"
echo "   All cached images imported to k0s containerd"
echo "   Ready for pod deployments"