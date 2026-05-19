# ngrok ishlayotganda (http://127.0.0.1:4040) tunnel URL ni .env ga yozadi
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

try {
  $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
} catch {
  Write-Host "ngrok ishlamayapti. Avval: .\scripts\start-ngrok.ps1" -ForegroundColor Red
  exit 1
}

$publicUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
if (-not $publicUrl) {
  $publicUrl = ($tunnels.tunnels | Select-Object -First 1).public_url
}

if (-not $publicUrl) {
  Write-Host "Tunnel topilmadi." -ForegroundColor Red
  exit 1
}

Write-Host "Tunnel: $publicUrl" -ForegroundColor Green

$envPath = Join-Path $root "server\.env"
$content = Get-Content $envPath -Raw

if ($content -match "PUBLIC_SITE_URL=.*") {
  $content = $content -replace "PUBLIC_SITE_URL=.*", "PUBLIC_SITE_URL=$publicUrl"
} else {
  $content += "`nPUBLIC_SITE_URL=$publicUrl"
}

if ($content -match "CLIENT_ORIGIN=.*") {
  $content = $content -replace "CLIENT_ORIGIN=.*", "CLIENT_ORIGIN=$publicUrl"
} else {
  $content += "`nCLIENT_ORIGIN=$publicUrl"
}

Set-Content -Path $envPath -Value $content.TrimEnd() -NoNewline
Add-Content -Path $envPath -Value ""

Write-Host "server/.env yangilandi. Serverni qayta ishga tushiring!" -ForegroundColor Yellow
