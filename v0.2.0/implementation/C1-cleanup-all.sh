#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Complete Environment Cleanup
# Removes all containers, networks, volumes, and cached images

echo "🧹 InfoMetis v0.2.0 - Complete Environment Cleanup"
echo "================================================="

# Stop and remove k0s container if exists
echo "🔄 Stopping k0s container..."
if docker ps -q -f name=k0s-infometis >/dev/null 2>&1; then
    docker stop k0s-infometis || true
    docker rm k0s-infometis || true
    echo "✅ k0s container removed"
else
    echo "ℹ️  No k0s container found"
fi

# Remove any InfoMetis related containers
echo "🔄 Removing InfoMetis containers..."
docker ps -aq -f name=infometis | xargs -r docker rm -f || true

# Clean up Docker networks
echo "🔄 Cleaning Docker networks..."
docker network ls -q -f name=infometis | xargs -r docker network rm || true

# Clean up Docker volumes
echo "🔄 Cleaning Docker volumes..."
docker volume ls -q -f name=infometis | xargs -r docker volume rm || true

# Remove InfoMetis images (optional - uncomment if desired)
# echo "🔄 Removing InfoMetis images..."
# docker images -q "*infometis*" | xargs -r docker rmi -f || true

# Clean up any temporary files
echo "🔄 Cleaning temporary files..."
rm -rf /tmp/infometis-* || true

# Reset kubectl context if it exists
echo "🔄 Resetting kubectl context..."
kubectl config delete-context k0s-infometis >/dev/null 2>&1 || true
kubectl config delete-cluster k0s-infometis >/dev/null 2>&1 || true
kubectl config delete-user k0s-infometis >/dev/null 2>&1 || true

echo ""
echo "✅ Cleanup Complete!"
echo "🔧 Environment ready for fresh deployment"
echo ""
echo "Next steps:"
echo "  ./C2-cache-images.sh    # Cache container images"
echo "  ./D1-deploy-v0.1.0-foundation.sh  # Deploy foundation"