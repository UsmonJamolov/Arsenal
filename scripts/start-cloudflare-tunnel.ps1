# Cloudflare Tunnel — ngrok authtoken kerak emas
# Oldin: server (4000) va web (3000) ishga tushiring

$ErrorActionPreference = "Stop"

Write-Host "=== Cloudflare Tunnel (port 3000) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL chiqgach, server/.env da yangilang:" -ForegroundColor Yellow
Write-Host "  PUBLIC_SITE_URL=https://XXXX.trycloudflare.com"
Write-Host "  CLIENT_ORIGIN=https://XXXX.trycloudflare.com"
Write-Host ""
Write-Host "Yoki: .\scripts\update-cloudflare-url.ps1 (URL ni qo'lda kiriting)" -ForegroundColor Gray
Write-Host ""
Write-Host "Keyin web terminalida Ctrl+C va: cd web; npm run dev" -ForegroundColor Yellow
Write-Host "(trycloudflare.com uchun next.config qayta ishga tushirish)" -ForegroundColor Gray
Write-Host ""

npx --yes cloudflared@latest tunnel --url http://127.0.0.1:3000
