<?php
/**
 * Application Version & Release Architecture API
 * WhatsApp Integration Platform
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

// Allow authenticated roles to view system version and roadmap architecture
$auth = authenticateRequest(['superadmin', 'admin', 'user']);

sendJsonResponse([
    'success' => true,
    'version_info' => [
        'current_version' => APP_VERSION,
        'major'           => APP_VERSION_MAJOR,
        'minor'           => APP_VERSION_MINOR,
        'patch'           => APP_VERSION_PATCH,
        'stage'           => APP_VERSION_STAGE,
        'locked_baseline' => [
            'version'      => APP_BASELINE_VERSION,
            'git_tag'      => APP_LOCKED_V1_TAG,
            'status'       => 'Verified, Tested & Locked in Git',
            'commit_hash'  => '9dd6ebc',
            'release_date' => '2026-10-06',
            'description'  => 'Milestone 1 Production Baseline: Dual charging engine, Superadmin RBAC, Meta Cloud API dispatch, DataTables, multi-currency prepaid wallet, and developer hub.'
        ],
        'versioning_policy' => [
            'scheme' => 'Semantic Versioning 2.0.0 (SemVer)',
            'format' => 'vMAJOR.MINOR.PATCH',
            'rules' => [
                'MAJOR (2.0.0)' => 'Represents major platform evolutions, foundational architecture additions, and major roadmap phase migrations.',
                'MINOR (2.x.0)' => 'New feature milestones and roadmap modules (e.g. v2.1.0 for Odoo Webhook triggers, v2.2.0 for Bulk Campaigns, v2.3.0 for Live Chat Inbox) released in backwards-compatible mode.',
                'PATCH (2.x.y)' => 'Incremental fixes, security patches, styling polish, and maintenance corrections.'
            ]
        ],
        'v2_roadmap_milestones' => [
            [
                'target_version' => '2.1.0',
                'title'          => 'Odoo ERP Automated Action Webhook & Model Sync',
                'status'         => 'Phase 1 Scheduled (Next Priority)',
                'scope'          => 'Inbound webhook triggers for automated invoice generation, payment receipt dispatch, and real-time delivery status synchronization with Odoo ERP.'
            ],
            [
                'target_version' => '2.2.0',
                'title'          => 'Bulk Campaign Broadcasts & Queue Pacing',
                'status'         => 'Phase 2 Scheduled',
                'scope'          => 'CSV contact list upload with dynamic variable mapping and scheduled queue pacing (50 msgs/min) with deliverability safety.'
            ],
            [
                'target_version' => '2.3.0',
                'title'          => 'Inbound Live Chat & Two-Way Agent Inbox',
                'status'         => 'Phase 3 Scheduled',
                'scope'          => 'Interactive two-way conversation window allowing support agents to reply directly within the Meta 24-hour customer care session window.'
            ]
        ],
        'changelog' => [
            [
                'version' => '2.0.0',
                'type'    => 'major',
                'date'    => '2026-10-13',
                'status'  => 'Active Development Initiated',
                'highlights' => [
                    'Initialized Version 2.0 Platform Architecture',
                    'Locked Version 1.0 Milestone as permanent Git tag (v1.0.0 / v1.0)',
                    'Established Semantic Minor Versioning (v2.x.x) guidelines',
                    'Embedded interactive in-app Version & Architecture inspector for future reference',
                    'Prepared execution pipeline for Odoo ERP Webhooks (v2.1.0)'
                ]
            ],
            [
                'version' => '1.0.0',
                'type'    => 'major',
                'date'    => '2026-10-06',
                'status'  => 'Locked & Production Verified (Git Tag: v1.0.0 / v1.0)',
                'highlights' => [
                    'Strict Superadmin RBAC Security on Meta Credentials & Tariffs (Admin Read-Only view)',
                    'Dual Charging Engine: Option A (Standard Per-Message) vs Option B (Meta 24h Session Deduplication)',
                    'Developer API Hub with Multi-Language Code Generators (Python Odoo, PHP, cURL, .NET C#, Node.js)',
                    'Prepaid Wallet & Financial Audit Ledger with BHD 3-decimal precision',
                    'Enterprise DataTables with dynamic sort, DESC default (newest first), search & CSV export',
                    'Live Meta WhatsApp Cloud API Dispatch with media header & variable parameter support',
                    'Real-time message polling telemetry & webhook delivery/read receipts'
                ]
            ]
        ]
    ]
]);
