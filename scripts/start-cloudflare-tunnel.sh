#!/usr/bin/env bash
# Git Bash / Linux — Cloudflare tunnel (ngrok tokensiz)
echo "=== Cloudflare Tunnel (port 3000) ==="
echo ""
echo "URL chiqgach server/.env da yangilang:"
echo "  PUBLIC_SITE_URL=https://XXXX.trycloudflare.com"
echo "  CLIENT_ORIGIN=https://XXXX.trycloudflare.com"
echo ""
echo "Keyin web terminalida Ctrl+C va qayta: cd web, npm run dev"
echo "URL ni .env ga yozish:"
echo "  powershell -File scripts/update-cloudflare-url.ps1 \"https://XXXX.trycloudflare.com\""
echo ""
# Windows: localhost ba'zan [::1] ga ketadi — web o'chadi deb ko'rinadi
npx --yes cloudflared@latest tunnel --url http://127.0.0.1:3000
