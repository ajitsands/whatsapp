<?php
/**
 * WhatsApp Messages API Endpoint
 * Handles Outbound Dispatching (Odoo ERP & Web UI), Inbound Logs, and Status Querying
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest(); // Supports Session or X-API-Key
$db   = Database::getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetMessages($db);
        break;

    case 'POST':
        handleSendMessage($db, $auth);
        break;

    case 'PUT':
    case 'PATCH':
        handleUpdateStatus($db);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

/**
 * GET Messages List with Filters & Pagination
 */
function handleGetMessages(PDO $db): void {
    $status    = $_GET['status'] ?? '';
    $category  = $_GET['category'] ?? '';
    $direction = $_GET['direction'] ?? '';
    $search    = $_GET['search'] ?? '';
    $limit     = max(1, min(100, (int)($_GET['limit'] ?? 20)));
    $page      = max(1, (int)($_GET['page'] ?? 1));
    $offset    = ($page - 1) * $limit;

    $where = [];
    $params = [];

    if (!empty($status) && $status !== 'all') {
        $where[] = "status = ?";
        $params[] = $status;
    }

    if (!empty($category) && $category !== 'all') {
        $where[] = "category = ?";
        $params[] = $category;
    }

    if (!empty($direction) && $direction !== 'all') {
        $where[] = "direction = ?";
        $params[] = $direction;
    }

    if (!empty($search)) {
        $where[] = "(to_phone LIKE ? OR from_phone LIKE ? OR message_body LIKE ? OR template_name LIKE ? OR message_id LIKE ?)";
        $term = "%{$search}%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    // Total Count
    $countStmt = $db->prepare("SELECT COUNT(*) as total FROM whatsapp_messages {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch()['total'];

    // Records
    $sql = "SELECT * FROM whatsapp_messages {$whereSql} ORDER BY created_at DESC LIMIT {$limit} OFFSET {$offset}";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll();

    sendJsonResponse([
        'success'    => true,
        'data'       => $records,
        'pagination' => [
            'total'        => $total,
            'page'         => $page,
            'limit'        => $limit,
            'total_pages'  => (int)ceil($total / $limit)
        ]
    ]);
}

/**
 * POST Send Message (Odoo Integration & UI Composer)
 */
function handleSendMessage(PDO $db, array $auth): void {
    try {
        $input = getJsonInput();

        // Required fields
        $toPhone = trim($input['to_phone'] ?? $input['recipient'] ?? '');
        if (empty($toPhone)) {
            sendJsonResponse(['success' => false, 'error' => 'Field "to_phone" is required (e.g. +97339000000)'], 400);
        }

        // Clean Phone number format
        $toPhone = preg_replace('/[^0-9\+]/', '', $toPhone);
        if (strpos($toPhone, '+') !== 0) {
            $toPhone = '+' . $toPhone;
        }

    $templateName = trim($input['template_name'] ?? '');
    $category     = strtoupper(trim($input['category'] ?? 'UTILITY'));
    $customText   = trim($input['message'] ?? $input['text'] ?? '');
    $bodyParams   = $input['body_parameters'] ?? $input['params'] ?? [];
    $headerMedia  = $input['header_media'] ?? null;
    $mediaUrl     = $input['media_url'] ?? ($headerMedia['url'] ?? null);
    $mediaName    = $input['media_name'] ?? ($headerMedia['filename'] ?? null);

    // Source determination
    $sourceSystem = 'Manual Web Console';
    if ($auth['type'] === 'api_key') {
        $sourceSystem = $auth['system_name'] ?? 'Odoo ERP Integration';
    } elseif (isset($input['source_system'])) {
        $sourceSystem = $input['source_system'];
    }

    // Tariff Rates based on Category
    $tariffs = [
        'AUTHENTICATION' => ['meta' => 0.0110, 'platform' => 0.0035, 'client' => 0.0145],
        'UTILITY'        => ['meta' => 0.0140, 'platform' => 0.0045, 'client' => 0.0185],
        'MARKETING'      => ['meta' => 0.0270, 'platform' => 0.0070, 'client' => 0.0340],
        'SERVICE'        => ['meta' => 0.0075, 'platform' => 0.0025, 'client' => 0.0100],
    ];

    $resolvedTariff = $tariffs[$category] ?? $tariffs['UTILITY'];

    // Construct final message body
    $finalBody = '';
    $messageType = 'template';

    if (!empty($templateName)) {
        // Fetch Template from DB
        $tStmt = $db->prepare("SELECT * FROM whatsapp_templates WHERE template_name = ? LIMIT 1");
        $tStmt->execute([$templateName]);
        $tmpl = $tStmt->fetch();

        if ($tmpl) {
            $category = $tmpl['category'];
            $resolvedTariff = [
                'meta'     => (float)$tmpl['meta_cost_bhd'],
                'platform' => (float)$tmpl['platform_charge_bhd'],
                'client'   => (float)$tmpl['client_rate_bhd']
            ];
            $finalBody = $tmpl['body_text'];
            if (!empty($bodyParams) && is_array($bodyParams)) {
                foreach ($bodyParams as $index => $paramVal) {
                    $varNum = $index + 1;
                    $finalBody = preg_replace('/\{+[\(\[]?\s*' . $varNum . '\s*[\)\]]?\}+/', (string)$paramVal, $finalBody);
                }
            }
            if ($tmpl['header_type'] === 'DOCUMENT') {
                $messageType = 'document';
            } elseif ($tmpl['header_type'] === 'IMAGE') {
                $messageType = 'image';
            }
        } else {
            $finalBody = "Template [{$templateName}] payload: " . json_encode($bodyParams);
        }
    } else {
        $messageType = !empty($mediaUrl) ? 'document' : 'text';
        $finalBody   = !empty($customText) ? $customText : 'Direct notification from ' . $sourceSystem;
    }

    // Fetch System Meta Settings
    $settingsStmt = $db->query("SELECT setting_key, setting_value FROM system_settings");
    $settingsMap = [];
    while ($row = $settingsStmt->fetch()) {
        $settingsMap[$row['setting_key']] = $row['setting_value'];
    }

    $defaultToken = 'EAATLuWFVcZBkBShyqCMEBcxXp77EAXXyWJXvyLr2ZBUisziJohZBDCozF0NFb61TnfJGY0vlBTfZAEzGoq6n9E7xAZAmbLD0dSZCogqYjAKJFzB9yTmaq10kQ2ZCfms3GOT0J9xi0Lzh4ZCYpZCILHx7nPFbVaGCmhs1TsVlHxUMMFNm2EYiDZCpGKLFSZAGLKo9onKZAAYGOZCOZCyou0ALgb4OXJJRXZCRVrqfn3ocZBHfv664guNKm8HeZB61mLZBH1HZC4uMR0Ngw4h3Gdskwt5mxcOIy5kOks6UCUS9s33G0ckbBAZDZD';
    $defaultPhoneId = '347848611735147';
    $metaPhoneId     = (!empty($settingsMap['meta_phone_number_id']) && $settingsMap['meta_phone_number_id'] !== '109823471928374') ? $settingsMap['meta_phone_number_id'] : $defaultPhoneId;
    $metaAccessToken = (!empty($settingsMap['meta_access_token']) && !str_starts_with($settingsMap['meta_access_token'], 'EAAJz9284jklasdf')) ? $settingsMap['meta_access_token'] : $defaultToken;
    $businessPhone   = $settingsMap['business_phone_number'] ?? '+973 1700 8899';

    // Auto-update system_settings if it had dummy or blank values
    if (empty($settingsMap['meta_access_token']) || str_starts_with($settingsMap['meta_access_token'], 'EAAJz9284jklasdf') || empty($settingsMap['meta_phone_number_id']) || $settingsMap['meta_phone_number_id'] === '109823471928374') {
        try {
            $db->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES ('meta_access_token', ?), ('meta_phone_number_id', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")
               ->execute([$defaultToken, $defaultPhoneId]);
        } catch (Throwable $ignore) {}
    }

    // Generate unique WhatsApp Message ID
    $uniqueRandom = bin2hex(random_bytes(16));
    $wamid = 'wamid.HBgL' . base64_encode($toPhone . ':' . $uniqueRandom);
    $status = 'queued';
    $metaError = null;

    // Real Meta Cloud API Dispatch (If token is available)
    $hasRealToken = !empty($metaAccessToken) && !str_starts_with($metaAccessToken, 'EAAJz9284jklasdf');
    if (!$hasRealToken) {
        $status = 'queued';
        $metaError = 'Meta Access Token not configured in Meta Settings (Simulation Mode).';
    } else {
        $cleanRecipient = preg_replace('/[^0-9]/', '', $toPhone);
        
        $metaPayload = [
            'messaging_product' => 'whatsapp',
            'recipient_type'    => 'individual',
            'to'                => $cleanRecipient,
        ];

        if (!empty($templateName)) {
            $metaPayload['type'] = 'template';
            $components = [];
            
            // Header component (Document / Image / Video)
            $headerType = strtoupper(trim($tmpl['header_type'] ?? 'NONE'));
            if (!empty($mediaUrl) && $headerType !== 'NONE') {
                if ($headerType === 'IMAGE') {
                    $components[] = [
                        'type' => 'header',
                        'parameters' => [
                            [
                                'type' => 'image',
                                'image' => [
                                    'link' => $mediaUrl
                                ]
                            ]
                        ]
                    ];
                } elseif ($headerType === 'DOCUMENT') {
                    $components[] = [
                        'type' => 'header',
                        'parameters' => [
                            [
                                'type' => 'document',
                                'document' => [
                                    'link' => $mediaUrl,
                                    'filename' => $mediaName ?: 'invoice.pdf'
                                ]
                            ]
                        ]
                    ];
                } elseif ($headerType === 'VIDEO') {
                    $components[] = [
                        'type' => 'header',
                        'parameters' => [
                            [
                                'type' => 'video',
                                'video' => [
                                    'link' => $mediaUrl
                                ]
                            ]
                        ]
                    ];
                }
            }

            // Body parameters
            if (!empty($bodyParams) && is_array($bodyParams)) {
                $paramObjects = [];
                foreach ($bodyParams as $val) {
                    $paramObjects[] = ['type' => 'text', 'text' => (string)$val];
                }
                $components[] = [
                    'type' => 'body',
                    'parameters' => $paramObjects
                ];
            }

            $langCode = ($templateName === 'hello_world') ? 'en_US' : ($tmpl['language'] ?? 'en');
            $metaPayload['template'] = [
                'name' => $templateName,
                'language' => ['code' => $langCode],
            ];
            if (!empty($components)) {
                $metaPayload['template']['components'] = $components;
            }
        } else {
            $metaPayload['type'] = 'text';
            $metaPayload['text'] = ['preview_url' => true, 'body' => $finalBody];
        }

        // Execute cURL
        $ch = curl_init("https://graph.facebook.com/v20.0/{$metaPhoneId}/messages");
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($metaPayload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $metaAccessToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $resRaw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $resJson = json_decode((string)$resRaw, true);
        if ($httpCode === 200 && isset($resJson['messages'][0]['id'])) {
            $wamid = $resJson['messages'][0]['id'];
            $status = 'sent';
            $metaError = null;
        } else {
            $status = 'failed';
            $errMsg = $resJson['error']['message'] ?? ($resRaw ?: 'Meta HTTP Error ' . $httpCode);
            if (!empty($resJson['error']['error_data']['details'])) {
                $errMsg .= ' (' . $resJson['error']['error_data']['details'] . ')';
            } elseif (!empty($resJson['error']['error_user_msg'])) {
                $errMsg .= ' (' . $resJson['error']['error_user_msg'] . ')';
            }
            $metaError = $errMsg;
        }
    }

    $sentAt = ($status === 'sent') ? date('Y-m-d H:i:s') : null;
    $deliveredAt = null;

    // Insert into DB
    $stmt = $db->prepare("
        INSERT INTO whatsapp_messages (
            message_id, direction, source_system, to_phone, from_phone, category,
            template_name, message_type, message_body, header_media_url, header_media_name,
            parameters_json, status, error_message, meta_cost_bhd, platform_charge_bhd, client_rate_bhd,
            sent_at, delivered_at
        ) VALUES (
            ?, 'outbound', ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?
        )
    ");

    $stmt->execute([
        $wamid,
        $sourceSystem,
        $toPhone,
        $businessPhone,
        $category,
        $templateName ?: null,
        $messageType,
        $finalBody,
        $mediaUrl,
        $mediaName,
        !empty($bodyParams) ? json_encode($bodyParams) : null,
        $status,
        $metaError,
        $resolvedTariff['meta'],
        $resolvedTariff['platform'],
        $resolvedTariff['client'],
        $sentAt,
        $deliveredAt
    ]);

    $insertedId = (int)$db->lastInsertId();

    sendJsonResponse([
        'success'      => true,
        'message_id'   => $wamid,
        'db_id'        => $insertedId,
        'status'       => $status,
        'recipient'    => $toPhone,
        'from_number'  => $businessPhone,
        'category'     => $category,
        'rendered_body'=> $finalBody,
        'meta_error'   => $metaError,
        'tariff'       => [
            'meta_cost'       => number_format($resolvedTariff['meta'], 4) . ' BHD',
            'platform_charge' => '+' . number_format($resolvedTariff['platform'], 4) . ' BHD',
            'client_rate'     => number_format($resolvedTariff['client'], 4) . ' BHD'
        ],
        'timestamp'    => $sentAt
    ], 201);
    } catch (Throwable $e) {
        sendJsonResponse(['success' => false, 'error' => 'Server error: ' . $e->getMessage()], 500);
    }
}

/**
 * PUT/PATCH Update status (mark read, delivered, etc.)
 */
function handleUpdateStatus(PDO $db): void {
    $input = getJsonInput();
    $messageId = $input['message_id'] ?? $_GET['message_id'] ?? '';
    $newStatus = strtolower(trim($input['status'] ?? 'read'));

    if (empty($messageId)) {
        sendJsonResponse(['success' => false, 'error' => 'message_id is required'], 400);
    }

    $validStatuses = ['queued', 'sent', 'delivered', 'read', 'failed'];
    if (!in_array($newStatus, $validStatuses, true)) {
        sendJsonResponse(['success' => false, 'error' => 'Invalid status value'], 400);
    }

    $timeFieldMap = [
        'sent'      => 'sent_at = NOW()',
        'delivered' => 'delivered_at = NOW()',
        'read'      => 'read_at = NOW()'
    ];
    $timeField = $timeFieldMap[$newStatus] ?? 'updated_at = NOW()';

    $stmt = $db->prepare("UPDATE whatsapp_messages SET status = ?, {$timeField} WHERE message_id = ? OR id = ?");
    $stmt->execute([$newStatus, $messageId, $messageId]);

    sendJsonResponse([
        'success'    => true,
        'message_id' => $messageId,
        'new_status' => $newStatus
    ]);
}
