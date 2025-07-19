#!/bin/bash
# step-00b-load-cached-images.sh
# Load cached images for offline deployment

set -eu

echo "🔄 Step 2a: Loading Cached Images into k0s"
echo "================================="

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
    echo "   Run step 0a (Cache images) first"
    exit 1
fi

echo "📦 Loading cached images into Docker..."
echo ""

# Load cached images into Docker first
if "$CACHE_SCRIPT" load; then
    echo ""
    echo "🎉 Step 2a completed!"
    echo "   All cached images loaded into Docker"
    echo "   Ready for k0s deployment"
    echo ""
    echo "ℹ️  Note: Images will be imported into k0s containerd after API server is ready"
else
    echo ""
    echo "❌ Step 2a failed!"
    echo "   Some cached images could not be loaded"
    exit 1
fi