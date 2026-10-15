# ==============================================================================
# DataPulse Native PostgreSQL Backup Script (PowerShell for Windows)
# Course: BCSE302P Database Systems Lab | Slot: L25+L26
# Contributors:
#   - Udiksha Agarwal (24BAI0086) - Backend & Security
#   - Bakya (24BAI0071) - Frontend
#   - Rudra (24BKT0125) - Cloud Database
# ==============================================================================
param (
    [string]$HostName = "localhost",
    [int]$Port = 5432,
    [string]$User = "datapulse",
    [string]$Database = "datapulse",
    [string]$OutputDir = "./backups"
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

if (!(Test-Path -Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$backupFile = Join-Path $OutputDir "datapulse_backup_$timestamp.dump"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting DataPulse Native PostgreSQL Backup (pg_dump)" -ForegroundColor Green
Write-Host " Database: $Database on ${HostName}:${Port} as $User"
Write-Host " Timestamp: $(Get-Date)"
Write-Host " Contributor: Rudra (24BKT0125)"
Write-Host "==========================================================" -ForegroundColor Cyan

if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    & pg_dump -h $HostName -p $Port -U $User -d $Database -F c -b -v -f $backupFile
} elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Using Docker container to run native pg_dump..."
    & docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > $backupFile
} else {
    Write-Warning "pg_dump is not in PATH. Ensure PostgreSQL client tools are installed or use Cloud Database native backup (e.g. Supabase / Neon / Railway dashboard)."
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Backup successfully created: $backupFile" -ForegroundColor Green
Write-Host " Size: $((Get-Item $backupFile).Length / 1KB) KB"
Write-Host "==========================================================" -ForegroundColor Cyan
