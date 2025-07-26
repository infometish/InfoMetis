#!/bin/bash

# ksqlDB Server Component Deployment Script
# Part of InfoMetis Carambah v0.5.0

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPONENT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔧 ksqlDB Server Component Deployment"
echo "Component Directory: $COMPONENT_DIR"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check for kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is required but not installed"
    exit 1
fi

# Default action
ACTION="${1:-deploy}"

case "$ACTION" in
    "deploy")
        echo "🚀 Deploying ksqlDB Server..."
        cd "$SCRIPT_DIR"
        node deploy-ksqldb.js deploy
        ;;
    "cleanup"|"remove"|"delete")
        echo "🗑️ Cleaning up ksqlDB Server..."
        cd "$SCRIPT_DIR"
        node deploy-ksqldb.js cleanup
        ;;
    "status"|"check")
        echo "📊 Checking ksqlDB Server status..."
        kubectl get pods -n infometis -l app=ksqldb-server
        kubectl get pods -n infometis -l app=ksqldb-cli
        kubectl get svc -n infometis -l app=ksqldb-server
        ;;
    "logs")
        echo "📋 Showing ksqlDB Server logs..."
        kubectl logs -n infometis -l app=ksqldb-server --tail=50
        ;;
    "cli")
        echo "💻 Connecting to ksqlDB CLI..."
        kubectl exec -it -n infometis deployment/ksqldb-cli -- ksql http://ksqldb-server-service:8088
        ;;
    "help"|"--help"|"-h")
        echo "Usage: $0 [ACTION]"
        echo ""
        echo "Actions:"
        echo "  deploy    Deploy ksqlDB Server (default)"
        echo "  cleanup   Remove ksqlDB Server deployment"
        echo "  status    Check deployment status"
        echo "  logs      Show server logs"
        echo "  cli       Connect to ksqlDB CLI"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 deploy"
        echo "  $0 status"
        echo "  $0 cli"
        echo "  $0 cleanup"
        ;;
    *)
        echo "❌ Unknown action: $ACTION"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac