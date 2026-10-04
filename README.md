# WhatsApp Integration Platform

Enterprise WhatsApp Cloud API Gateway and Odoo ERP Integration Middleware engineered by **SaNDS Lab Middle East W.L.L.**

## Overview
- **WhatsApp Cloud API Integration**: Automated dispatch for utility, authentication (OTP), marketing, and service templates.
- **Odoo ERP Connector & Webhooks**: Two-way telemetry with delivery statuses (`sent`, `delivered`, `read`, `failed`).
- **Interactive UI Console**: Built with React 18 & Vanilla CSS, live WhatsApp phone message preview mockup, and Bahrain (BHD) market tariff calculation.
- **Enterprise Security**: Role-based access control, X-API-Key management, rate limiting, and webhook verification.

## Architecture & Directory Structure
```
whatsapp/
├── api/
│   ├── analytics.php    # Analytics telemetry & billing breakdown
│   ├── api_keys.php     # API Key management for external ERPs
│   ├── auth.php         # Authentication & RBAC session handling
│   ├── messages.php     # Inbound/Outbound message dispatch & logs
│   ├── settings.php     # Meta Cloud API credentials & system config
│   ├── templates.php    # Template catalog & tariff calculator
│   ├── users.php        # User access management
│   └── webhook.php      # Meta Webhook challenge & event listener
├── assets/
│   ├── css/             # Enterprise responsive styles
│   ├── js/              # React 18 UI components & DataTable
│   └── logos/           # SaNDS Lab & UniGlobal brand assets
├── config/
│   └── db.php           # PDO database connection & response helpers
├── index.html           # SPA Web App entry point
├── index.php            # PHP Web Server bootstrap
└── schema.sql           # MySQL database schema & seed data
```

## Setup Instructions

### 1. Database Configuration
Import `schema.sql` into MySQL:
```bash
mysql -u root -p < schema.sql
```
Update database credentials in `config/db.php`.

### 2. Meta WhatsApp Cloud API Setup
Set up your Meta Developer credentials in the settings panel or database:
- `meta_phone_number_id`
- `meta_waba_account_id`
- `meta_access_token`
- `webhook_verify_token`

### 3. Webhook URL
Configure in Meta Business Developer Dashboard:
- **Callback URL:** `https://your-domain.com/whatsapp/api/webhook.php`
- **Verify Token:** `sands_uniglobal_wh_verify_token_2026`
