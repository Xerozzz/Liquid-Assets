#!/usr/bin/env bash
#
# Nightly Postgres backup for the production deployment.
# Dumps the `db` container's database to a gzipped, timestamped file and keeps
# the 14 most recent. pg_dump runs inside the container over its local socket,
# so it needs no DB password (and is immune to any host-side env issues).
#
# Usage:   ./scripts/backup.sh
# Cron:    0 3 * * * GCS_BUCKET=gs://your-bucket $HOME/liquid-assets/scripts/backup.sh >> $HOME/backups/backup.log 2>&1
# Env:     BACKUP_DIR overrides the local output dir (default: $HOME/backups)
#          KEEP       how many local dumps to retain (default: 14)
#          GCS_BUCKET if set (e.g. gs://liquid-assets-backups), each dump is also
#                     copied off-site to Google Cloud Storage. On a GCE VM this
#                     needs no credentials — the instance service account is used
#                     automatically. Expire old off-site copies with a bucket
#                     lifecycle rule rather than here. Set up once; see docs/DEPLOYMENT.md.
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

# Rotate: keep only the newest $KEEP local dumps.
ls -1t "$DIR"/liquid_assets-*.sql.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm --

echo "$(date '+%Y-%m-%d %H:%M:%S') backup ok: ${FILE}.gz"

# Off-site copy to Google Cloud Storage (optional — only if GCS_BUCKET is set).
# A local-disk-only backup dies with the VM; this puts a copy in a separate
# failure domain. Failures here are logged but don't fail the whole backup.
if [ -n "${GCS_BUCKET:-}" ]; then
  if gcloud storage cp "${FILE}.gz" "${GCS_BUCKET%/}/" >/dev/null 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') off-site ok: ${GCS_BUCKET%/}/$(basename "${FILE}.gz")"
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S') WARNING: off-site upload to ${GCS_BUCKET} failed (gcloud installed & bucket writable?)" >&2
  fi
fi
