#!/bin/bash

# Git Workflow Helper Functions
# Source this file to get automated sync commands that prevent branch drift

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Session start sync (replaces 6 manual steps)
git-sync-session-start() {
    echo -e "${BLUE}🔄 Starting session sync...${NC}"
    
    if ! git fetch origin; then
        echo -e "${RED}❌ Failed to fetch from origin${NC}"
        return 1
    fi
    
    if ! git checkout main; then
        echo -e "${RED}❌ Failed to checkout main${NC}"
        return 1
    fi
    
    if ! git pull origin main; then
        echo -e "${RED}❌ Failed to pull origin/main${NC}"
        return 1
    fi
    
    if ! git checkout unplanned; then
        echo -e "${RED}❌ Failed to checkout unplanned${NC}"
        return 1
    fi
    
    if ! git merge main; then
        echo -e "${RED}❌ Failed to merge main into unplanned${NC}"
        echo -e "${YELLOW}⚠️  You may need to resolve conflicts manually${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Session sync complete${NC}"
    echo -e "${BLUE}Branch status:${NC}"
    git branch -vv
}

# Post-PR sync (replaces 5 manual steps)
git-sync-post-pr() {
    echo -e "${BLUE}🔄 Syncing branches after PR merge...${NC}"
    
    if ! git checkout main; then
        echo -e "${RED}❌ Failed to checkout main${NC}"
        return 1
    fi
    
    if ! git pull origin main; then
        echo -e "${RED}❌ Failed to pull origin/main${NC}"
        return 1
    fi
    
    if ! git checkout unplanned; then
        echo -e "${RED}❌ Failed to checkout unplanned${NC}"
        return 1
    fi
    
    if ! git merge main; then
        echo -e "${RED}❌ Failed to merge main into unplanned${NC}"
        return 1
    fi
    
    if ! git push origin unplanned; then
        echo -e "${RED}❌ Failed to push unplanned to origin${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Post-PR sync complete${NC}"
    echo -e "${BLUE}Branch status:${NC}"
    git branch -vv
}

# Verification before any work
git-verify-sync() {
    local status_output=$(git branch -vv 2>/dev/null)
    
    if echo "$status_output" | grep -q "behind\|ahead"; then
        echo -e "${RED}❌ Branches out of sync${NC}"
        echo -e "${YELLOW}📋 Branch status:${NC}"
        echo "$status_output"
        echo -e "${BLUE}💡 Run: git-sync-session-start${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Branches synchronized - safe to proceed${NC}"
    return 0
}

# Emergency recovery (nuclear option)
git-sync-emergency() {
    echo -e "${RED}🚨 Emergency sync recovery...${NC}"
    echo -e "${YELLOW}⚠️  This will discard local changes!${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Operation cancelled${NC}"
        return 1
    fi
    
    if ! git fetch origin --all; then
        echo -e "${RED}❌ Failed to fetch from origin${NC}"
        return 1
    fi
    
    if ! git checkout main; then
        echo -e "${RED}❌ Failed to checkout main${NC}"
        return 1
    fi
    
    if ! git reset --hard origin/main; then
        echo -e "${RED}❌ Failed to reset main${NC}"
        return 1
    fi
    
    if ! git checkout unplanned; then
        echo -e "${RED}❌ Failed to checkout unplanned${NC}"
        return 1
    fi
    
    if ! git reset --hard main; then
        echo -e "${RED}❌ Failed to reset unplanned${NC}"
        return 1
    fi
    
    if ! git push origin unplanned --force-with-lease; then
        echo -e "${RED}❌ Failed to force push unplanned${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Emergency recovery complete${NC}"
    echo -e "${BLUE}Branch status:${NC}"
    git branch -vv
}

# Safe commit wrapper
git-commit-safe() {
    if git-verify-sync; then
        git commit "$@"
    else
        echo -e "${RED}❌ Cannot commit - branches not synchronized${NC}"
        return 1
    fi
}

# Safe PR creation wrapper
gh-pr-create-safe() {
    if git-verify-sync; then
        gh pr create "$@"
    else
        echo -e "${RED}❌ Cannot create PR - branches not synchronized${NC}"
        return 1
    fi
}

# Show help
git-workflow-help() {
    echo -e "${BLUE}Git Workflow Helper Commands:${NC}"
    echo ""
    echo -e "${GREEN}Essential Commands:${NC}"
    echo "  git-sync-session-start    - Start session with full sync"
    echo "  git-sync-post-pr         - Sync after PR merge"
    echo "  git-verify-sync          - Check if branches are synchronized"
    echo ""
    echo -e "${YELLOW}Emergency:${NC}"
    echo "  git-sync-emergency       - Nuclear option for sync recovery"
    echo ""
    echo -e "${BLUE}Safe Wrappers:${NC}"
    echo "  git-commit-safe          - Commit with sync verification"
    echo "  gh-pr-create-safe        - Create PR with sync verification"
    echo ""
    echo -e "${GREEN}Usage Examples:${NC}"
    echo "  git-sync-session-start                    # Start of session"
    echo "  git-verify-sync && git commit -m 'msg'    # Safe commit"
    echo "  gh pr merge --squash && git-sync-post-pr  # After PR merge"
}

# Auto-setup message
echo -e "${BLUE}Git Workflow Helpers Loaded${NC}"
echo -e "${GREEN}Essential commands: git-sync-session-start, git-sync-post-pr, git-verify-sync${NC}"
echo -e "${BLUE}Run 'git-workflow-help' for full command list${NC}"