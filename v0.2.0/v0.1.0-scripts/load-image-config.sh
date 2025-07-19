#!/bin/bash
# Load centralized image configuration

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config/image-config.env"

# Source the image configuration
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
    echo "✅ Image configuration loaded"
    echo "   NiFi: $NIFI_IMAGE"
    echo "   Traefik: $TRAEFIK_IMAGE" 
    echo "   k0s: $K0S_IMAGE"
    echo "   Registry: $NIFI_REGISTRY_IMAGE"
    echo "   Pull Policy: $IMAGE_PULL_POLICY"
else
    echo "❌ Image configuration not found: $CONFIG_FILE"
    exit 1
fi