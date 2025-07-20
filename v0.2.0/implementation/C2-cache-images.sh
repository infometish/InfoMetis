#!/bin/bash
set -eu

# InfoMetis v0.2.0 - C2: Cache Container Images
# Downloads and saves container images for offline deployment

echo "🔄 InfoMetis v0.2.0 - C2: Cache Container Images"
echo "================================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/../../cache/images"
TEMP_DIR="/tmp/infometis-v0.2.0-cache-$$"

# Container images used in v0.2.0 (includes Registry)
IMAGES=(
    "k0sproject/k0s:latest"
    "traefik:latest"
    "apache/nifi:1.23.2"
    "apache/nifi-registry:1.23.2"
)

echo "Cache directory: ${CACHE_DIR}"
echo "Images to cache: ${#IMAGES[@]}"
echo ""

# Create cache directory if it doesn't exist
create_cache_dir() {
    echo "📁 Creating cache directory..."
    mkdir -p "${CACHE_DIR}"
    mkdir -p "${TEMP_DIR}"
    echo "✅ Cache directory ready: ${CACHE_DIR}"
}

# Download and save image as tar file
cache_image() {
    local image="$1"
    local filename="${image//\//-}.tar"
    local filepath="${CACHE_DIR}/${filename}"
    
    echo "📦 Processing: $image"
    
    if [[ -f "$filepath" ]]; then
        echo "   ✅ Already cached: $filename"
        return 0
    fi
    
    echo "   ⬇️  Downloading image..."
    if docker pull "$image"; then
        echo "   💾 Saving to cache..."
        if docker save "$image" > "$filepath"; then
            echo "   ✅ Cached: $filename ($(du -h "$filepath" | cut -f1))"
            return 0
        else
            echo "   ❌ Failed to save: $filename"
            rm -f "$filepath"
            return 1
        fi
    else
        echo "   ❌ Failed to download: $image"
        return 1
    fi
}

# Load cached image into Docker
load_image() {
    local image="$1"
    local filename="${image//\//-}.tar"
    local filepath="${CACHE_DIR}/${filename}"
    
    echo "📦 Loading: $image"
    
    if [[ ! -f "$filepath" ]]; then
        echo "   ❌ Cache file not found: $filename"
        return 1
    fi
    
    if docker load < "$filepath"; then
        echo "   ✅ Loaded: $image"
        return 0
    else
        echo "   ❌ Failed to load: $image"
        return 1
    fi
}

# Show cache status
show_cache_status() {
    echo ""
    echo "📊 Cache Status:"
    echo "==============="
    
    if [[ ! -d "$CACHE_DIR" ]]; then
        echo "❌ Cache directory does not exist"
        return 1
    fi
    
    local total_size=0
    local cached_count=0
    
    for image in "${IMAGES[@]}"; do
        local filename="${image//\//-}.tar"
        local filepath="${CACHE_DIR}/${filename}"
        
        if [[ -f "$filepath" ]]; then
            local size=$(du -b "$filepath" | cut -f1)
            local size_human=$(du -h "$filepath" | cut -f1)
            echo "✅ $image ($size_human)"
            total_size=$((total_size + size))
            cached_count=$((cached_count + 1))
        else
            echo "❌ $image (not cached)"
        fi
    done
    
    echo ""
    echo "📈 Summary:"
    echo "   Cached: $cached_count/${#IMAGES[@]} images"
    if [[ $total_size -gt 0 ]]; then
        echo "   Total size: $(numfmt --to=iec --suffix=B $total_size)"
    fi
    
    return 0
}

# Main cache operation
cache_images() {
    echo "🚀 Starting image caching process..."
    echo "   This requires internet connectivity"
    echo ""
    
    create_cache_dir
    
    local success_count=0
    local total_count=${#IMAGES[@]}
    
    for image in "${IMAGES[@]}"; do
        if cache_image "$image"; then
            success_count=$((success_count + 1))
        fi
        echo ""
    done
    
    echo "📊 Caching Results:"
    echo "   Successful: $success_count/$total_count images"
    
    if [[ $success_count -eq $total_count ]]; then
        echo ""
        echo "🎉 All images cached successfully!"
        echo "   Ready for offline deployment"
        return 0
    else
        echo ""
        echo "⚠️  Some images failed to cache"
        echo "   Offline deployment may not work properly"
        return 1
    fi
}

# Load cached images into Docker
load_cached_images() {
    echo "🔄 Loading cached images into Docker..."
    echo ""
    
    if [[ ! -d "$CACHE_DIR" ]]; then
        echo "❌ Cache directory not found: $CACHE_DIR"
        echo "   Run 'cache' operation first"
        return 1
    fi
    
    local success_count=0
    local total_count=${#IMAGES[@]}
    
    for image in "${IMAGES[@]}"; do
        if load_image "$image"; then
            success_count=$((success_count + 1))
        fi
        echo ""
    done
    
    echo "📊 Loading Results:"
    echo "   Successful: $success_count/$total_count images"
    
    if [[ $success_count -eq $total_count ]]; then
        echo ""
        echo "🎉 All cached images loaded successfully!"
        return 0
    else
        echo ""
        echo "⚠️  Some images failed to load"
        return 1
    fi
}

# Cleanup temp directory on exit
cleanup() {
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

# Main execution
case "${1:-}" in
    "cache")
        cache_images
        ;;
    "load")
        load_cached_images
        ;;
    "status")
        show_cache_status
        ;;
    *)
        echo "Usage: $0 {cache|load|status}"
        echo ""
        echo "Commands:"
        echo "  cache   - Download and cache images for offline use"
        echo "  load    - Load cached images into Docker"
        echo "  status  - Show current cache status"
        echo ""
        show_cache_status
        ;;
esac