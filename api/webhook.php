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
        $statuses = $data['entry'][0]['changes'][0]['value']['statuses'] ?? [];
        if (!empty($statuses) && is_array($statuses)) {
            foreach ($statuses as $statusObj) {
                $wamid  = $statusObj['id'] ?? '';
                $status = $statusObj['status'] ?? '';

                if ($wamid && in_array($status, ['sent', 'delivered', 'read', 'failed'])) {
                    $timeClause = "";
                    if ($status === 'sent') {
                        $timeClause = ", sent_at = IFNULL(sent_at, NOW())";
                    } elseif ($status === 'delivered') {
                        $timeClause = ", delivered_at = IFNULL(delivered_at, NOW())";
                    } elseif ($status === 'read') {
                        $timeClause = ", read_at = IFNULL(read_at, NOW()), delivered_at = IFNULL(delivered_at, NOW())";
                    }

                    $errClause = "";
                    $params = [$status];
                    if ($status === 'failed') {
                        $errDetails = [];
                        if (!empty($statusObj['errors'][0]['title'])) {
                            $errDetails[] = $statusObj['errors'][0]['title'];
                        }
                        if (!empty($statusObj['errors'][0]['message'])) {
                            $errDetails[] = $statusObj['errors'][0]['message'];
                        }
                        if (!empty($statusObj['errors'][0]['error_data']['details'])) {
                            $errDetails[] = $statusObj['errors'][0]['error_data']['details'];
                        }
                        if (!empty($errDetails)) {
                            $errClause = ", error_message = ?";
                            $params[] = implode(' - ', array_unique($errDetails));
                        }
                    }
                    $params[] = $wamid;

                    $upd = $db->prepare("UPDATE whatsapp_messages SET status = ? {$timeClause} {$errClause} WHERE message_id = ?");
                    $upd->execute($params);

                    // Sync Campaign Recipients & Counters
                    try {
                        $findRec = $db->prepare("SELECT id, campaign_id, status FROM campaign_recipients WHERE message_id = ? LIMIT 1");
                        $findRec->execute([$wamid]);
                        $recRow = $findRec->fetch();
                        if ($recRow) {
                            $oldRecStatus = $recRow['status'];
                            $campId = (int)$recRow['campaign_id'];

                            $db->prepare("UPDATE campaign_recipients SET status = ?, error_message = IFNULL(?, error_message) WHERE id = ?")
                               ->execute([$status, !empty($errDetails) ? implode(' - ', array_unique($errDetails)) : null, $recRow['id']]);

                            if ($status === 'delivered' && $oldRecStatus !== 'delivered' && $oldRecStatus !== 'read') {
                                $db->prepare("UPDATE campaigns SET delivered_count = delivered_count + 1 WHERE id = ?")->execute([$campId]);
                            } elseif ($status === 'read' && $oldRecStatus !== 'read') {
                                $addDeliv = ($oldRecStatus !== 'delivered') ? ", delivered_count = delivered_count + 1" : "";
                                $db->prepare("UPDATE campaigns SET read_count = read_count + 1 {$addDeliv} WHERE id = ?")->execute([$campId]);
                            }
                        }
                    } catch (Throwable $ignoreCampSync) {}

                    // Bi-Directional Status Callback to Odoo ERP
                    try {
                        $findMsg = $db->prepare("SELECT parameters_json FROM whatsapp_messages WHERE message_id = ? LIMIT 1");
                        $findMsg->execute([$wamid]);
                        $msgRow = $findMsg->fetch();
                        if ($msgRow && !empty($msgRow['parameters_json'])) {
                            $paramsData = json_decode((string)$msgRow['parameters_json'], true);
                            if (is_array($paramsData) && !empty($paramsData['_odoo_callback_url'])) {
                                $callbackUrl = $paramsData['_odoo_callback_url'];
                                $callbackPayload = [
                                    'event'          => 'whatsapp_status_update',
                                    'message_id'     => $wamid,
                                    'status'         => $status,
                                    'odoo_model'     => $paramsData['_odoo_model'] ?? null,
                                    'odoo_record_id' => $paramsData['_odoo_record_id'] ?? null,
                                    'timestamp'      => date('Y-m-d H:i:s')
                                ];
                                $chCb = curl_init($callbackUrl);
                                curl_setopt($chCb, CURLOPT_POST, 1);
                                curl_setopt($chCb, CURLOPT_POSTFIELDS, json_encode($callbackPayload));
                                curl_setopt($chCb, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                                curl_setopt($chCb, CURLOPT_TIMEOUT, 3);
                                curl_setopt($chCb, CURLOPT_RETURNTRANSFER, true);
                                curl_setopt($chCb, CURLOPT_SSL_VERIFYPEER, false);
                                curl_exec($chCb);
                                curl_close($chCb);
                            }
                        }
                    } catch (Throwable $ignoreOdooCallback) {}
                }
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
