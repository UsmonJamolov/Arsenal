# Cloudflare tunnel yangi URL ni server/.env ga yozadi
# Ishlatish: .\scripts\update-cloudflare-url.ps1 "https://XXXX.trycloudflare.com"

param(
  [Parameter(Mandatory = $true)]
  [string]$Url
)

$Url = $Url.TrimEnd("/")
$envFile = Join-Path $PSScriptRoot "..\server\.env"

if (-not (Test-Path $envFile)) {
  Write-Host "Xato: server\.env topilmadi" -ForegroundColor Red
  exit 1
}

$content = Get-Content $envFile -Raw
$content = $content -replace "CLIENT_ORIGIN=.*", "CLIENT_ORIGIN=$Url"
$content = $content -replace "PUBLIC_SITE_URL=.*", "PUBLIC_SITE_URL=$Url"
Set-Content -Path $envFile -Value $content.TrimEnd() -NoNewline
Add-Content -Path $envFile -Value ""

Write-Host "Yangilandi:" -ForegroundColor Green
Write-Host "  CLIENT_ORIGIN=$Url"
Write-Host "  PUBLIC_SITE_URL=$Url"
Write-Host ""
Write-Host "Keyin server terminalida Ctrl+C va: npm run dev" -ForegroundColor Yellow
