# CLAUDE.md — content-calendar-lp

## Deploy

### Google Apps Script
```bash
./deploy-gas.sh
```
- Push code lên GAS + deploy deployment ID cố định
- Deployment URL: `https://script.google.com/macros/s/AKfycbwaNGURto97SUbYk6tXUCndsiuglGsjIU1mKFF6Iz3sn_xUkBluwrUMCpUyg_NRPnNm/exec`
- File deployed: `gas/Code.js` (source để review: `GAS_CODE.js`)

### Vercel (frontend + API routes)
Project đang dùng **Vercel** — `.vercel/project.json` đã linked.
- projectId: `prj_9k0o5dhmfHkkqhHelHcyOOFjghYK`
- orgId: `team_kiX0xuYe6UCSPVlR0zYO33an`

Deploy:
```bash
~/.npm-global/bin/vercel --prod --yes
```

- CLI ở `~/.npm-global/bin/vercel` (v53+), đã login sẵn account `khaikhoinghiep-4133`
- Project đã linked (`.vercel/project.json`), không cần cấu hình thêm
- Production domain: `https://onetriponebite.com`

## Webhook SePay

- SePay gọi vào: `POST /api/webhook` (Vercel function)
- Vercel forward sang GAS bằng **POST** với body `{ action: 'sepay_webhook', ...payload }`
- GAS `doPost()` → `handleSepayWebhook(body)`
- Field nội dung CK từ MBBank: `content` (KHÔNG phải `transferContent`)

## Stack

- Frontend: `index.html` (single file, vanilla JS)
- API: `api/` (Vercel serverless functions)
- Backend logic: Google Apps Script (`gas/Code.js`)
- Payment: SePay (bank transfer) + PayPal

## Marketing & Lead Magnet Guidelines

- **Default to Private Offline Drafts**: Any new marketing materials, campaign assets, cheatsheets, or lead magnets (e.g. PDFs, HTML drafts, copy kits) must be created as local offline draft files (in the parent workspace directory `/Users/bmtong/Desktop/One Trip One Bite Landing Page/`) rather than within the public landing page directory.
- **Explicit Permission Required**: Do not commit new lead magnets to the public project assets folder or integrate them into the landing page code (e.g. form handlers, checkout buttons, email automation) without explicit request and prompt instruction from the user.

