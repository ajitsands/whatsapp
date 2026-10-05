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

    $phone     = trim($_GET['phone'] ?? '');
    $order     = strtoupper(trim($_GET['order'] ?? 'DESC')) === 'ASC' ? 'ASC' : 'DESC';

    if (!empty($phone)) {
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        $where[] = "(to_phone LIKE ? OR from_phone LIKE ?)";
        $params[] = "%{$cleanPhone}%";
        $params[] = "%{$cleanPhone}%";
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
    $sql = "SELECT * FROM whatsapp_messages {$whereSql} ORDER BY created_at {$order} LIMIT {$limit} OFFSET {$offset}";
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
    $senderUserId = null;

    if ($auth['type'] === 'api_key') {
        $sourceSystem = $auth['system_name'] ?? 'Odoo ERP Integration';
        $senderUserId = $auth['created_by'] ?? null;
    } elseif (isset($input['source_system'])) {
        $sourceSystem = $input['source_system'];
    }
    
    if (isset($auth['user']['id'])) {
        $senderUserId = (int)$auth['user']['id'];
    }

    // Fetch System Settings (Tariffs, Currency, Wallet Enforcement, Meta Settings)
    $settingsStmt = $db->query("SELECT setting_key, setting_value FROM system_settings");
    $settingsMap = [];
    while ($row = $settingsStmt->fetch()) {
        $settingsMap[$row['setting_key']] = $row['setting_value'];
    }

    $systemCurrency = $settingsMap['system_currency'] ?? 'BHD';
    $walletEnforcement = ($settingsMap['wallet_enforcement'] ?? '1') === '1';
    $billingModel = $settingsMap['billing_model'] ?? 'per_message';

    // Dynamic Category Tariffs from System Settings (Configured by Superadmin)
    $catKey = strtolower($category === 'AUTHENTICATION' ? 'auth' : $category);
    $metaRate = (float)($settingsMap["tariff_{$catKey}_meta"] ?? ($category === 'MARKETING' ? 0.0270 : ($category === 'AUTHENTICATION' ? 0.0110 : ($category === 'SERVICE' ? 0.0075 : 0.0140))));
    $platformRate = (float)($settingsMap["tariff_{$catKey}_platform"] ?? ($category === 'MARKETING' ? 0.0070 : ($category === 'AUTHENTICATION' ? 0.0035 : ($category === 'SERVICE' ? 0.0025 : 0.0045))));

    // Check 24-Hour Active Conversation Session Window (Option B)
    $isSessionReused = false;
    $sessionNote = null;

    if ($billingModel === '24h_session') {
        $cleanRecipient = preg_replace('/[^0-9]/', '', $toPhone);
        $sessionStmt = $db->prepare("
            SELECT id, created_at, category, status 
            FROM whatsapp_messages 
            WHERE (to_phone = ? OR REPLACE(REPLACE(to_phone, '+', ''), ' ', '') = ?)
              AND category = ? 
              AND status IN ('sent', 'delivered', 'read', 'queued')
              AND created_at >= (NOW() - INTERVAL 24 HOUR)
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $sessionStmt->execute([$toPhone, $cleanRecipient, $category]);
        $activeSession = $sessionStmt->fetch();

        if ($activeSession) {
            $isSessionReused = true;
            $metaRate = 0.0000;
            $sessionNote = "24h Session Active (Opened at {$activeSession['created_at']}) - Meta Fee Waived (0.0000 {$systemCurrency})";
        } else {
            $sessionNote = "New 24h Meta Conversation Session Opened";
        }
    } else {
        $sessionNote = "Standard Per-Message Billing (Option A)";
    }

    $resolvedTariff = [
        'meta'     => $metaRate,
        'platform' => $platformRate,
        'client'   => $metaRate + $platformRate
    ];

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
            $tMeta = (float)$tmpl['meta_cost_bhd'];
            $tPlat = (float)$tmpl['platform_charge_bhd'];

            $finalMeta = $isSessionReused ? 0.0000 : ($tMeta > 0 ? $tMeta : $metaRate);
            $finalPlat = $tPlat > 0 ? $tPlat : $platformRate;

            $resolvedTariff = [
                'meta'     => $finalMeta,
                'platform' => $finalPlat,
                'client'   => $finalMeta + $finalPlat
            ];
            // Extract template variable names
            preg_match_all('/\{\{([a-zA-Z0-9_]+)\}\}/', $tmpl['body_text'], $varMatches);
            $detectedVarNames = $varMatches[1] ?? [];
            if (empty($detectedVarNames)) {
                preg_match_all('/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/', $tmpl['body_text'], $numMatches);
                $detectedVarNames = $numMatches[1] ?? [];
            }

            $finalBody = $tmpl['body_text'];
            if (!empty($bodyParams) && is_array($bodyParams)) {
                $isAssoc = array_keys($bodyParams) !== range(0, count($bodyParams) - 1);
                $pIdx = 0;
                foreach ($bodyParams as $pKey => $paramVal) {
                    $targetVar = ($isAssoc && is_string($pKey)) ? $pKey : ($detectedVarNames[$pIdx] ?? ($pIdx + 1));
                    $finalBody = str_replace('{{' . $targetVar . '}}', (string)$paramVal, $finalBody);
                    $finalBody = preg_replace('/\{+[\(\[]?\s*' . preg_quote((string)$targetVar, '/') . '\s*[\)\]]?\}+/', (string)$paramVal, $finalBody);
                    $pIdx++;
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

    // Wallet Balance Check (If user has role 'admin' or 'user' or enforcement is active)
    $costToDeduct = (float)$resolvedTariff['client'];
    $debitedUser = null;

    if ($senderUserId && $walletEnforcement) {
        $uCheck = $db->prepare("SELECT id, name, role, wallet_balance, currency FROM users WHERE id = ? LIMIT 1");
        $uCheck->execute([$senderUserId]);
        $debitedUser = $uCheck->fetch();

        // If regular admin or user, require sufficient balance
        if ($debitedUser && $debitedUser['role'] !== 'superadmin') {
            $currBal = (float)$debitedUser['wallet_balance'];
            if ($currBal < $costToDeduct) {
                sendJsonResponse([
                    'success'        => false,
                    'error'          => "Insufficient wallet balance (Current: " . number_format($currBal, 4) . " {$systemCurrency}, Required: " . number_format($costToDeduct, 4) . " {$systemCurrency}). Please contact Superadmin to top up your wallet balance.",
                    'wallet_balance' => $currBal,
                    'required'       => $costToDeduct,
                    'currency'       => $systemCurrency
                ], 402);
            }
        }
    }

    $defaultToken = 'EAATLuWFVcZBkBSIQfQ02NV8tXYHXIOLwZC5CZBMngCZB32TH1f5b9HibzLqjDrnWI30GBOuXLwzaH2j9Iju4RZCpNLDZCaZAFAm9hcaTgcBETEXQDyzcQ3oj53dvuLjxG6Wt2rr9cVh0XhRFqbs2C21rRtZCeJPLcS2sQVJtk05qhxSzA2fmmsnU8dJsBcUZAgpWzv05hAGAS4w5hqYEOqQEMY69H14nuzBAZBng86HwjR3AhMepkZCQQSPFqDAPYERoidjae8S94QHXkgJsutN0q8Dsz0gvSVNGWvuU6HhBwZDZD';
    $defaultPhoneId = '347848611735147';
    $defaultWabaId  = '313160575215815';
    $metaPhoneId     = (!empty($settingsMap['meta_phone_number_id']) && $settingsMap['meta_phone_number_id'] !== '109823471928374') ? $settingsMap['meta_phone_number_id'] : $defaultPhoneId;
    $metaAccessToken = (!empty($settingsMap['meta_access_token']) && !str_starts_with($settingsMap['meta_access_token'], 'EAAJz9284jklasdf')) ? $settingsMap['meta_access_token'] : $defaultToken;
    $businessPhone   = $settingsMap['business_phone_number'] ?? '+91 99954 89008';

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

            // Body parameters (Supports both named parameters e.g. customer_name and positional e.g. 1, 2)
            if (!empty($bodyParams) && is_array($bodyParams)) {
                $paramObjects = [];
                $isAssoc = array_keys($bodyParams) !== range(0, count($bodyParams) - 1);
                
                // Extract template variable names from body_text
                preg_match_all('/\{\{([a-zA-Z0-9_]+)\}\}/', $tmpl['body_text'] ?? '', $varMatches);
                $detectedVarNames = $varMatches[1] ?? [];
                if (empty($detectedVarNames)) {
                    preg_match_all('/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/', $tmpl['body_text'] ?? '', $numMatches);
                    $detectedVarNames = $numMatches[1] ?? [];
                }
                if ($templateName === 'offer_sandslab' && (empty($detectedVarNames) || $detectedVarNames === ['1', '2'])) {
                    $detectedVarNames = ['customer_name', 'contact_number'];
                }

                $pIdx = 0;
                foreach ($bodyParams as $pKey => $val) {
                    $paramItem = ['type' => 'text', 'text' => (string)$val];
                    
                    $varName = null;
                    if ($isAssoc && is_string($pKey)) {
                        $varName = $pKey;
                    } elseif (isset($detectedVarNames[$pIdx])) {
                        $varName = $detectedVarNames[$pIdx];
                    }

                    // If variable is a named identifier (e.g. 'customer_name'), Meta strictly requires 'parameter_name'
                    if (!empty($varName) && !ctype_digit((string)$varName)) {
                        $paramItem['parameter_name'] = (string)$varName;
                    }

                    $paramObjects[] = $paramItem;
                    $pIdx++;
                }

                $components[] = [
                    'type' => 'body',
                    'parameters' => $paramObjects
                ];
            }

            $langCode = !empty($input['language']) 
                ? trim($input['language']) 
                : (!empty($input['language_code']) 
                    ? trim($input['language_code']) 
                    : (!empty($tmpl['language']) ? trim($tmpl['language']) : 'en'));
            if ($templateName === 'hello_world' && empty($input['language'])) {
                $langCode = 'en_US';
            }
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

    // Debit Wallet Balance if sender has an active user account
    $newWalletBalance = null;
    if ($senderUserId && $walletEnforcement && $costToDeduct > 0 && $status !== 'failed') {
        try {
            $uLock = $db->prepare("SELECT id, wallet_balance, currency FROM users WHERE id = ?");
            $uLock->execute([$senderUserId]);
            $uRow = $uLock->fetch();
            if ($uRow) {
                $balBefore = (float)$uRow['wallet_balance'];
                $balAfter  = max(0.0000, $balBefore - $costToDeduct);
                $newWalletBalance = $balAfter;
                
                $updBal = $db->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?");
                $updBal->execute([$balAfter, $senderUserId]);

                $insTx = $db->prepare("
                    INSERT INTO wallet_transactions 
                    (user_id, transaction_type, amount, currency, balance_before, balance_after, reference_type, reference_id, description, performed_by)
                    VALUES (?, 'debit', ?, ?, ?, ?, 'message_dispatch', ?, ?, ?)
                ");
                $insTx->execute([
                    $senderUserId,
                    $costToDeduct,
                    $systemCurrency,
                    $balBefore,
                    $balAfter,
                    $wamid,
                    "WhatsApp {$category} dispatch to {$toPhone}" . ($isSessionReused ? " [24h Window Active: Meta Fee Waived]" : ""),
                    $senderUserId
                ]);
            }
        } catch (Throwable $txEx) {
            error_log("Wallet debit error: " . $txEx->getMessage());
        }
    }

    sendJsonResponse([
        'success'           => true,
        'message_id'        => $wamid,
        'db_id'             => $insertedId,
        'status'            => $status,
        'recipient'         => $toPhone,
        'from_number'       => $businessPhone,
        'category'          => $category,
        'billing_model'     => $billingModel,
        'is_session_reused' => $isSessionReused,
        'rendered_body'     => $finalBody,
        'meta_error'        => $metaError,
        'wallet_balance'    => $newWalletBalance,
        'tariff'            => [
            'meta_cost'       => number_format($resolvedTariff['meta'], 4) . " {$systemCurrency}",
            'platform_charge' => '+' . number_format($resolvedTariff['platform'], 4) . " {$systemCurrency}",
            'client_rate'     => number_format($resolvedTariff['client'], 4) . " {$systemCurrency}",
            'session_status'  => $sessionNote
        ],
        'timestamp'         => $sentAt
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
