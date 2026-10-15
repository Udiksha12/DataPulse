#!/usr/bin/env bash
# ==============================================================================
# DataPulse Native PostgreSQL Backup Script
# Course: BCSE302P Database Systems Lab | Slot: L25+L26
# Contributors:
#   - Udiksha Agarwal (24BAI0086) - Backend & Security
#   - Bakya (24BAI0071) - Frontend
#   - Rudra (24BKT0125) - Cloud Database
# ==============================================================================
set -euo pipefail

DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-datapulse}"
DB_NAME="${POSTGRES_DB:-datapulse}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${BACKUP_DIR}/datapulse_backup_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "=========================================================="
echo " Starting DataPulse Native PostgreSQL Backup (pg_dump)"
echo " Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT} as ${DB_USER}"
echo " Timestamp: $(date)"
echo " Contributor: Rudra (24BKT0125)"
echo "=========================================================="

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -F c -b -v -f "${BACKUP_FILE}"
elif command -v docker >/dev/null 2>&1; then
  echo "Using Docker Compose container for native pg_dump..."
  docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "${BACKUP_FILE}"
else
  echo "Error: Neither pg_dump nor docker is available in PATH." >&2
  exit 1
fi

echo "=========================================================="
echo " Backup successfully created: ${BACKUP_FILE}"
echo " File size: $(ls -lh "${BACKUP_FILE}" | awk '{print $5}')"
echo " Verification: pg_restore -l ${BACKUP_FILE} | head -n 15"
echo "=========================================================="
