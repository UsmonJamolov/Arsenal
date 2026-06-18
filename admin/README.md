# Arsenal Union — Admin Panel

Alohida Next.js loyiha. Foydalanuvchi ilovasi (`web`) dan mustaqil ishlaydi.

## Ishga tushirish

```bash
cd admin
npm install
npm run dev
```

- Admin panel: **http://localhost:3002**
- Login: **http://localhost:3002/login**
- API server: `http://localhost:4000` (proxy orqali `/api`)

## Default kirish

- Telefon: `+998901111111`
- Ism: `Admin`
- Familiya: `Union`
- Parol: `admin1234`
- Secret key: `arsenal-admin-secret` (`server/.env` dagi `ADMIN_SECRET_KEY`)

## Muhit o'zgaruvchilari

| O'zgaruvchi | Tavsif |
|-------------|--------|
| `NEXT_PUBLIC_USER_APP_URL` | Foydalanuvchi sayti (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | API manzili (bo'sh = Next proxy `/api`) |

Server `.env` da `CLIENT_ORIGIN` ga `http://localhost:3002` qo'shilgan bo'lishi kerak.
