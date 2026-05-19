# Arsenal Union — Windows stansiya agenti

Har bir PC/PS yonida ishlaydigan agent. Serverdan buyruqlarni oladi va stansiyani boshqaradi.

## O'rnatish (har bir kompyuterda)

1. [Node.js 18+](https://nodejs.org/) o'rnating
2. `config.example.json` ni `config.json` ga nusxalang
3. Sozlang:

```json
{
  "apiUrl": "http://192.168.1.10:4000/api",
  "stationId": "pc-01",
  "agentKey": "SERVERDAGI_AGENT_SECRET_BILAN_BIR_XIL"
}
```

4. Ishga tushiring:

```bash
cd agent
npm start
```

Windows xizmati sifatida: [NSSM](https://nssm.cc/) yoki Task Scheduler → `node C:\ArsenalUnion\agent\src\index.js`

## Buyruqlar

| Buyruq | Vazifa |
|--------|--------|
| `start_session` | PIN bilan bildirishnoma, sessiya fayli |
| `unlock` | Foydalanuvchi PIN kiritgach — sessiya boshlandi |
| `stop_session` | Vaqt tugadi — ekran qulfi |

## Billing integratsiyasi

Server `.env` da qurilma uchun:

- `billingProvider=custom` — faqat agent (default)
- `billingProvider=ggleap` — GGLeap API + agent
- `billingProvider=ccboot` — CCBoot API + agent

GGLeap/CCBoot API kalitlari bo'lmasa, avtomatik **custom agent** rejimiga tushadi.

## Xavfsizlik

- `AGENT_SECRET` ni kuchli qiling
- Agent faqat klub **mahalliy tarmog'ida** ishlasin
- Firewall: server portiga faqat LAN dan ruxsat
