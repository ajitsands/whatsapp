# WhatsApp Integration Platform — Version & Release Architecture

*Engineered by SaNDS Lab Middle East W.L.L.*

---

## 📌 Active Version Status
- **Current Version:** `2.0.0`
- **Development Stage:** `Active Development (Roadmap Phase)`
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
│      └─────────── Roadmap feature releases (e.g., 2.1.0 for Odoo sync, 2.2.0 for Campaigns)
└────────────────── Major platform architecture generation
```

### Minor Versioning Rules:
* **MAJOR (`2.0.0`):** Represents the current generation architecture leap, introducing support for enterprise ERP ecosystems, mass campaigns, and multi-agent inboxes.
* **MINOR (`2.1.0`, `2.2.0`, `2.3.0`):** Incremented whenever a scheduled roadmap milestone is completed and verified without breaking existing integrations.
* **PATCH (`2.x.1`, `2.x.2`):** Incremented for incremental corrections, security updates, styling polish, and hotfixes.

---

## 📋 Version 2.0 Development Roadmap (Scheduled Milestones)

| Milestone Target | Module / Feature Name | Status | Description |
|---|---|---|---|
| **v2.1.0** | **Odoo ERP Automated Action Webhook & Model Sync** | 🔄 Next Priority | Inbound triggers for automated invoice generation, payment receipt dispatch, and real-time delivery status synchronization with Odoo ERP. |
| **v2.2.0** | **Bulk Campaign Broadcasts & Queue Pacing** | ⏳ Scheduled | CSV contact list upload with dynamic template variable mapping, contact segmentation, and throttled queue pacing (50 msgs/min). |
| **v2.3.0** | **Inbound Live Chat & Two-Way Agent Inbox** | ⏳ Scheduled | Interactive two-way conversation window allowing support agents to reply directly within the Meta 24-hour customer care session window. |

---

## 📜 Release Changelog History

### [2.0.0] — 2026-10-13 (Active Roadmap Initiated)
- **Architecture:** Initialized Version 2.0 Platform Architecture.
- **Git Lock:** Locked Milestone 1 permanently under Git tags `v1.0.0` and `v1.0`.
- **Versioning Engine:** Implemented Semantic Minor Versioning framework (`APP_VERSION`, `APP_VERSION_MAJOR`, `APP_VERSION_MINOR`, `APP_VERSION_PATCH`) in `config/db.php`.
- **System API:** Created dedicated `/api/version.php` endpoint exposing runtime release information, roadmap, and changelog.
- **In-App Documentation:** Embedded interactive Version & Release Architecture Inspector modal in the application header and footer.
- **Preparation:** Initialized roadmap pipeline for Version 2.1.0 (Odoo ERP Automated Action Webhook & Model Sync).

### [1.0.0] — 2026-10-06 (Baseline Locked & Production Verified)
- Initial production release verified and deployed at `https://whatsapp.sandslab.com`.
- Full Superadmin RBAC security restrictions implemented.
- Dual Charging Engine (Option A vs Option B) integrated.
- Enterprise DataTables with default DESC sort and CSV export.
- Developer API Hub with multi-language code snippets.
- Prepaid Wallet & Financial Audit Ledger.
