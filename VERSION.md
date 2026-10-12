# WhatsApp Integration Platform — Version & Release Architecture

*Engineered by SaNDS Lab Middle East W.L.L.*

---

## 📌 Active Version Status
- **Current Version:** `2.2.1`
- **Development Stage:** `v2.2.1 Real Meta Broadcast Dispatch & Verified Delivery Tracking (Active)`
- **Locked Baseline Version:** `1.0.0`
- **Git Baseline Tags:** `v1.0.0` & `v1.0` (Locked on Commit `9dd6ebc`)
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
│      │         └── Bug fixes, security patches, styling touch-ups (e.g., 2.0.1, 2.1.1)
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
| **v2.3.0** | **Odoo ERP Automated Action Webhook & Model Sync** | 🔄 **Next Priority** | Inbound triggers for automated invoice generation (`account.move`), payment receipt dispatch, and real-time delivery status synchronization with Odoo ERP. |

---

## 📜 Release Changelog History

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
