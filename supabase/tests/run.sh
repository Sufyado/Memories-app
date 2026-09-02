#!/usr/bin/env bash
# Applies the real migrations plus the local-only auth/grants stubs to a
# throwaway Postgres database and runs the RLS scenario checks against it.
# Requires a local Postgres server (not Supabase) — this never touches your
# actual Supabase project. Useful after any schema/RLS change.
#
# Usage: supabase/tests/run.sh [database_name]

set -euo pipefail

DB_NAME="${1:-vistoria_test}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../migrations"

dropdb --if-exists "$DB_NAME"
createdb "$DB_NAME"

psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$SCRIPT_DIR/stub_auth.sql"

for migration in "$MIGRATIONS_DIR"/*.sql; do
  echo "Applying $(basename "$migration")..."
  psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$migration"
done

psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$SCRIPT_DIR/stub_grants.sql"

echo "Running RLS scenario checks..."
psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$SCRIPT_DIR/scenarios.sql"

dropdb "$DB_NAME"
echo "OK: migrations applied cleanly and all RLS scenario checks passed."
