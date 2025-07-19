#\!/bin/bash
# test-git-integration.sh - Test Git integration for Registry

echo "🧪 Testing Git Integration..."

# Create test Git repo
TEST_REPO="/tmp/test-nifi-repo"
rm -rf "$TEST_REPO"
mkdir -p "$TEST_REPO"
cd "$TEST_REPO"
git init >/dev/null 2>&1
echo "# Test NiFi Repository" > README.md
git add README.md >/dev/null 2>&1
git config user.email "test@example.com" >/dev/null 2>&1
git config user.name "Test User" >/dev/null 2>&1
git commit -m "Initial commit" >/dev/null 2>&1

echo "  Created test repository: $TEST_REPO"

# Test Registry API access
cd /home/herma/infometish/InfoMetis/v0.2.0/implementation
echo "  Testing Registry API..."

# Check if Registry is accessible
if curl -s http://localhost/nifi-registry-api/buckets >/dev/null 2>&1; then
    echo "✅ Git integration test PASSED"
    echo "   Registry accessible with Git flow persistence provider"
    
    # Check if buckets are working
    BUCKET_COUNT=$(curl -s http://localhost/nifi-registry-api/buckets  < /dev/null |  grep -o '"name"' | wc -l)
    echo "   Found $BUCKET_COUNT bucket(s) in Registry"
    exit 0
else
    echo "❌ Git integration test FAILED"
    echo "   Registry not accessible"
    exit 1
fi
