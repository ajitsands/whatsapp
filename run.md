# WhatsApp Integration Platform — Project Handover & Resume Guide
*Engineered by SaNDS Lab Middle East W.L.L.*

---

## 📌 Development Checkpoint & Milestone Snapshot (All Verified & Tested)
- **Checkpoint Timestamp:** `2026-10-13 02:45:00 (Local Time)`
- **Session Status:** `⏸️ Paused for Today (Scheduled to Resume in 8 Hours)`
- **Active Platform Generation:** `Version 2.2.2` (Modern Confirmation Dialogs & Verified Meta Dispatch Live on Server)
- **Locked Baseline Milestone:** `Version 1.0.0` (Permanently locked in Git with tags `v1.0.0` & `v1.0` on commit `9dd6ebc`)
- **Live Production URL:** `https://whatsapp.sandslab.com`
- **GitHub Repository:** `https://github.com/ajitsands/whatsapp.git` (`branch: main`)
- **Latest Commit Pushed:** `d6994bef` (`Replace native browser alerts with modern confirmation popup dialog (v2.2.2)`)
- **PHP Compatibility:** PHP 7.4+ compatible (with custom polyfills in `config/db.php`)
- **Frontend Stack:** React 18 (Standalone transpiled bundle `assets/js/app.compiled.js` via `esbuild`)

---

## 🏆 Summary of Releases Completed & Deployed Today

### 1. Version 2.1.0 — Inbound Live Chat & Two-Way Agent Inbox (`#inbox`)
- **Two-Column Workspace:** WhatsApp Web-inspired desktop layout with real-time thread search, filter chips (`All`, `Unread`, `24h Active 🟢`), and unread badge counters.
- **Official Meta 24-Hour Customer Care Window Engine:**
  - Real-time countdown tracking of active session window (`🟢 24h Window Active (X.X hrs left) • Free-Text Allowed`).
  - Dynamic fallback restriction banner when session closes (`⚠️ 24h Session Closed • Pre-Approved Template Required`).
  - Seamless 1-click template selector fallback when outside the 24h window.
- **Agent Productivity Suite:** Canned quick responses toolbar (`👋 Support Greeting`, `📄 Reviewing Inquiry`, `✅ Payment Confirmed`, `🙏 Resolution Closing`).
- **Interactive Simulator:** Built-in modal (`api/inbox.php?action=simulate_inbound`) for instant inbound customer message simulation.

### 2. Version 2.2.0 — Bulk Campaign Broadcasts & Anti-Spam Queue Pacing (`#campaigns`)
- **Campaign Manager Hub:** Aggregate KPI metric cards (Total Broadcasts, Audience Reached, Delivery Rate, Read Rate) and interactive `<DataTable>`.
- **4-Step Campaign Creation Wizard:**
  1. Template selection with real-time variable previews.
  2. CSV contact upload or raw data paste with 1-click tailored Sample CSV download.
  3. Dynamic column-to-variable parameter mapping.
  4. Real-time budget review and wallet balance pre-check validation.
- **Anti-Spam Queue Throttle Engine:** Selectable dispatch pacing speeds (Conservative 20, Standard 50, Turbo 100 msgs/min) with live animated queue progress monitor.
- **Recipient Inspection Audit Modal:** Full recipient audit log with search, status filters, and exportable CSV reports.

### 3. Version 2.2.1 — Real Meta Cloud API Dispatch & Webhook Delivery Tracking
- **Direct Meta Graph API Dispatch:** Connected campaign processor (`api/campaigns.php`) directly to Meta Cloud API (`https://graph.facebook.com/v20.0/{metaPhoneId}/messages`).
- **Media Header & Variable Substitution:** Dynamic mapping of header images/documents and body text template variables during campaign queue processing.
- **Authentic Delivery Lifecycle:** Fixed counter discrepancy where sent messages were previously marked delivered prematurely; messages now stay at `sent` until physical handset receipt is verified by Meta webhooks (`api/webhook.php`).
- **Webhook Campaign Synchronization:** Real-time incoming Meta delivery and read receipts automatically synchronize with `campaign_recipients` records and aggregate campaign counters.
- **Campaign Re-run:** Added 1-click **Re-run Broadcast** capability to reset recipient delivery states and re-queue campaigns.

### 4. Version 2.2.2 — Modern Confirmation Dialog System
- **Enterprise Frosted-Glass `<ConfirmDialog>` Modal:** Eliminated jarring browser-native `window.confirm()` and `alert()` popups in favor of an animated dark-glass modal.
- **Thematic Icon Badges:** Integrated glowing ambient status badges (`danger` for broadcast cancellation/deletion, `warning` for broadcast re-run, `info` for alerts).
- **Smooth Animation & UX:** Backdrop blur, scale-in animation, and keyboard `Escape` dismissal.
- **Universal Application:** Applied across Campaign Re-run, Broadcast Cancellation, WhatsApp Template Deletion, and User Account Deletion.

---

## 🔒 Version 1.0 Milestone (Locked Baseline)

All Version 1.0 core features remain fully tested and operational:
1. **Enterprise DataTables with Default Descending Sort (`DESC`):** Telemetry (`#logs`), Wallet Ledger (`#wallet`), Templates (`#templates`), API Keys, and Users.
2. **Developer API Hub:** Interactive code generator for Python (Odoo), PHP, cURL, .NET (C#), and Node.js.
3. **Dual Charging Engine:** Superadmin selectable between Option A (Standard Per-Message) and Option B (Meta 24h Deduplication).
4. **Prepaid Wallet & Financial Audit Ledger:** Multi-currency support with BHD 3-decimal precision and ledger rollback security.
5. **Strict RBAC Security:** Meta credentials and tariff pricing restricted to Superadmin edit-only.

---

## 📋 Roadmap Status & Next Immediate Milestone (In 8 Hours)

| Milestone Target | Module / Feature Name | Status | Description |
|---|---|---|---|
| **v2.1.0** | **Inbound Live Chat & Two-Way Agent Inbox** | ✅ **COMPLETED & LIVE** | Dedicated agent inbox (`#inbox`), 24h customer care session tracking, free-text replies, canned responses, and simulator. |
| **v2.2.0** | **Bulk Campaign Broadcasts & Queue Pacing** | ✅ **COMPLETED & LIVE** | CSV contact upload with dynamic variable mapping, anti-spam dispatch queue pacing, live animated monitor, and recipient reports. |
| **v2.2.1** | **Meta Cloud API Live Dispatch & Webhook Delivery Tracking** | ✅ **COMPLETED & LIVE** | Direct Meta Graph API cURL dispatch, real `wamid` generation, and webhook-driven delivery/read status updates. |
| **v2.2.2** | **Enterprise UI Popups & Rich Confirmation Dialog System** | ✅ **COMPLETED & LIVE** | Replaced all native browser alert/confirm dialogues with modern frosted-glass modals with glowing status badges. |
| **v2.3.0** | **Odoo ERP Automated Action Webhook & Model Sync** | 🔄 **FINAL TARGET (Resuming in 8 Hrs)** | Inbound triggers for automated invoice generation (`account.move`), payment receipts, and real-time delivery status synchronization with Odoo ERP. |

---

## 🎯 Version 2.3.0: Odoo ERP Integration Execution Plan (When Resuming)

When resuming development in 8 hours, the following work will be executed for the final milestone:

1. **Odoo Inbound Webhook Controller (`api/odoo_webhook.php`):**
   - Secure token-authenticated endpoint accepting automated webhook dispatches from Odoo ERP.
   - Payload parsers for key business models:
     - `account.move`: Customer Invoices, Credit Notes, Customer Statements.
     - `sale.order`: Quotations, Sales Order Confirmations, Delivery Orders.
     - `account.payment`: Payment Vouchers, Receipt Acknowledgements.
2. **Dynamic PDF Attachment Streaming:**
   - Support streaming or URL hosting of Odoo-generated invoice/quote PDFs directly into WhatsApp header document attachments.
3. **Bi-Directional Delivery Callbacks to Odoo:**
   - Webhook callback updating Odoo record chatter / custom fields with WhatsApp delivery timestamps and `wamid` tracking IDs.
4. **Developer Hub Pre-Built Python Snippets:**
   - Ready-to-copy Python code snippets for Odoo 14, 15, 16, and 17 Automated Actions (`ir.actions.server`) with zero third-party Python dependencies.

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
