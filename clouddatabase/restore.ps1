# ==============================================================================
# DataPulse Native PostgreSQL Restore Script (PowerShell for Windows)
# Course: BCSE302P Database Systems Lab | Slot: L25+L26
# Contributors:
#   - Udiksha Agarwal (24BAI0086) - Backend & Security
#   - Bakya (24BAI0071) - Frontend
#   - Rudra (24BKT0125) - Cloud Database
# ==============================================================================
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$TargetDatabase = "datapulse_restore",
    [string]$HostName = "localhost",
    [int]$Port = 5432,
    [string]$User = "datapulse"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path -Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting DataPulse Native PostgreSQL Restore (pg_restore)" -ForegroundColor Green
Write-Host " Source Backup: $BackupFile"
Write-Host " Target DB: $TargetDatabase on ${HostName}:${Port}"
Write-Host " Timestamp: $(Get-Date)"
Write-Host " Contributor: Rudra (24BKT0125)"
Write-Host "==========================================================" -ForegroundColor Cyan

if (Get-Command pg_restore -ErrorAction SilentlyContinue) {
    if (Get-Command createdb -ErrorAction SilentlyContinue) {
        & createdb -h $HostName -p $Port -U $User $TargetDatabase 2>$null
    }
    & pg_restore -h $HostName -p $Port -U $User -d $TargetDatabase --clean --if-exists -v $BackupFile
} elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Using Docker container to run native pg_restore..."
    & docker compose exec -T db sh -c "createdb -U `"\$POSTGRES_USER`" $TargetDatabase" 2>$null
    Get-Content $BackupFile -Raw | & docker compose exec -T db sh -c "pg_restore -U `"\$POSTGRES_USER`" -d $TargetDatabase --clean --if-exists -v"
} else {
    Write-Warning "pg_restore is not in PATH. Ensure PostgreSQL client tools are installed or use Cloud Database native restore."
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Restore completed successfully into '$TargetDatabase'!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
