#!/bin/bash
# =============================================================================
# 🚨 HARDCODING DETECTOR - Blocks commits with forbidden patterns
# =============================================================================
# This script is run by pre-commit hook to prevent hardcoded values.
# Add new patterns to FORBIDDEN_PATTERNS array as needed.
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Files to check (staged files or all source files)
if [ "$1" == "--staged" ]; then
    FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
else
    FILES=$(find src public -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null | grep -v node_modules | grep -v dist || true)
fi

if [ -z "$FILES" ]; then
    echo -e "${GREEN}✅ No files to check${NC}"
    exit 0
fi

# =============================================================================
# 🚫 FORBIDDEN PATTERNS - Add new patterns here
# =============================================================================
# Format: "pattern|description|allowed_files"
# - pattern: regex to search for
# - description: error message
# - allowed_files: comma-separated list of files where pattern IS allowed (or "NONE")
# =============================================================================

FORBIDDEN_PATTERNS=(
    # Domain hardcoding
    "app\.igpglass\.ca|Hardcoded IGP domain - use window.location or system_settings|src/config/branding.ts,BIBLE.md,docs/"
    "igpglass\.com|Hardcoded IGP domain - use window.location or system_settings|src/config/branding.ts"
    
    # Client-specific (allowed in comments/docs)
    "IGP Glass|Hardcoded client name - use window.APP_COMPANY_NAME or system_settings|src/config/branding.ts"
    "IGP-PDE|Hardcoded ticket prefix - should be dynamic per tenant|UserGuideModal"
    
    # Emails
    "admin@igpglass|Hardcoded IGP email|NONE"
    
    # API keys (security)
    "sk-[a-zA-Z0-9]{20,}|Possible exposed API key|NONE"
    "AKIA[A-Z0-9]{16}|Possible AWS key|NONE"
)

ERRORS_FOUND=0
WARNINGS_FOUND=0

echo -e "${YELLOW}🔍 Checking for hardcoded values...${NC}"
echo ""

for pattern_entry in "${FORBIDDEN_PATTERNS[@]}"; do
    IFS='|' read -r pattern description allowed_files <<< "$pattern_entry"
    
    for file in $FILES; do
        # Skip if file is in allowed list
        if [ "$allowed_files" != "NONE" ]; then
            skip=false
            IFS=',' read -ra ALLOWED <<< "$allowed_files"
            for allowed in "${ALLOWED[@]}"; do
                if [[ "$file" == *"$allowed"* ]]; then
                    skip=true
                    break
                fi
            done
            if $skip; then
                continue
            fi
        fi
        
        # Search for pattern
        matches=$(grep -n -E "$pattern" "$file" 2>/dev/null || true)
        if [ -n "$matches" ]; then
            echo -e "${RED}❌ FORBIDDEN PATTERN in $file${NC}"
            echo -e "   Pattern: ${YELLOW}$pattern${NC}"
            echo -e "   Reason: $description"
            echo "$matches" | while read -r line; do
                echo -e "   ${RED}→ $line${NC}"
            done
            echo ""
            ERRORS_FOUND=$((ERRORS_FOUND + 1))
        fi
    done
done

echo ""
if [ $ERRORS_FOUND -gt 0 ]; then
    echo -e "${RED}══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}🚨 COMMIT BLOCKED: $ERRORS_FOUND hardcoding violation(s) found${NC}"
    echo -e "${RED}══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "📖 See src/config/branding.ts for the correct approach"
    echo -e "📖 See BIBLE.md MODULE 10 for hardcoding rules"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ No hardcoding violations found${NC}"
    exit 0
fi
