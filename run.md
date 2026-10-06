# WhatsApp Integration Platform — Project Handover & Resume Guide
*Engineered by SaNDS Lab Middle East W.L.L.*

---

## 📌 Development Checkpoint & Milestone Snapshot (All Verified & Tested)
- **Checkpoint Timestamp:** `2026-10-06 14:10:00 (Local Time)`
- **Live Production URL:** `https://whatsapp.sandslab.com`
- **GitHub Repository:** `https://github.com/ajitsands/whatsapp.git` (`branch: main`)
- **Latest Commit Hash:** `e89c45b` (`origin/main` is clean & up to date)
- **PHP Compatibility:** PHP 7.4+ compatible (with custom polyfills in `config/db.php`)
- **Frontend Stack:** React 18 (Standalone transpiled bundle `assets/js/app.compiled.js` via `esbuild`)

---

## 🚀 Key Features Implemented in Current Build

1. **Enterprise DataTables with Default Descending Sort (`DESC`):**
   - Message Telemetry (`#logs`), Financial Statements & Wallet Ledger (`#wallet`), Templates (`#templates`), API Keys, and User Accounts all automatically sort newest/latest records first (`DESC`).
   - Reusable `<DataTable>` component supports dynamic field sorting, instant search, page size selection, and CSV export.

2. **Developer API Hub & Multi-Language Connectors:**
   - Interactive code generator with 1-click language switcher for **Python (Odoo Automated Actions)**, **PHP**, **cURL**, **.NET (C#)**, and **Node.js**.
   - API Tester with layout-contained grid (`.api-hub-grid`) preventing overflow on JSON response execution.

3. **Dual Charging Engine (Superadmin Selectable):**
   - **Option A (Standard Per-Message):** Debits full Meta Cost + Platform Margin on every single dispatch.
   - **Option B (Meta 24-Hour Session Deduplication):** 1st message debited full tariff; subsequent messages to same contact/category within 24h waive Meta Cost (`0.0000 BHD`) and only debit platform margin.
   - Real-time detection and audit tagging in transaction records.

4. **Strict Superadmin RBAC Security:**
   - **Tariff & Pricing Engine:** Superadmin edit-only. Admins have a read-only view with lock banners.
   - **Meta WhatsApp Business Cloud API Credentials:** Superadmin edit-only. Admins have a read-only view with disabled inputs.
   - **Backend API Security:** `api/settings.php` strips restricted fields server-side if submitted by non-superadmins.

5. **Prepaid Wallet & Financial Audit Ledger:**
   - Multi-currency support (BHD 3 decimals, SAR, AED, KWD, QAR, OMR, INR, USD).
   - Superadmin Top-Up modal with automatic ledger debiting and balance management.
   - Custom delete confirmation modal with automated balance adjustments.

6. **Live Meta WhatsApp Cloud API Dispatch & Webhooks:**
   - Verified end-to-end delivery with media headers and named/positional parameters.
   - Real-time polling telemetry (every 2.5s) and webhook delivery/read receipts (`api/webhook.php`).

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

### 3. User Accounts (RBAC)
- **Superadmin:** `superadmin@sandslab.com` / `Password@123`
- **Admin:** `admin@uniglobal.bh` / `Password@123`
- **Standard User:** `user@uniglobal.bh` / `Password@123`

---

## 🛠️ Local Development & Build Commands

### 1. Run Local PHP Server:
```powershell
php -S localhost:8000 -t "e:\integration_with oodu_document\whatsapp"
```

### 2. Recompile React Bundle (After modifying `assets/js/app.js`):
```powershell
cd "e:\integration_with oodu_document\whatsapp"
npx -y esbuild assets/js/app.js --outfile=assets/js/app.compiled.js --loader:.js=jsx
```

### 3. Push Updates to GitHub:
```powershell
cd "e:\integration_with oodu_document\whatsapp"
git add .
git commit -m "Your update description"
git push origin main
```

---

## 📋 Next Development Tasks (Resume Checklist)
1. **Odoo ERP Automated Action Webhook & Model Sync:**
   - Inbound triggers for automated invoice generation, payment receipt dispatch, and order status notifications.
2. **Bulk Campaign Broadcasts:**
   - CSV contact list upload with variable mapping and scheduled queue pacing (e.g. 50 msgs/min).
3. **Inbound Live Chat & Agent Inbox:**
   - Interactive two-way conversation window allowing support agents to reply directly within the 24-hour customer care session window.
