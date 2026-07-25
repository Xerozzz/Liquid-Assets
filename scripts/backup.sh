#!/usr/bin/env bash
#
# Nightly Postgres backup for the production deployment.
# Dumps the `db` container's database to a gzipped, timestamped file and keeps
# the 14 most recent. pg_dump runs inside the container over its local socket,
# so it needs no DB password (and is immune to any host-side env issues).
#
# Usage:   ./scripts/backup.sh
# Cron:    0 3 * * * $HOME/liquid-assets/scripts/backup.sh >> $HOME/backups/backup.log 2>&1
# Env:     BACKUP_DIR overrides the output dir (default: $HOME/backups)
#          KEEP overrides how many backups to retain (default: 14)
set -euo pipefail

# Resolve the repo root from this script's own location, so it works no matter
# where the repo is cloned or which directory cron runs it from.
REPO_DIR="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
cd "$REPO_DIR"

DIR="${BACKUP_DIR:-$HOME/backups}"
KEEP="${KEEP:-14}"
mkdir -p "$DIR"

FILE="$DIR/liquid_assets-$(date +%Y%m%d-%H%M%S).sql"
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres --clean --if-exists liquid_assets > "$FILE"
gzip "$FILE"

# Rotate: keep only the newest $KEEP dumps.
ls -1t "$DIR"/liquid_assets-*.sql.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm --

echo "$(date '+%Y-%m-%d %H:%M:%S') backup ok: ${FILE}.gz"
