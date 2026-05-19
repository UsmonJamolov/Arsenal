# Arsenal Union — ngrok tunnel (telefon + Telegram bot uchun)
# Oldin: https://dashboard.ngrok.com → authtoken oling
#   ngrok config add-authtoken YOUR_TOKEN

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "=== Arsenal Union ngrok ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Oldin ishga tushiring (2 ta terminal):" -ForegroundColor Yellow
Write-Host "  1) server:  cd server  && npm run dev"
Write-Host "  2) web:     cd web     && npm run dev"
Write-Host ""
Write-Host "Keyin shu skriptni qayta ishga tushiring." -ForegroundColor Yellow
Write-Host ""

$webOk = $false
try {
  $null = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
  $webOk = $true
} catch {
  Write-Host "XATO: Web (port 3000) ishlamayapti. Avval: cd web && npm run dev" -ForegroundColor Red
}

if (-not $webOk) {
  exit 1
}

Write-Host "ngrok ishga tushmoqda (port 3000)..." -ForegroundColor Green
Write-Host "Brauzerda http://127.0.0.1:4040 — tunnel manzilini ko'rasiz" -ForegroundColor Gray
Write-Host ""
Write-Host "Tunnel URL chiqqach, server/.env da yangilang:" -ForegroundColor Yellow
Write-Host "  PUBLIC_SITE_URL=https://XXXX.ngrok-free.app"
Write-Host "  CLIENT_ORIGIN=https://XXXX.ngrok-free.app"
Write-Host ""
Write-Host "Serverni qayta ishga tushiring (Ctrl+C, npm run dev)" -ForegroundColor Yellow
Write-Host "Telegram: @arsenalGC_bot → /start → Sayt tugmasi" -ForegroundColor Cyan
Write-Host ""

Set-Location $root
npx --yes ngrok@latest http 3000
