#!/bin/bash

# Schema Cleanup Migration Script
# Executes all cleanup migrations in order

set -e

echo "=================================="
echo "Schema Cleanup Migration Execution"
echo "=================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found."
    echo ""
    echo "To execute these migrations, you have two options:"
    echo ""
    echo "Option 1: Install Supabase CLI and run migrations automatically"
    echo "  $ brew install supabase/tap/supabase"
    echo "  $ supabase link --project-ref jajbtwgbhrkvgxvvruaa"
    echo "  $ supabase db push"
    echo ""
    echo "Option 2: Execute migrations manually in Supabase SQL Editor"
    echo "  1. Go to: https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa/sql"
    echo "  2. Copy and paste each migration file in order:"
    echo "     - supabase/migrations/20251227_schema_cleanup_01_indexes.sql"
    echo "     - supabase/migrations/20251227_schema_cleanup_02_drop_unused.sql"
    echo "     - supabase/migrations/20251227_schema_cleanup_03_enum_constraints.sql"
    echo "     - supabase/migrations/20251227_schema_cleanup_04_optimize.sql"
    echo "  3. Run each migration and verify success"
    echo ""
    exit 1
fi

# Supabase CLI is available - check if linked
if [ ! -f .supabase/config.toml ]; then
    echo "⚠️  Project not linked to Supabase"
    echo ""
    echo "Please link your project first:"
    echo "  $ supabase link --project-ref jajbtwgbhrkvgxvvruaa"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo "✅ Project linked"
echo ""

# Get project info
PROJECT_REF=$(grep 'project_id' .supabase/config.toml | cut -d'"' -f2)
echo "Target Project: $PROJECT_REF"
echo ""

# Execute migrations
echo "Executing migrations..."
echo ""

MIGRATIONS=(
  "20251227_schema_cleanup_01_indexes.sql"
  "20251227_schema_cleanup_02_drop_unused.sql"
  "20251227_schema_cleanup_03_enum_constraints.sql"
  "20251227_schema_cleanup_04_optimize.sql"
)

SUCCESS_COUNT=0
FAIL_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    echo "────────────────────────────────────────"
    echo "Migration: $migration"
    echo "────────────────────────────────────────"

    if supabase db execute --file "supabase/migrations/$migration"; then
        echo "✅ SUCCESS"
        ((SUCCESS_COUNT++))
    else
        echo "❌ FAILED"
        ((FAIL_COUNT++))
    fi
    echo ""
done

# Summary
echo "========================================"
echo "MIGRATION SUMMARY"
echo "========================================"
echo ""
echo "Successful: $SUCCESS_COUNT"
echo "Failed:     $FAIL_COUNT"
echo "Total:      ${#MIGRATIONS[@]}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All migrations completed successfully!"
    exit 0
else
    echo "⚠️  Some migrations failed. Please review the errors above."
    exit 1
fi
