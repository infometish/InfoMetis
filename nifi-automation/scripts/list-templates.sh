#!/bin/bash

# List Available Pipeline Templates
# Usage: ./list-templates.sh

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPTS_DIR/../templates"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m'

echo -e "${BLUE}📋 Available Pipeline Templates${NC}"
echo ""

if [ ! -d "$TEMPLATES_DIR" ]; then
    echo "No templates directory found"
    exit 1
fi

# List all template files
for template in "$TEMPLATES_DIR"/*.yaml; do
    if [ -f "$template" ]; then
        filename=$(basename "$template" .yaml)
        
        # Extract name and description if yq is available
        if command -v yq &> /dev/null; then
            name=$(yq eval '.pipeline.name // "Unknown"' "$template" 2>/dev/null)
            description=$(yq eval '.pipeline.description // "No description"' "$template" 2>/dev/null)
            
            echo -e "${GREEN}📄 $filename${NC}"
            echo -e "   Name: $name"
            echo -e "   Description: $description"
        else
            echo -e "${GREEN}📄 $filename${NC}"
            echo -e "${GRAY}   (Install yq for detailed information)${NC}"
        fi
        echo ""
    fi
done

echo "🚀 Usage:"
echo "   Create from template: ./create-pipeline.sh ../templates/template-name.yaml"
echo "   Customize template: cp ../templates/template-name.yaml my-pipeline.yaml"
echo ""