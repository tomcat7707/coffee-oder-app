param(
    [string]$PsqlPath = "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"
)

$ErrorActionPreference = 'Stop'

function Write-Step($message) {
    Write-Host "[reset-db] $message"
}

$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = Join-Path $rootPath ".env"
$defaults = @{
    DB_HOST = "localhost"
    DB_PORT = "5432"
    DB_NAME = "coffee_order_db"
    DB_USER = "postgres"
    DB_PASSWORD = ""
}

if (Test-Path $envFile) {
    Write-Step "Loading configuration from .env"
    Get-Content $envFile | ForEach-Object {
        if (-not $_ -or $_.StartsWith('#')) { return }
        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            if ($defaults.ContainsKey($key)) {
                $defaults[$key] = $value
            }
        }
    }
} else {
    Write-Step ".env not found, falling back to defaults"
}

$schemaPath = Join-Path $rootPath "database\schema.sql"
$seedPath = Join-Path $rootPath "database\seed.sql"

if (-not (Test-Path $schemaPath)) { throw "schema.sql not found at $schemaPath" }
if (-not (Test-Path $seedPath)) { throw "seed.sql not found at $seedPath" }
if (-not (Test-Path $PsqlPath)) { throw "psql executable not found at $PsqlPath" }

$env:PGPASSWORD = $defaults.DB_PASSWORD
$env:PGCLIENTENCODING = "UTF8"

$commonArgs = @(
    "-h", $defaults.DB_HOST,
    "-p", $defaults.DB_PORT,
    "-U", $defaults.DB_USER,
    "-d", $defaults.DB_NAME
)

Write-Step "Recreating schema in $($defaults.DB_NAME)"
& $PsqlPath @commonArgs -f $schemaPath
if ($LASTEXITCODE -ne 0) { throw "Schema load failed with exit code $LASTEXITCODE" }

Write-Step "Seeding baseline data"
& $PsqlPath @commonArgs -f $seedPath
if ($LASTEXITCODE -ne 0) { throw "Seed load failed with exit code $LASTEXITCODE" }

Write-Step "Database reset complete"
