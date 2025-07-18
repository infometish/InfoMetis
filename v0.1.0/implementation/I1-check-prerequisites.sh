#!/bin/bash
# step-01-check-prerequisites.sh
# Check all prerequisites before cluster setup

set -eu

echo "🔍 Step 1: Checking Prerequisites"
echo "=================================="

# Check Docker
echo "📋 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running"
    exit 1
fi

echo "✅ Docker is available"

# Check kubectl
echo "📋 Checking kubectl..."
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed"
    exit 1
fi

echo "✅ kubectl is available"

# Check if previous cluster exists
echo "📋 Checking for existing cluster..."
if docker ps --format "{{.Names}}" | grep -q "^infometis$"; then
    echo "⚠️  Existing infometis cluster found"
    echo "   Run cleanup-environment.sh first"
    exit 1
fi

echo "✅ No existing cluster found"

echo ""
echo "🎉 All prerequisites satisfied!"
echo "✅ Ready to proceed with cluster setup"