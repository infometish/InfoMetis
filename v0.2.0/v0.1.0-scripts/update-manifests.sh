#!/bin/bash
# Update manifest files with centralized image configuration

set -eu

# Load centralized image configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-image-config.sh"

MANIFEST_DIR="$SCRIPT_DIR/../config/manifests"

echo "🔧 Updating manifests with centralized image configuration"
echo "========================================================="

# Update Traefik manifest
echo "📝 Updating Traefik manifest..."
if [[ -f "$MANIFEST_DIR/traefik-deployment.yaml" ]]; then
    # Update image and add imagePullPolicy if not present
    sed -i "s|image: traefik:.*|image: $TRAEFIK_IMAGE|g" "$MANIFEST_DIR/traefik-deployment.yaml"
    
    # Add imagePullPolicy if not present
    if ! grep -q "imagePullPolicy" "$MANIFEST_DIR/traefik-deployment.yaml"; then
        sed -i "\|image: $TRAEFIK_IMAGE|a\\        imagePullPolicy: $IMAGE_PULL_POLICY" "$MANIFEST_DIR/traefik-deployment.yaml"
    fi
    echo "  ✅ Traefik manifest updated"
else
    echo "  ❌ Traefik manifest not found"
fi

# Update NiFi manifest
echo "📝 Updating NiFi manifest..."
if [[ -f "$MANIFEST_DIR/nifi-k8s.yaml" ]]; then
    # Update image and add imagePullPolicy if not present
    sed -i "s|image: apache/nifi:.*|image: $NIFI_IMAGE|g" "$MANIFEST_DIR/nifi-k8s.yaml"
    
    # Add imagePullPolicy if not present
    if ! grep -q "imagePullPolicy" "$MANIFEST_DIR/nifi-k8s.yaml"; then
        sed -i "\|image: $NIFI_IMAGE|a\\        imagePullPolicy: $IMAGE_PULL_POLICY" "$MANIFEST_DIR/nifi-k8s.yaml"
    fi
    echo "  ✅ NiFi manifest updated"
else
    echo "  ❌ NiFi manifest not found"
fi

echo ""
echo "🎉 Manifest updates complete!"
echo "   All images configured for offline deployment"