# WhatsApp Integration Platform — Version & Release Architecture

*Engineered by SaNDS Lab Middle East W.L.L.*

---

## 📌 Active Version Status
- **Current Version:** `2.5.0`
- **Development Stage:** `v2.5.0 Enterprise User Security, SaNDS Lab Licensing & Dynamic Branding (Locked Production Milestone)`
- **Locked Milestone Tags:** `v2.5.0` (Production Milestone), `v1.0.0` & `v1.0` (Baseline Milestone)
- **Live Production URL:** `https://whatsapp.sandslab.com`
- **Repository:** `https://github.com/ajitsands/whatsapp.git` (`branch: main`)

---

## 🔒 Version 1.0 Milestone (Locked Baseline)

Version 1.0 represents the complete, fully tested, and production-verified foundational platform. It is permanently locked with Git tags `v1.0.0` and `v1.0`.

### Key Features Locked in v1.0:
1. **Strict Superadmin RBAC Security:**
   - Meta Cloud API Credentials: Superadmin edit-only; Admin has read-only locked view.
   - Tariff & Pricing Engine: Superadmin edit-only; Admin has read-only locked view.
   - Server-side stripping of restricted settings in `api/settings.php` for unauthorized roles.
2. **Dual Charging Engine:**
   - Option A: Standard Per-Message billing.
   - Option B: Meta 24-Hour Session Deduplication (subsequent messages within 24h waive Meta cost, charging only platform margin).
3. **Developer API Hub:**
   - Interactive code generators with 1-click language switcher for **Python (Odoo Automated Actions)**, **PHP**, **cURL**, **.NET (C#)**, and **Node.js**.
4. **Prepaid Wallet & Financial Audit Ledger:**
   - Multi-currency ledger with BHD 3-decimal precision, Top-Up debiting, and custom transaction deletion modal with automatic balance reversion.
5. **Enterprise DataTables:**
   - Automatic descending sort (`DESC` — newest first) across Message Telemetry, Wallet Ledger, Templates, API Keys, and Users.
6. **Live Meta WhatsApp Cloud API Dispatch & Webhooks:**
   - Real-time polling telemetry (2.5s) and webhook delivery/read receipts (`api/webhook.php`).

---

## 🚀 Version 2.0 & Minor Version Management Protocol

Starting from Version 2.0, the platform adheres strictly to **Semantic Versioning 2.0.0** (`vMAJOR.MINOR.PATCH`):

```
v2 . [MINOR] . [PATCH]
│      │         │
│      │         └── Bug fixes, security patches, styling touch-ups (e.g., 2.0.1, 2.1.1, 2.2.2)
│      └─────────── Roadmap feature releases (e.g., 2.1.0 Live Chat, 2.2.0 Campaigns, 2.3.0 Odoo Sync)
└────────────────── Major platform architecture generation
```

### Minor Versioning Rules:
* **MAJOR (`2.0.0`):** Represents the generation architecture leap, introducing support for enterprise ERP ecosystems, mass campaigns, and multi-agent inboxes.
* **MINOR (`2.1.0`, `2.2.0`, `2.3.0`):** Incremented whenever a scheduled roadmap milestone is completed and verified without breaking existing integrations.
* **PATCH (`2.x.1`, `2.x.2`):** Incremented for incremental corrections, security updates, styling polish, and hotfixes.

---

## 📋 Version 2.0 Development Roadmap Progress

| Milestone Target | Module / Feature Name | Status | Description |
|---|---|---|---|
| **v2.1.0** | **Inbound Live Chat & Two-Way Agent Inbox** | ✅ **COMPLETED & LIVE** | Two-way agent console (`#inbox`), Meta 24-hour customer care session window tracking, canned replies, free-form text messaging, and simulated inbound testing. |
| **v2.2.0** | **Bulk Campaign Broadcasts & Queue Pacing** | ✅ **COMPLETED & LIVE** | CSV contact upload with dynamic variable mapping, anti-spam dispatch queue pacing (20/50/100 msgs/min), live animated monitor, and exportable recipient reports. |
| **v2.2.1** | **Meta Cloud API Live Dispatch & Webhook Delivery Tracking** | ✅ **COMPLETED & LIVE** | True Meta Graph API cURL dispatch, prevention of premature delivery counting, real `wamid` tracking, and webhook-driven delivery updates. |
| **v2.2.2** | **Enterprise UI Popups & Rich Confirmation Dialog System** | ✅ **COMPLETED & LIVE** | Replaced all native browser alert/confirm dialogues with modern frosted-glass modals with glowing status badges and responsive actions. |
| **v2.3.0** | **Odoo ERP Automated Action Webhook & Model Sync** | ✅ **COMPLETED & LIVE** | Inbound webhook gateway (`api/odoo_webhook.php`), Automated Action Studio with zero-dependency Python code generator, dynamic PDF attachment streaming, and bi-directional chatter delivery callbacks. |
| **v2.4.0** | **WhatsApp Template Studio & Meta Live Approval** | ✅ **COMPLETED & LIVE** | Direct Meta Graph API submission for templates, pre-built Meta preset library, live handset phone mockup preview, and active/inactive template toggles. |
| **v2.5.0** | **Enterprise User Security, Licensing & Dynamic Branding** | 🔒 **LOCKED PRODUCTION** | Admin user edit/suspend controls, password resets, SaNDS Lab Application Key licensing engine with offline RSA-SHA256, 24h remote sync, dynamic company branding, and React ErrorBoundary. |

---

## 📜 Release Changelog History

### [2.5.0] — 2026-10-14 (Enterprise Security, SaNDS Lab Licensing & Dynamic Branding Locked 🔒)
- ⭐ **TODAY'S UPDATE — Superadmin Company Profile & Dynamic Branding:**
  - Dedicated "🏢 Company Profile & Branding" configuration sub-tab in Engine Settings.
  - Restricted exclusively to Superadmin accounts (read-only for standard Admin/User).
  - Integrated direct Logo Upload handler (`api/settings.php?action=upload_logo`) supporting PNG, SVG, JPG, WEBP (up to 5MB).
  - Real-time triple live previews (Header Brand Bar, Login Card, and WhatsApp Handset Simulator).
  - Dynamic platform-wide reflection: automatically replaces hardcoded "UniGlobal Consultancy" across the top header bar, login screen, composer handset mockup, template studio simulator, document titles, and receipts.
- ⭐ **TODAY'S UPDATE — Automated 24-Hour Remote License Sync & Suspension Engine:**
  - Background 24-hour verification schedule connecting with `https://key.sandslab.com`.
  - Immediate local application locking if a license key is revoked or suspended on the server.
  - Graceful fallback to local asymmetric RSA-SHA256 cryptographic verification if server is temporarily unreachable.
- ⭐ **TODAY'S UPDATE — Wholesale Carrier Tariff Privacy:**
  - Wholesale Meta delivery costs strictly restricted to Superadmin visibility across tariff calculators, message logs, and dashboard metrics.
- ⭐ **TODAY'S UPDATE — Enterprise Root React ErrorBoundary & White Screen Immunity:**
  - Added full React `ErrorBoundary` wrapping `<App />` root to prevent white screens on any runtime exception.
  - Branded recovery UI with exact diagnostic reporting, 1-click view reloading, and session purging.
  - Safeguarded `ComposerView` prop scope and user avatar/name renderers across all views.
- **Enterprise RBAC User Security Management:**
  - Built User Edit and Suspend/Reactivate toggle controls in Users view.
  - Administrator 1-click Password Reset modal for managed users.
  - Self-service User Change Password modal with session re-authentication.
- **SaNDS Lab Asymmetric RSA-SHA256 Application Key Licensing:**
  - Cryptographic RSA-SHA256 offline verification with domain binding and expiry countdown.
  - Live header expiry duration pill with color-coded warning badges.
  - Strict application locking screen protecting unactivated or expired installations.

### [2.4.0] — 2026-10-13 (WhatsApp Template Creation Studio & Meta Graph API Live Approval)
- **WhatsApp Template Creation Studio:** Direct Meta Graph API submission for message templates with category, language, and component configuration.
- **Curated Library of Meta Presets:** 6 pre-built compliant industry templates (Invoices, Sales Orders, Receipts, Reminders, Offers, OTPs).
- **Interactive Live Handset Mockup:** Real-time phone bubble preview with dynamic variable replacement.
- **Live Meta Status Synchronization:** Background status checks refreshing approved, rejected, and pending states directly from Meta Cloud WABA.
- **Active/Inactive Lifecycle Toggle:** 1-click toggling of templates with DB synchronization and Composer/Campaign filtering.
- **Dedicated Odoo Inbound Controller (`api/odoo_webhook.php`):** Token-authenticated gateway parsing automated action payloads for `account.move`, `sale.order`, `account.payment`, `stock.picking`, and `res.partner`.
- **Dynamic PDF Attachment Streaming:** Automatic decoding and caching of Odoo QWeb base64 binary reports into public document URLs, streaming seamlessly into Meta WhatsApp header document attachments.
- **Visual Automated Action Studio:** Interactive code generator producing ready-to-paste Python 3 code for Odoo 14-18 `ir.actions.server` (zero third-party pip dependencies required; runs natively on Odoo.sh & SaaS) as well as Odoo 17/18 Webhook JSON rules.
- **Bi-Directional Status Callbacks to Odoo:** Webhook engine (`api/webhook.php`) pushes asynchronous status updates (`delivered`, `read`) back to Odoo endpoints to update record chatter in real time.
- **Interactive Webhook Simulator:** Built-in testing console with 1-click sample presets for Invoices, Sales Orders, and Payment receipts.
- **Live Odoo Audit Telemetry:** Real-time log table tracking all external dispatches, Odoo model references, tariffs, and authentic Meta `wamid` tracking IDs.

### [2.2.2] — 2026-10-13 (Enterprise UI Popups & Rich Confirmation Dialog System)
- **Modern Reusable `<ConfirmDialog>` Modal:** Eliminated jarring browser-native `window.confirm()` and `alert()` popups in favor of an enterprise dark-glass animated dialog.
- **Glowing Visual Badges:** Integrated thematic modal icon badges with ambient glow (`danger` for cancellation/deletion, `warning` for broadcast re-run, `info` for notices).
- **Smooth Interaction & Focus Control:** Added backdrop blur, scale-in CSS keyframe animations, and escape key listener for seamless user experience.
- **Component Replacement:** Applied throughout Campaign Re-run, Broadcast Cancellation, WhatsApp Template Deletion, and User Deletion actions.

### [2.2.1] — 2026-10-13 (Real Meta Broadcast Dispatch & Verified Delivery Tracking)
- **Live Meta Graph API Dispatch:** Connected `handleProcessBatch()` in `api/campaigns.php` to direct Meta Graph API (`https://graph.facebook.com/v20.0/{metaPhoneId}/messages`).
- **Media Header & Parameter Mapping:** Real-time formatting of header images/documents and body text template variables during campaign queue processing.
- **Accurate Delivery Lifecycle:** Fixed counter bug where `delivered_count` was falsely incremented immediately upon send; messages now stay at `sent` until physical handset receipt is verified by Meta webhooks (`api/webhook.php`).
- **Webhook Campaign Synchronization:** Synchronized incoming Meta delivery & read receipts with `campaign_recipients` and campaign counters.
- **Campaign Re-run Capability:** Added 1-click **Re-run Broadcast** button in campaigns list and inspection modal.

### [2.2.0] — 2026-10-13 (Bulk Campaign Broadcasts & Queue Pacing Released)
- **Broadcast Campaigns UI (`#campaigns`):** Dedicated broadcast manager with aggregate KPI cards, active execution monitor, and DataTables listing.
- **New Campaign Wizard:** 4-step wizard with template preview, CSV drag-and-drop file upload, custom column mapping, and 1-click tailored sample CSV download.
- **Anti-Spam Queue Pacing Engine:** Multi-tier dispatch throttle presets (Conservative 20, Standard 50, Turbo 100 msgs/min) with live queue pause/resume controls.
- **Financial Pre-Check & Ledger:** Automatic wallet budget calculation and balance validation preventing campaign launch without sufficient balance.
- **Campaign Analytics & Inspection Modal:** Detailed recipient log with status tracking (`sent`, `delivered`, `read`, `failed`) and CSV report export.
- **Backend API (`api/campaigns.php`):** High-performance endpoints for campaign creation, batch processing, queue status toggles, and sample CSV generation.

### [2.1.0] — 2026-10-13 (Inbound Live Chat & Two-Way Agent Inbox Released)
- **Live Agent Inbox UI:** Built dedicated two-column desktop workspace (`#inbox`) with contact search, unread badge counter, and filter tabs.
- **24-Hour Customer Care Window:** Real-time countdown tracking of Meta's 24-hour conversational window with session pills and free-text authorization.
- **Agent Tools:** Implemented 1-click Canned Quick Responses toolbar and dynamic template fallback switcher when the 24h window is closed.
- **Backend API:** Created `/api/inbox.php` with thread grouping, message fetching, agent reply dispatching, and mark-as-read handlers.
- **Inbound Simulator:** Added modal allowing instant simulation of customer inbound replies for rapid testing and demonstrations.

### [2.0.0] — 2026-10-13 (Architecture Baseline Initialized)
- **Architecture:** Initialized Version 2.0 Platform Architecture.
- **Git Lock:** Locked Milestone 1 permanently under Git tags `v1.0.0` and `v1.0`.
- **Versioning Engine:** Implemented Semantic Minor Versioning framework in `config/db.php`.
- **System API:** Created dedicated `/api/version.php` endpoint.
- **In-App Documentation:** Embedded interactive Version & Release Architecture Inspector modal in application header and footer.

### [1.0.0] — 2026-10-06 (Baseline Locked & Production Verified)
- Initial production release verified and deployed at `https://whatsapp.sandslab.com`.
- Full Superadmin RBAC security restrictions implemented.
- Dual Charging Engine (Option A vs Option B) integrated.
- Enterprise DataTables with default DESC sort and CSV export.
- Developer API Hub with multi-language code snippets.
- Prepaid Wallet & Financial Audit Ledger.
