#!/bin/bash
set -eu

# InfoMetis v0.2.0 - Deploy v0.1.0 Foundation (Cluster + Traefik)
# DSL-style composition of atomic v0.1.0 scripts

echo "🚀 InfoMetis v0.2.0 - Deploy v0.1.0 Foundation"
echo "=============================================="
echo "DSL Composition: Infrastructure + Traefik"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V0_1_0_SCRIPTS="$SCRIPT_DIR/../v0.1.0-scripts"

# Execute atomic scripts in sequence
echo "📋 Foundation Infrastructure Deployment"
echo "======================================="

"$V0_1_0_SCRIPTS/I1-check-prerequisites.sh"
"$V0_1_0_SCRIPTS/I2-create-k0s-container.sh"
"$V0_1_0_SCRIPTS/I3-load-cached-images.sh"
"$V0_1_0_SCRIPTS/I4-wait-for-k0s-api.sh"
"$V0_1_0_SCRIPTS/I3a-import-to-containerd.sh"
"$V0_1_0_SCRIPTS/I5-configure-kubectl.sh"
"$V0_1_0_SCRIPTS/I6-create-namespace.sh"
"$V0_1_0_SCRIPTS/I7-remove-master-taint.sh"
"$V0_1_0_SCRIPTS/I8-deploy-traefik.sh"
"$V0_1_0_SCRIPTS/I9-setup-local-storage.sh"
"$V0_1_0_SCRIPTS/I10-verify-cluster.sh"

echo ""
echo "🎉 v0.1.0 Foundation Deployment Complete!"
echo "========================================"
echo ""
echo "📊 Status Summary:"
echo "  • k0s cluster: Running"
echo "  • Traefik ingress: Deployed"
echo "  • Local storage: Configured"
echo ""
echo "📋 Next Steps:"
echo "  ./D2-deploy-v0.1.0-infometis.sh  # Deploy NiFi"
echo "  ./D3-verify-v0.1.0-foundation.sh  # Verify deployment"