# WhatsApp Integration Platform — Project Handover & Resume Guide
*Engineered by SaNDS Lab Middle East W.L.L.*

---

## 📌 Development Checkpoint & Milestone Snapshot (All Verified & Tested)
- **Checkpoint Timestamp:** `2026-10-13 00:41:00 (Local Time)`
- **Active Platform Generation:** `Version 2.1.0` (Inbound Live Chat & Two-Way Agent Inbox Released & Live)
- **Locked Baseline Milestone:** `Version 1.0.0` (Permanently locked in Git with tags `v1.0.0` & `v1.0` on commit `9dd6ebc`)
- **Live Production URL:** `https://whatsapp.sandslab.com`
- **GitHub Repository:** `https://github.com/ajitsands/whatsapp.git` (`branch: main`)
- **PHP Compatibility:** PHP 7.4+ compatible (with custom polyfills in `config/db.php`)
- **Frontend Stack:** React 18 (Standalone transpiled bundle `assets/js/app.compiled.js` via `esbuild`)

---

## 🚀 Key Features Implemented in Version 2.1.0

1. **Inbound Live Chat & Two-Way Agent Inbox (`#inbox`):**
   - Full two-column desktop workspace inspired by WhatsApp Web and enterprise customer service consoles.
   - Contact threads list with instant search, unread badge counters, and filter chips (`All`, `Unread`, `24h Active 🟢`).
   - Chronological message stream with custom WhatsApp chat bubbles, delivery/read tick indicators (`✓`, `✓✓`, blue read ticks), and media attachment badges.

2. **Official Meta 24-Hour Customer Care Session Window Engine:**
   - Real-time countdown tracking of customer service window (`🟢 24h Window Active (X.X hrs left) • Free-Text Allowed (Meta Fee Waived)`).
   - Dynamic restriction banner when 24h window expires (`⚠️ 24h Session Closed • Pre-Approved Template Required`).
   - Seamless 1-click fallback template selector when the 24-hour window has expired.

3. **Agent Productivity Tools:**
   - Canned Quick Replies toolbar (`👋 Support Greeting`, `📄 Reviewing Inquiry`, `✅ Payment Confirmed`, `🙏 Resolution Closing`) for 1-click response injection.
   - Interactive Inbound Message Simulator (`api/inbox.php?action=simulate_inbound`) for instant end-to-end testing of customer incoming replies.

4. **Dedicated Backend API (`api/inbox.php`):**
   - Endpoints for `threads`, `messages`, `send_reply`, `mark_read`, `simulate_inbound`, and `canned_replies`.

---

## 🔒 Version 1.0 Milestone (Locked Baseline)

All Version 1.0 features have been thoroughly verified, tested, and locked in Git:

1. **Enterprise DataTables with Default Descending Sort (`DESC`):**
   - Message Telemetry (`#logs`), Financial Statements & Wallet Ledger (`#wallet`), Templates (`#templates`), API Keys, and User Accounts all automatically sort newest/latest records first (`DESC`).
   - Reusable `<DataTable>` component supports dynamic field sorting, instant search, page size selection, and CSV export.

2. **Developer API Hub & Multi-Language Connectors:**
   - Interactive code generator with 1-click language switcher for **Python (Odoo Automated Actions)**, **PHP**, **cURL**, **.NET (C#)**, and **Node.js**.
   - API Tester with layout-contained grid (`.api-hub-grid`) preventing overflow on JSON response execution.

3. **Dual Charging Engine (Superadmin Selectable):**
   - **Option A (Standard Per-Message):** Debits full Meta Cost + Platform Margin on every single dispatch.
   - **Option B (Meta 24-Hour Session Deduplication):** 1st message debited full tariff; subsequent messages to same contact/category within 24h waive Meta Cost (`0.0000 BHD`) and only debit platform margin.

4. **Strict Superadmin RBAC Security:**
   - Meta Cloud API credentials & Tariffs restricted exclusively to Superadmin edit-only.

5. **Prepaid Wallet & Financial Audit Ledger:**
   - Multi-currency support (BHD 3 decimals, SAR, AED, KWD, QAR, OMR, INR, USD).

---

## 📋 Next Development Tasks (Version 2.0 Roadmap Progress)

| Milestone Target | Module / Feature Name | Status | Description |
|---|---|---|---|
| **v2.1.0** | **Inbound Live Chat & Two-Way Agent Inbox** | ✅ **COMPLETED** | Dedicated agent inbox (`#inbox`), 24h customer care session tracking, free-text replies, canned responses, and simulator. |
| **v2.2.0** | **Odoo ERP Automated Action Webhook & Model Sync** | 🔄 **Next Priority** | Inbound triggers for automated invoice generation, payment receipt dispatch, and real-time delivery status synchronization with Odoo ERP. |
| **v2.3.0** | **Bulk Campaign Broadcasts & Queue Pacing** | ⏳ **Scheduled** | CSV contact list upload with dynamic variable mapping, segmentation, and throttled queue pacing (50 msgs/min). |

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
git commit -m "Release v2.1.0: Inbound Live Chat & Two-Way Agent Inbox"
git push origin main
```
