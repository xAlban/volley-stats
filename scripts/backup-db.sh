#!/usr/bin/env bash
# ---- Full local backup of the Supabase database (schema + data) ----
# ---- Requires pg_dump (brew install libpq) and SUPABASE_DB_URL: the
#      "Session pooler" connection string from Supabase dashboard → Connect.
#      Put it in .env.backup (gitignored) or export it before running. ----
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env.backup ] && set -a && . ./.env.backup && set +a

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "SUPABASE_DB_URL is not set (see header of this script)" >&2
  exit 1
fi

PG_DUMP="$(command -v pg_dump || echo /home/linuxbrew/.linuxbrew/opt/libpq/bin/pg_dump)"
OUT_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$OUT_DIR/volley-stats-$STAMP.dump"

# ---- Custom format: compressed, restorable table by table with pg_restore ----
"$PG_DUMP" "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges \
  --schema=public --file="$FILE"

echo "Backup written to $FILE"
echo "Restore everything: pg_restore --clean --if-exists --no-owner -d \"\$SUPABASE_DB_URL\" $FILE"
echo "Restore one table:  pg_restore --data-only -t stats -d \"\$SUPABASE_DB_URL\" $FILE"
