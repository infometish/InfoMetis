#\!/bin/bash
set -eu

# InfoMetis v0.2.0 - Deploy v0.1.0 InfoMetis (NiFi)
# DSL-style composition of atomic v0.1.0 scripts

echo "🚀 InfoMetis v0.2.0 - Deploy v0.1.0 InfoMetis"
echo "============================================="
echo "DSL Composition: NiFi Deployment"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V0_1_0_SCRIPTS="$SCRIPT_DIR/../v0.1.0-scripts"

# Execute atomic scripts in sequence
echo "📋 NiFi Deployment"
echo "=================="

"$V0_1_0_SCRIPTS/D1-deploy-nifi.sh"
"$V0_1_0_SCRIPTS/D2-verify-nifi.sh"
"$V0_1_0_SCRIPTS/D3-test-nifi-ui.sh"

echo ""
echo "🎉 v0.1.0 InfoMetis Deployment Complete\!"
echo "======================================="
echo ""
echo "📊 Status Summary:"
echo "  • NiFi: Deployed and verified"
echo "  • NiFi UI: Accessible via Traefik"
echo ""
echo "🔗 Access Points:"
echo "  • NiFi UI: http://localhost/nifi"
echo "  • Traefik Dashboard: http://localhost:8080"
echo ""
echo "📋 Next Steps:"
echo "  ./D3-verify-v0.1.0-foundation.sh  # Full verification"
