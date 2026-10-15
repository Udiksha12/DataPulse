#!/usr/bin/env bash
# ==============================================================================
# DataPulse Native PostgreSQL Restore Script
# Course: BCSE302P Database Systems Lab | Slot: L25+L26
# Contributors:
#   - Udiksha Agarwal (24BAI0086) - Backend & Security
#   - Bakya (24BAI0071) - Frontend
#   - Rudra (24BKT0125) - Cloud Database
# ==============================================================================
set -euo pipefail

BACKUP_FILE="${1:-}"
if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_dump_file> [target_database_name]" >&2
  exit 1
fi

TARGET_DB="${2:-datapulse_restore}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-datapulse}"

echo "=========================================================="
echo " Starting DataPulse Native PostgreSQL Restore (pg_restore)"
echo " Source Backup: ${BACKUP_FILE}"
echo " Target Database: ${TARGET_DB} on ${DB_HOST}:${DB_PORT}"
echo " Timestamp: $(date)"
echo " Contributor: Rudra (24BKT0125)"
echo "=========================================================="

if command -v pg_restore >/dev/null 2>&1; then
  echo "Creating target database if it doesn't exist..."
  createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TARGET_DB}" || true

  echo "Restoring schema and data..."
  pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" --clean --if-exists -v "${BACKUP_FILE}"
elif command -v docker >/dev/null 2>&1; then
  echo "Using Docker Compose container for native pg_restore..."
  docker compose exec -T db sh -c "createdb -U \"\$POSTGRES_USER\" ${TARGET_DB}" || true
  docker compose exec -T db sh -c "pg_restore -U \"\$POSTGRES_USER\" -d ${TARGET_DB} --clean --if-exists -v" < "${BACKUP_FILE}"
else
  echo "Error: Neither pg_restore nor docker is available in PATH." >&2
  exit 1
fi

echo "=========================================================="
echo " Restore completed successfully into database '${TARGET_DB}'!"
echo " Verification query: SELECT count(*) FROM users;"
echo "=========================================================="
