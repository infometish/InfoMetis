#!/bin/bash
# step-00-cleanup-all.sh
# Clean up entire InfoMetis deployment

set -eu

echo "🧹 Step 00: Complete InfoMetis Cleanup"
echo "======================================"

echo "📋 Stopping and removing k0s container..."
docker stop infometis 2>/dev/null || true
docker rm infometis 2>/dev/null || true

echo "📋 Removing docker volumes..."
docker volume rm $(docker volume ls -q | grep k0s) 2>/dev/null || true

echo "📋 Cleaning up temporary files..."
rm -f /tmp/cai-pipeline-config.env 2>/dev/null || true

echo "📋 Checking for any remaining containers..."
REMAINING=$(docker ps -a | grep infometis | wc -l || echo "0")
if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️  Found remaining containers:"
    docker ps -a | grep infometis
    docker rm -f $(docker ps -aq | xargs docker inspect --format '{{.Name}} {{.Config.Hostname}}' | grep infometis | cut -d' ' -f1 | sed 's/^.//')
fi

echo "📋 Verifying cleanup..."
if docker ps -a | grep -q infometis; then
    echo "❌ Cleanup incomplete - some containers still exist"
    docker ps -a | grep infometis
    exit 1
else
    echo "✅ Complete cleanup successful"
fi

echo ""
echo "🎉 InfoMetis v0.1.0 completely removed!"
echo "   Ready for fresh deployment"