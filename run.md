# WhatsApp Integration Platform — Project Handover & Resume Guide
*Engineered by SaNDS Lab Middle East W.L.L.*

---

## 📌 Development Checkpoint & Milestone Snapshot (All Verified & Tested)
- **Checkpoint Timestamp:** `2026-10-13 00:25:00 (Local Time)`
- **Active Platform Generation:** `Version 2.0.0` (Roadmap Active)
- **Locked Baseline Milestone:** `Version 1.0.0` (Permanently locked in Git with tags `v1.0.0` & `v1.0` on commit `9dd6ebc`)
- **Live Production URL:** `https://whatsapp.sandslab.com`
- **GitHub Repository:** `https://github.com/ajitsands/whatsapp.git` (`branch: main`)
- **PHP Compatibility:** PHP 7.4+ compatible (with custom polyfills in `config/db.php`)
- **Frontend Stack:** React 18 (Standalone transpiled bundle `assets/js/app.compiled.js` via `esbuild`)

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

## 🚀 Version 2.0 & Minor Version Management Protocol

Starting from Version 2.0, all ongoing changes follow strict **Semantic Versioning 2.0.0** (`vMAJOR.MINOR.PATCH`):

```
v2 . [MINOR] . [PATCH]
│      │         │
│      │         └── Bug fixes, security patches, styling polish (e.g., 2.0.1, 2.1.1)
│      └─────────── Roadmap feature releases (e.g., 2.1.0 for Odoo sync, 2.2.0 for Campaigns)
└────────────────── Major platform architecture generation
```

* **System Constants:** Configured in `config/db.php` (`APP_VERSION`, `APP_VERSION_MAJOR`, `APP_VERSION_MINOR`, `APP_VERSION_PATCH`, `APP_BASELINE_VERSION`).
* **API Exposure:** Accessible via `/api/version.php` and `/api/settings.php`.
* **In-App Inspection:** Interactive Version Inspector modal in the top header and footer, plus dedicated "Version & Roadmap Architecture" tab in Engine Settings.

---

## 📋 Next Development Tasks (Version 2.0 Roadmap)

| Milestone Target | Module / Feature Name | Priority | Scope Description |
|---|---|---|---|
| **v2.1.0** | **Odoo ERP Automated Action Webhook & Model Sync** | 🔄 Phase 1 (Next Priority) | Inbound triggers for automated invoice generation, payment receipt dispatch, and real-time delivery status synchronization with Odoo ERP. |
| **v2.2.0** | **Bulk Campaign Broadcasts & Queue Pacing** | ⏳ Phase 2 (Scheduled) | CSV contact list upload with variable mapping, segmentation, and throttled queue pacing (50 msgs/min). |
| **v2.3.0** | **Inbound Live Chat & Two-Way Agent Inbox** | ⏳ Phase 3 (Scheduled) | Interactive two-way conversation window allowing support agents to reply directly within the Meta 24-hour customer care session window. |

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
