# Update .env file with Vercel deployment URL
# Usage: .\scripts\updateEnvWithVercelUrl.ps1 -Url "https://your-app.vercel.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$Url
)

$envPath = Join-Path $PSScriptRoot "..\.env"

# Remove trailing slash
$Url = $Url.TrimEnd('/')

Write-Host "Updating .env file with Vercel URL: $Url" -ForegroundColor Cyan

# Read existing .env content
$envContent = ""
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
}

# Remove existing FSANZ URLs
$envContent = $envContent -replace "EXPO_PUBLIC_FSANZ_AU_URL=.*\r?\n", ""
$envContent = $envContent -replace "EXPO_PUBLIC_FSANZ_NZ_URL=.*\r?\n", ""

# Add new FSANZ URLs
$envContent += "`n# FSANZ Database URLs (auto-configured)`n"
$envContent += "EXPO_PUBLIC_FSANZ_AU_URL=$Url/api/fsanz-database?country=au`n"
$envContent += "EXPO_PUBLIC_FSANZ_NZ_URL=$Url/api/fsanz-database?country=nz`n"

# Write back to .env
Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Added URLs:" -ForegroundColor Cyan
Write-Host "  EXPO_PUBLIC_FSANZ_AU_URL=$Url/api/fsanz-database?country=au" -ForegroundColor Gray
Write-Host "  EXPO_PUBLIC_FSANZ_NZ_URL=$Url/api/fsanz-database?country=nz" -ForegroundColor Gray

















