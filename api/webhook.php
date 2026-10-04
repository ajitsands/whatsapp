<?php
/**
 * WhatsApp Cloud API Webhook Listener
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$db = Database::getConnection();

// 1. Meta Webhook Verification Challenge (GET)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode      = $_GET['hub_mode'] ?? $_GET['hub.mode'] ?? '';
    $token     = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? '';
    $challenge = $_GET['hub_challenge'] ?? $_GET['hub.challenge'] ?? '';

    // Get expected token
    $stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'webhook_verify_token' LIMIT 1");
    $stmt->execute();
    $savedToken = $stmt->fetch()['setting_value'] ?? 'sands_uniglobal_wh_verify_token_2026';

    if ($mode === 'subscribe' && $token === $savedToken) {
        http_response_code(200);
        echo $challenge;
        exit;
    }

    http_response_code(403);
    echo 'Forbidden';
    exit;
}

// 2. Meta Event Ingestion (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawPayload = file_get_contents('php://input');
    $data = json_decode($rawPayload, true);

    if (!empty($rawPayload)) {
        // Log raw webhook event
        $stmt = $db->prepare("INSERT INTO webhook_events (event_type, payload_json, ip_address) VALUES (?, ?, ?)");
        $eventType = 'meta_whatsapp_event';
        if (isset($data['entry'][0]['changes'][0]['field'])) {
            $eventType = $data['entry'][0]['changes'][0]['field'];
        }
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt->execute([$eventType, $rawPayload, $ip]);

        // Process status updates (sent -> delivered -> read)
        if (isset($data['entry'][0]['changes'][0]['value']['statuses'][0])) {
            $statusObj = $data['entry'][0]['changes'][0]['value']['statuses'][0];
            $wamid     = $statusObj['id'] ?? '';
            $status    = $statusObj['status'] ?? '';

            if ($wamid && in_array($status, ['sent', 'delivered', 'read', 'failed'])) {
                $timeField = match ($status) {
                    'sent'      => 'sent_at = NOW()',
                    'delivered' => 'delivered_at = NOW()',
                    'read'      => 'read_at = NOW()',
                    default     => 'updated_at = NOW()'
                };
                $upd = $db->prepare("UPDATE whatsapp_messages SET status = ?, {$timeField} WHERE message_id = ?");
                $upd->execute([$status, $wamid]);
            }
        }

        // Process incoming user replies
        if (isset($data['entry'][0]['changes'][0]['value']['messages'][0])) {
            $msgObj    = $data['entry'][0]['changes'][0]['value']['messages'][0];
            $fromPhone = '+' . ($msgObj['from'] ?? '');
            $msgId     = $msgObj['id'] ?? ('inbound_' . bin2hex(random_bytes(8)));
            $text      = $msgObj['text']['body'] ?? ($msgObj['type'] ?? 'Interactive message');

            $inStmt = $db->prepare("
                INSERT INTO whatsapp_messages (
                    message_id, direction, source_system, to_phone, from_phone,
                    category, message_type, message_body, status,
                    meta_cost_bhd, platform_charge_bhd, client_rate_bhd
                ) VALUES (
                    ?, 'inbound', 'WhatsApp Webhook', '+97317008899', ?,
                    'SERVICE', 'text', ?, 'read',
                    0.0075, 0.0025, 0.0100
                )
                ON DUPLICATE KEY UPDATE status='read'
            ");
            $inStmt->execute([$msgId, $fromPhone, $text]);
        }
    }

    sendJsonResponse(['success' => true, 'status' => 'EVENT_RECEIVED']);
}
