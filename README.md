# WhatsApp Integration Platform — Project Documentation & Handover
*Engineered by SaNDS Lab Middle East W.L.L.*

---

## 📌 Project Status Snapshot (All Working & Verified)
- **Live Production URL:** `https://whatsapp.sandslab.com`
- **GitHub Repository:** `https://github.com/ajitsands/whatsapp.git` (`branch: main`)
- **PHP Compatibility:** PHP 7.4+ compatible (with polyfills in `config/db.php`)
- **Frontend Stack:** React 18 (transpiled bundle `assets/js/app.compiled.js` via `esbuild`)

---

## 🔑 Live Environment & Meta Configuration

### 1. Database Credentials (cPanel MySQL)
- **Host:** `localhost` / `127.0.0.1`
- **Database:** `sandsl23_whatsapp_db`
- **Username:** `sandsl23_whatsapp_user`
- **Password:** `S@nds1@b`

### 2. Meta WhatsApp Cloud API (Active & Connected)
- **Meta App ID:** `1349896969221097`
- **Phone Number ID:** `347848611735147`
- **Sender Phone Number:** `+91 99954 89008`
- **WhatsApp Business Account ID (WABA):** `313160575215815`
- **Webhook Callback URL:** `https://whatsapp.sandslab.com/api/webhook.php`
- **Webhook Verify Token:** `sands_uniglobal_wh_verify_token_2026`
- **Subscribed Webhook Field:** `messages`

---

## 🚀 Key Features Implemented & Working

1. **Live Meta WhatsApp Cloud API Dispatch:**
   - Supports Media Headers (`IMAGE`, `DOCUMENT`, `VIDEO`, `NONE`).
   - Supports both **Named Parameters** (`{{customer_name}}`, `{{contact_number}}`) and **Positional Parameters** (`{{1}}`, `{{2}}`).
   - Verified end-to-end delivery to recipient `+97335078079`.

2. **Real-Time Live Status Updates (No Refresh Needed):**
   - Telemetry log screen (`#logs`) automatically polls every 2.5s with a visual `🟢 Live Auto-Sync Active` indicator.
   - Status updates in real-time: `QUEUED` ➔ `✓ SENT` ➔ `✓✓ DELIVERED` ➔ `✓✓ READ`.
   - Webhook processor (`api/webhook.php`) captures live delivery & read receipts from Meta.

3. **Session & Tab State Persistence:**
   - Navigating or refreshing the browser stays on the exact active page (`#composer`, `#logs`, `#templates`, `#settings`, etc.) without kicking back to login.

4. **1-Click Role-Based Demo Logins & RBAC:**
   - **Superadmin:** `superadmin@sandslab.com` / `Password@123`
   - **Admin:** `admin@uniglobal.bh` / `Password@123`
   - **Standard User:** `user@uniglobal.bh` / `Password@123`

5. **Bahrain (BHD) Market Tariff Engine:**
   - Live pricing calculation per category (Utility, Authentication, Marketing, Service).

---

## 🛠️ Local Development & Build Commands

### Run Local Development Server:
```powershell
php -S localhost:8000 -t "e:\integration_with oodu_document\whatsapp"
```

### Recompile Frontend React Code:
```powershell
npx esbuild assets/js/app.js --outfile=assets/js/app.compiled.js --loader:.js=jsx
```

### Push Updates to GitHub:
```powershell
git add .
git commit -m "Update documentation"
git push origin main
```
