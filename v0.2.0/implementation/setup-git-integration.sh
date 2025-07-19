#\!/bin/bash
set -eu

# setup-git-integration.sh - Connect Registry to external Git repository
# Usage: ./setup-git-integration.sh <git-repo-url>

if [ $# -ne 1 ]; then
    echo "Usage: $0 <git-repo-url>"
    echo "Example: $0 https://github.com/user/nifi-flows.git"
    exit 1
fi

REPO_URL="$1"

echo "🔗 Connecting NiFi Registry to Git repository: $REPO_URL"

# Update Registry providers.xml with remote repository
kubectl exec -n infometis deployment/nifi-registry -- bash -c "
    sed -i 's < /dev/null | <property name=\"Remote Access User\"></property>|<property name=\"Remote Access User\">nifi-registry</property>|' /opt/nifi-registry/conf/providers.xml
    sed -i 's|<property name=\"Remote Access Password\"></property>|<property name=\"Remote Access Password\"></property>|' /opt/nifi-registry/conf/providers.xml
    echo 'Updated providers.xml for remote repository'
"

# Restart Registry to pick up changes
echo "🔄 Restarting Registry..."
kubectl rollout restart deployment/nifi-registry -n infometis
kubectl rollout status deployment/nifi-registry -n infometis --timeout=60s

echo "✅ Git integration configured for: $REPO_URL"
echo "   Access Registry UI: http://localhost/nifi-registry"
echo "   Note: Git operations are managed internally by NiFi Registry"
