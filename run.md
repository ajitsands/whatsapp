# WhatsApp Integration Platform — Project Handover & Resume Guide
*Engineered by SaNDS Lab Middle East W.L.L.*

---

## 📌 Development Checkpoint & Milestone Snapshot (All Verified & Tested)
- **Checkpoint Timestamp:** `2026-10-13 13:50:00 (Local Time)`
- **Active Platform Generation:** `Version 2.3.1` (Streamlined Navigation: Grouped "Messages" Dropdown Menu)
- **Locked Baseline Milestone:** `Version 1.0.0` (Permanently locked in Git with tags `v1.0.0` & `v1.0` on commit `9dd6ebc`)
- **Live Production URL:** `https://whatsapp.sandslab.com`
- **GitHub Repository:** `https://github.com/ajitsands/whatsapp.git` (`branch: main`)
- **PHP Compatibility:** PHP 7.4+ compatible (with custom polyfills in `config/db.php`)
- **Frontend Stack:** React 18 (Standalone transpiled bundle `assets/js/app.compiled.js` via `esbuild`)

---

## 🏆 Summary of Platform Generation Releases

### 1. Version 2.3.1 — Streamlined Navigation & "Messages" Dropdown Menu
- **Navigation Consolidation:** Grouped `inbox`, `campaigns`, `composer`, and `logs` into a single, clean **"💬 Messages ▼"** dropdown in the top navigation bar.
- **Dynamic State & Badging:** The "Messages" parent button remains highlighted whenever any of the 4 sub-views is active, and automatically displays the live unread message count badge (`{inboxUnreadTotal}`).
- **Sub-View Descriptions & Polish:** Rich dropdown cards featuring icons, titles, and concise feature descriptions with active item indicator dots and outside-click auto-close.

### 2. Version 2.3.0 — Odoo ERP Automated Action Webhook & Model Sync (`#api_hub` & `api/odoo_webhook.php`)
- **Dedicated Inbound Webhook Gateway (`api/odoo_webhook.php`):**
  - Token-authenticated endpoint (`X-API-Key`) receiving automated webhook dispatches from Odoo ERP.
  - Native support for standard Odoo business models:
    - `account.move`: Customer Invoices, Credit Notes, Balance Statements.
    - `sale.order`: Sales Quotations, Order Confirmations, Delivery Notes.
    - `account.payment`: Payment Receipts & Vouchers.
    - `stock.picking`: Delivery Slips & Picking Operations.
- **Dynamic PDF Attachment Streaming:**
  - Automatic extraction, decoding, and caching of Odoo QWeb PDF binary reports into public document URLs.
  - Seamless streaming of invoice/quote PDFs into WhatsApp header document attachments.
- **Visual Automated Action Studio:**
  - Interactive code generator producing ready-to-paste Python 3 code for Odoo 14-18 `ir.actions.server`.
  - **Zero external dependencies:** Uses native standard Python `urllib` and `base64` — runs out of the box in Odoo.sh, SaaS, and on-premise without pip installs.
  - Live preview and 1-click copy for Odoo 17/18 Webhook Automation JSON rules.
- **Bi-Directional Status Sync Back to Odoo Chatter:**
  - Asynchronous webhook engine (`api/webhook.php`) returning WhatsApp delivery (`delivered`) and read (`read`) receipts back to Odoo endpoints to update record chatter in real time.
- **Interactive Webhook Simulator:**
  - Testing console with 1-click presets for Invoices, Orders, and Payments.
  - Live HTTP response inspector displaying Meta `wamid`, tariff deduction, and direct navigation links.
- **Live Odoo Audit Telemetry:**
  - Real-time log table tracking all external dispatches, Odoo model references, tariffs, and authentic Meta `wamid` tracking IDs.

### 2. Version 2.2.2 — Modern Confirmation Dialog System
- **Enterprise Frosted-Glass `<ConfirmDialog>` Modal:** Eliminated browser-native alerts in favor of an animated dark-glass dialog with ambient glowing status badges.
- **Universal Application:** Applied across Campaign Re-run, Broadcast Cancellation, WhatsApp Template Deletion, and User Deletion actions.

### 3. Version 2.2.1 — Real Meta Cloud API Dispatch & Webhook Delivery Tracking
- **Direct Meta Graph API Dispatch:** Connected campaign processor (`api/campaigns.php`) directly to Meta Cloud API (`https://graph.facebook.com/v20.0/{metaPhoneId}/messages`).
- **Media Header & Variable Substitution:** Dynamic mapping of header images/documents and body text template variables during campaign queue processing.
- **Authentic Delivery Lifecycle:** Webhook-driven delivery counting preventing premature status increments.

### 4. Version 2.2.0 — Bulk Campaign Broadcasts & Anti-Spam Queue Pacing (`#campaigns`)
- **Campaign Manager Hub:** Aggregate KPI metric cards and interactive `<DataTable>`.
- **4-Step Campaign Creation Wizard:** Template selection, CSV upload/paste with tailored sample download, dynamic parameter mapping, and wallet balance pre-checks.
- **Anti-Spam Queue Throttle Engine:** Selectable dispatch pacing speeds (20, 50, 100 msgs/min) with live animated queue monitor.

### 5. Version 2.1.0 — Inbound Live Chat & Two-Way Agent Inbox (`#inbox`)
- **Two-Column Workspace:** WhatsApp Web-inspired desktop layout with real-time thread search and unread badge counters.
- **Meta 24-Hour Customer Care Window Engine:** Real-time countdown tracking of customer service window, free-text messaging, and canned quick replies.

---

## 🔒 Version 1.0 Milestone (Locked Baseline)

All Version 1.0 core features remain fully tested and operational:
1. **Enterprise DataTables with Default Descending Sort (`DESC`):** Telemetry (`#logs`), Wallet Ledger (`#wallet`), Templates (`#templates`), API Keys, and Users.
2. **Developer API Hub:** Interactive code generator for Python (Odoo), PHP, cURL, .NET (C#), and Node.js.
3. **Dual Charging Engine:** Superadmin selectable between Option A (Standard Per-Message) and Option B (Meta 24h Deduplication).
4. **Prepaid Wallet & Financial Audit Ledger:** Multi-currency support with BHD 3-decimal precision and ledger rollback security.
5. **Strict RBAC Security:** Meta credentials and tariff pricing restricted to Superadmin edit-only.

---

## 📋 Roadmap Status Overview

| Milestone Target | Module / Feature Name | Status | Description |
|---|---|---|---|
| **v2.1.0** | **Inbound Live Chat & Two-Way Agent Inbox** | ✅ **COMPLETED & LIVE** | Dedicated agent inbox (`#inbox`), 24h customer care session tracking, free-text replies, canned responses, and simulator. |
| **v2.2.0** | **Bulk Campaign Broadcasts & Queue Pacing** | ✅ **COMPLETED & LIVE** | CSV contact upload with dynamic variable mapping, anti-spam dispatch queue pacing, live animated monitor, and recipient reports. |
| **v2.2.1** | **Meta Cloud API Live Dispatch & Webhook Delivery Tracking** | ✅ **COMPLETED & LIVE** | Direct Meta Graph API cURL dispatch, real `wamid` generation, and webhook-driven delivery/read status updates. |
| **v2.2.2** | **Enterprise UI Popups & Rich Confirmation Dialog System** | ✅ **COMPLETED & LIVE** | Replaced all native browser alert/confirm dialogues with modern frosted-glass modals with glowing status badges. |
| **v2.3.0** | **Odoo ERP Automated Action Webhook & Model Sync** | ✅ **COMPLETED & LIVE** | Dedicated webhook controller (`api/odoo_webhook.php`), Automated Action Studio with zero-dependency Python code generator, dynamic PDF attachment streaming, and bi-directional chatter delivery callbacks. |

---

## 🔑 Live Environment & Meta Configuration

### 1. Database Credentials (cPanel MySQL — No Structural Changes / Data Preserved)
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

## 🛠️ Local Development & Deployment Commands

### 1. Run Local PHP Server:
```powershell
php -S localhost:8000 -t "e:\integration_with oodu_document\whatsapp"
```

### 2. Recompile React Bundle (After modifying `assets/js/app.js`):
```powershell
cd "e:\integration_with oodu_document\whatsapp"
npx -y esbuild assets/js/app.js --outfile=assets/js/app.compiled.js --loader:.js=jsx
```

### 3. Deploy to Production Server:
On cPanel terminal / SSH for `whatsapp.sandslab.com`:
```bash
cd public_html   # or your subdomain path
git pull origin main
```
