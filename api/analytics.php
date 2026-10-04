<?php
/**
 * WhatsApp Analytics & Financial Metrics API
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest();
$db   = Database::getConnection();

// 1. Overview KPIs
$kpiSql = "
    SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) as outbound_count,
        SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) as inbound_count,
        SUM(CASE WHEN status IN ('sent', 'delivered', 'read') THEN 1 ELSE 0 END) as successful_count,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        COALESCE(SUM(meta_cost_bhd), 0) as total_meta_cost_bhd,
        COALESCE(SUM(platform_charge_bhd), 0) as total_platform_charge_bhd,
        COALESCE(SUM(client_rate_bhd), 0) as total_client_billed_bhd
    FROM whatsapp_messages
";
$kpi = $db->query($kpiSql)->fetch() ?: [];

$totalOutbound = (int)($kpi['outbound_count'] ?? 0);
$successful    = (int)($kpi['successful_count'] ?? 0);
$readCount     = (int)($kpi['read_count'] ?? 0);

$deliveryRate  = $totalOutbound > 0 ? round(($successful / $totalOutbound) * 100, 1) : 100;
$readRate      = $successful > 0 ? round(($readCount / $successful) * 100, 1) : 0;

// 2. Category Breakdown
$catSql = "
    SELECT 
        category,
        COUNT(*) as message_count,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
        COALESCE(SUM(client_rate_bhd), 0) as category_billed_bhd
    FROM whatsapp_messages
    GROUP BY category
    ORDER BY message_count DESC
";
$categories = $db->query($catSql)->fetchAll() ?: [];

// 3. Last 7 Days Volume
$dailySql = "
    SELECT 
        DATE(created_at) as msg_date,
        COUNT(*) as count,
        SUM(CASE WHEN category = 'UTILITY' THEN 1 ELSE 0 END) as utility_count,
        SUM(CASE WHEN category = 'AUTHENTICATION' THEN 1 ELSE 0 END) as otp_count,
        SUM(CASE WHEN category = 'MARKETING' THEN 1 ELSE 0 END) as marketing_count,
        SUM(CASE WHEN category = 'SERVICE' THEN 1 ELSE 0 END) as service_count
    FROM whatsapp_messages
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(created_at)
    ORDER BY msg_date ASC
";
$daily = $db->query($dailySql)->fetchAll() ?: [];

// 4. Recent Active Integrations
$integrationsSql = "
    SELECT source_system, COUNT(*) as volume, MAX(created_at) as last_activity
    FROM whatsapp_messages
    GROUP BY source_system
    ORDER BY volume DESC
";
$integrations = $db->query($integrationsSql)->fetchAll() ?: [];

sendJsonResponse([
    'success' => true,
    'kpis' => [
        'total_messages'        => (int)($kpi['total_messages'] ?? 0),
        'outbound_count'        => $totalOutbound,
        'inbound_count'         => (int)($kpi['inbound_count'] ?? 0),
        'delivery_rate'         => $deliveryRate,
        'read_rate'             => $readRate,
        'failed_count'          => (int)($kpi['failed_count'] ?? 0),
        'total_meta_cost_bhd'   => number_format((float)($kpi['total_meta_cost_bhd'] ?? 0), 4),
        'total_platform_bhd'    => number_format((float)($kpi['total_platform_charge_bhd'] ?? 0), 4),
        'total_client_bhd'      => number_format((float)($kpi['total_client_billed_bhd'] ?? 0), 4)
    ],
    'categories'   => $categories,
    'daily_volume' => $daily,
    'integrations' => $integrations
]);
