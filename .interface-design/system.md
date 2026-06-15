# Arsenal Union — Arena Ops Design System

## Intent
- **Who:** 16–28 yosh o'yinchilar, telefondan PS/PC bron qiladi
- **Goal:** Bo'sh stansiyani topish, bron qilish, to'lash, PIN olish
- **Feel:** Premium esports lounge — ishonchli to'lov + arena energiyasi

## Signature
- PS zona → cyan accent, PC zona → magenta accent
- PIN va narxlar → monospace tabular-nums
- Status ranglari: yashil (bo'sh), qizil (band), oltin (bron)

## Tokens
- Base unit: 8px
- Depth: borders-only + surface elevation
- Typography: Geist Sans (UI), Geist Mono (data)
- Theme: dark arena navy (not pure black)

## Palette
| Token | Use |
|-------|-----|
| `--brand-cyan` | PS zone, live, primary CTA |
| `--brand-magenta` | PC zone, selections |
| `--brand-gold` | Arsenal brand, admin |
| `--status-*` | Device/table states |

## Components
- Cards: `surface-card` — raised surface, subtle border
- Buttons: solid brand fill, no heavy glow
- Badges: semantic status colors
- Inputs: dark surface, cyan focus ring
