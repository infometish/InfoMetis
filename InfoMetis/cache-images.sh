#!/bin/bash
set -eu

# InfoMetis Container Image Cache Creation Script
# Downloads and saves container images as tar files for offline deployment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${SCRIPT_DIR}/cache/images"
TEMP_DIR="/tmp/infometis-cache-$$"

# Container images to cache
IMAGES=(
    "k0sproject/k0s:latest"
    "traefik:latest"
    "apache/nifi:latest"
)

echo "🚀 InfoMetis Container Image Cache Creation"
echo "==========================================="
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

# Check if image already exists in cache
image_cached() {
    local image="$1"
    local image_name=$(echo "$image" | tr '/' '-' | tr ':' '-')
    local cache_file="${CACHE_DIR}/${image_name}.tar"
    
    if [[ -f "$cache_file" ]]; then
        echo "✅ Already cached: $image"
        return 0
    else
        return 1
    fi
}

# Pull and cache a single image
cache_image() {
    local image="$1"
    local image_name=$(echo "$image" | tr '/' '-' | tr ':' '-')
    local cache_file="${CACHE_DIR}/${image_name}.tar"
    
    echo "📥 Processing: $image"
    
    # Check if already cached
    if image_cached "$image"; then
        return 0
    fi
    
    # Pull image if not present locally
    echo "  🔄 Pulling image..."
    if ! docker pull "$image" >/dev/null 2>&1; then
        echo "  ❌ Failed to pull $image"
        return 1
    fi
    
    # Save image to tar file
    echo "  💾 Saving to cache..."
    if ! docker save "$image" -o "$cache_file"; then
        echo "  ❌ Failed to save $image"
        return 1
    fi
    
    # Get file size
    local size=$(du -h "$cache_file" | cut -f1)
    echo "  ✅ Cached: $image ($size)"
    
    return 0
}

# Display cache status
display_cache_status() {
    echo ""
    echo "📊 Cache Status:"
    echo "==============="
    
    local total_size=0
    local cached_count=0
    
    for image in "${IMAGES[@]}"; do
        local image_name=$(echo "$image" | tr '/' '-' | tr ':' '-')
        local cache_file="${CACHE_DIR}/${image_name}.tar"
        
        if [[ -f "$cache_file" ]]; then
            local size_bytes=$(stat -c%s "$cache_file" 2>/dev/null || echo "0")
            local size_human=$(du -h "$cache_file" | cut -f1)
            total_size=$((total_size + size_bytes))
            cached_count=$((cached_count + 1))
            echo "✅ ${image}: ${size_human}"
        else
            echo "❌ ${image}: Not cached"
        fi
    done
    
    echo ""
    echo "📈 Summary:"
    echo "  Images cached: ${cached_count}/${#IMAGES[@]}"
    
    if [[ $total_size -gt 0 ]]; then
        local total_human=$(numfmt --to=iec --suffix=B $total_size)
        echo "  Total cache size: ${total_human}"
    fi
    
    echo "  Cache location: ${CACHE_DIR}"
}

# Cleanup temporary directory
cleanup() {
    if [[ -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

# Main execution
main() {
    # Setup cleanup trap
    trap cleanup EXIT
    
    # Create cache directory
    create_cache_dir
    
    # Cache each image
    local failed_images=()
    for image in "${IMAGES[@]}"; do
        if ! cache_image "$image"; then
            failed_images+=("$image")
        fi
    done
    
    # Display results
    display_cache_status
    
    # Report failures
    if [[ ${#failed_images[@]} -gt 0 ]]; then
        echo ""
        echo "❌ Failed to cache images:"
        for image in "${failed_images[@]}"; do
            echo "  • $image"
        done
        echo ""
        echo "🔧 Troubleshooting:"
        echo "  • Check internet connectivity"
        echo "  • Verify Docker daemon is running"
        echo "  • Ensure sufficient disk space"
        return 1
    else
        echo ""
        echo "🎉 All images successfully cached!"
        echo ""
        echo "📋 Next steps:"
        echo "  • Use --cached flag with setup scripts"
        echo "  • Images will be loaded from cache automatically"
        echo "  • No internet required for deployments"
        return 0
    fi
}

# Run main function
main "$@"