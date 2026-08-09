# HashRoom V2

Frontend Telegram Mini App using Supabase REST.

## Setup
1. Run `supabase.sql` once in Supabase SQL Editor.
2. Put your Telegram bot username in `referral.js` instead of `YOUR_BOT_USERNAME`.
3. Put your Telegram numeric ID in `admin.js` instead of `ADMIN_ID=0`.
4. Keep `index.html`, `script.js`, `firebase.js`, `style.css` and the new pages in the same GitHub Pages root.

## Flow
User -> chooses plan -> purchase request pending -> admin approves -> user gets `approved=true`, `mining=true` -> mining balance updates.

This is a prototype frontend. Do not use it for real-money custody without server-side validation, RLS and a trusted payment/webhook backend.
