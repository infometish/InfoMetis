#!/bin/bash
# step-00a-cache-images.sh
# Cache container images for offline deployment

set -eu

echo "🔄 Step 0a: Caching Container Images"
echo "===================================="

# Use the main cache script
CACHE_SCRIPT="./cache-images.sh"

if [[ ! -f "$CACHE_SCRIPT" ]]; then
    echo "❌ Cache script not found: $CACHE_SCRIPT"
    exit 1
fi

echo "📦 Starting image caching process..."
echo "   This requires internet connectivity"
echo "   Images will be saved to ../cache/images/"
echo ""

# Run the cache script
if "$CACHE_SCRIPT" cache; then
    echo ""
    echo "🎉 Step 0a completed!"
    echo "   All images cached successfully"
    echo "   Ready for offline deployment"
else
    echo ""
    echo "❌ Step 0a failed!"
    echo "   Some images could not be cached"
    exit 1
fi