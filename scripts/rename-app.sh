#!/bin/bash

# Aero Code → Aero Work Rename Script
# This script handles all case variations:
# - "Aero Code" → "Aero Work"
# - "aero code" → "aero work"
# - "aero-code" → "aero-work"
# - "aero_code" → "aero_work"
# - "AeroCode" → "AeroWork"
# - "aerocode" → "aerowork"
# - "AERO_CODE" → "AERO_WORK"
# - "AERO-CODE" → "AERO-WORK"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}=== Aero Code → Aero Work Rename Script ===${NC}"
echo "Project root: $PROJECT_ROOT"
echo ""

# Define file patterns to process
FILE_PATTERNS=(
    "*.ts"
    "*.tsx"
    "*.js"
    "*.jsx"
    "*.json"
    "*.md"
    "*.html"
    "*.css"
    "*.scss"
    "*.toml"
    "*.rs"
    "*.yaml"
    "*.yml"
)

# Directories to exclude
EXCLUDE_DIRS=(
    "node_modules"
    "target"
    ".git"
    "dist"
    "dev-dist"
    ".next"
    "build"
)

# Build exclude pattern for find
EXCLUDE_PATTERN=""
for dir in "${EXCLUDE_DIRS[@]}"; do
    EXCLUDE_PATTERN="$EXCLUDE_PATTERN -path ./$dir -prune -o"
done

# Build include pattern for find
INCLUDE_PATTERN=""
for pattern in "${FILE_PATTERNS[@]}"; do
    if [ -z "$INCLUDE_PATTERN" ]; then
        INCLUDE_PATTERN="-name '$pattern'"
    else
        INCLUDE_PATTERN="$INCLUDE_PATTERN -o -name '$pattern'"
    fi
done

echo -e "${GREEN}Step 1: Replacing content in files...${NC}"

# Function to perform replacements in a file
replace_in_file() {
    local file="$1"

    # Check if file exists and is readable
    if [ ! -f "$file" ] || [ ! -r "$file" ]; then
        return
    fi

    # Create temp file
    local temp_file=$(mktemp)

    # Perform all replacements (order matters - more specific patterns first)
    sed -e 's/Aero Code/Aero Work/g' \
        -e 's/aero code/aero work/g' \
        -e 's/AERO CODE/AERO WORK/g' \
        -e 's/aero-code/aero-work/g' \
        -e 's/AERO-CODE/AERO-WORK/g' \
        -e 's/aero_code/aero_work/g' \
        -e 's/AERO_CODE/AERO_WORK/g' \
        -e 's/AeroCode/AeroWork/g' \
        -e 's/aerocode/aerowork/g' \
        -e 's/AEROCODE/AEROWORK/g' \
        "$file" > "$temp_file"

    # Check if file changed
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo "  Updated: $file"
    else
        rm "$temp_file"
    fi
}

# Find and process all matching files (excluding build artifacts)
find . \( -path ./node_modules -o -path "*/target" -o -path ./.git -o -path ./dist -o -path ./dev-dist -o -path ./build -o -path ./.next \) -prune -o -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" -o -name "*.html" -o -name "*.css" -o -name "*.scss" -o -name "*.toml" -o -name "*.rs" -o -name "*.yaml" -o -name "*.yml" \) -print | while read -r file; do
    replace_in_file "$file"
done

echo ""
echo -e "${GREEN}Step 2: Checking for files/directories with 'aero' in name...${NC}"

# Find files/dirs with aero in name (excluding standard excludes)
files_to_rename=$(find . \( -path ./node_modules -o -path ./target -o -path ./.git -o -path ./dist -o -path ./dev-dist \) -prune -o \( -name "*aero-code*" -o -name "*aero_code*" -o -name "*AeroCode*" -o -name "*aerocode*" \) -print 2>/dev/null | grep -v "^$" || true)

if [ -n "$files_to_rename" ]; then
    echo "Files/directories to rename:"
    echo "$files_to_rename"
    echo ""
    echo -e "${YELLOW}Note: File renaming requires manual review. Please rename these files manually:${NC}"
    echo "$files_to_rename" | while read -r item; do
        if [ -n "$item" ]; then
            new_name=$(echo "$item" | sed -e 's/aero-code/aero-work/g' -e 's/aero_code/aero_work/g' -e 's/AeroCode/AeroWork/g' -e 's/aerocode/aerowork/g')
            echo "  $item → $new_name"
        fi
    done
else
    echo "  No files or directories need renaming."
fi

echo ""
echo -e "${GREEN}Step 3: Summary of changes...${NC}"

# Show what was changed
echo "Searching for remaining 'aero code' references..."
remaining=$(grep -r -i "aero.code" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.html" --include="*.toml" --include="*.rs" . 2>/dev/null | grep -v node_modules | grep -v target | grep -v ".git" || true)

if [ -n "$remaining" ]; then
    echo -e "${YELLOW}Warning: Some references may still exist:${NC}"
    echo "$remaining" | head -20
else
    echo -e "${GREEN}All 'Aero Code' references have been replaced with 'Aero Work'!${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the changes with: git diff"
echo "2. Run TypeScript check: bun run tsc --noEmit"
echo "3. Test the application: bun run dev"
echo "4. Commit the changes if everything looks good"
