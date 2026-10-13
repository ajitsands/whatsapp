<?php
/**
 * Odoo ERP Automated Action & Webhook Controller
 * Version 2.3.0
 * 
 * Secure inbound endpoint for Odoo 14, 15, 16, 17 & 18 Automated Actions (ir.actions.server),
 * native Webhook Automations (base.automation), and dynamic PDF invoice/quote attachment streaming.
 * 
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

// Set CORS & Content-Type
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = Database::getConnection();

// -----------------------------------------------------------------------------
// 1. AUTHENTICATION GATEWAY
// -----------------------------------------------------------------------------
$authResult = authenticateOdooRequest($db);

$action = strtolower(trim($_GET['action'] ?? ''));

// Handle GET Actions (Health Check, Recent Odoo Logs, Template Mapping)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'recent') {
        handleGetRecentOdooMessages($db);
        exit;
    }

    if ($action === 'templates') {
        handleGetOdooCompatibleTemplates($db);
        exit;
    }

    // Default GET: Health and Environment Diagnostic Check
    handleOdooHealthCheck($db, $authResult);
    exit;
}

// Handle POST Actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonInput();

    if ($action === 'simulate' || isset($input['_simulate'])) {
        handleSimulateOdooWebhook($db, $authResult, $input);
        exit;
    }

    handleProcessOdooWebhook($db, $authResult, $input);
    exit;
}

sendJsonResponse(['success' => false, 'error' => 'Method not allowed. Use GET or POST.'], 405);

// =============================================================================
// AUTHENTICATION FUNCTION
// =============================================================================
function authenticateOdooRequest(PDO $db): array {
    // 1. Check X-API-Key Header or Query Param
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? null;
    if (!$apiKey && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            $apiKey = trim($matches[1]);
        }
    }

    if ($apiKey) {
        $stmt = $db->prepare("SELECT id, system_name, api_key, permissions, rate_limit_per_minute, is_active FROM api_keys WHERE api_key = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$apiKey]);
        $keyRecord = $stmt->fetch();
        if ($keyRecord) {
            $upd = $db->prepare("UPDATE api_keys SET last_used_at = NOW() WHERE id = ?");
            $upd->execute([$keyRecord['id']]);
            return [
                'type'        => 'api_key',
                'api_key_id'  => (int)$keyRecord['id'],
                'system_name' => $keyRecord['system_name'],
                'api_key'     => $keyRecord['api_key']
            ];
        } else {
            sendJsonResponse(['success' => false, 'error' => 'Unauthorized: Invalid or deactivated API Key provided.'], 401);
            exit;
        }
    }

    // 2. Allow active session from browser (for developer portal / simulator)
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }
    if (!empty($_SESSION['user_id'])) {
        $stmt = $db->prepare("SELECT id, name, email, role, wallet_balance, currency FROM users WHERE id = ? AND status = 'active' LIMIT 1");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        if ($user) {
            return [
                'type'        => 'session',
                'user'        => $user,
                'system_name' => 'Odoo Developer Console (' . $user['name'] . ')'
            ];
        }
    }

    // 3. Fallback: Lookup default active Odoo API Key if configured in schema
    $stmt = $db->query("SELECT id, system_name, api_key FROM api_keys WHERE system_name LIKE '%Odoo%' AND is_active = 1 LIMIT 1");
    $defaultKey = $stmt->fetch();
    if ($defaultKey && (!empty($_GET['internal_test']) || !empty($_POST['_simulate']))) {
        return [
            'type'        => 'api_key',
            'api_key_id'  => (int)$defaultKey['id'],
            'system_name' => $defaultKey['system_name'],
            'api_key'     => $defaultKey['api_key']
        ];
    }

    sendJsonResponse([
        'success' => false,
        'error'   => 'Unauthorized: Missing or invalid authentication. Please pass header "X-API-Key: <your_odoo_key>" or query parameter "?api_key=<your_odoo_key>".'
    ], 401);
    exit;
}

// =============================================================================
// GET HANDLERS (Health & Info)
// =============================================================================
function handleOdooHealthCheck(PDO $db, array $auth): void {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? 'whatsapp.sandslab.com';
    $baseUrl = "{$scheme}://{$host}";

    $settingsStmt = $db->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('system_currency', 'business_display_name', 'meta_phone_number_id')");
    $settings = [];
    while ($r = $settingsStmt->fetch()) {
        $settings[$r['setting_key']] = $r['setting_value'];
    }

    // Count available templates
    $tCount = (int)$db->query("SELECT COUNT(*) FROM whatsapp_templates WHERE is_active = 1")->fetchColumn();

    sendJsonResponse([
        'success'           => true,
        'gateway_name'      => 'SaNDS Lab WhatsApp - Odoo ERP Integration Gateway',
        'version'           => '2.3.0',
        'status'            => 'ONLINE & READY',
        'authenticated_as'  => $auth['system_name'],
        'auth_type'         => $auth['type'],
        'webhook_endpoints' => [
            'automated_actions' => "{$baseUrl}/api/odoo_webhook.php",
            'direct_messages'   => "{$baseUrl}/api/messages.php",
            'delivery_chatter'  => "{$baseUrl}/api/webhook.php"
        ],
        'supported_models'  => [
            'account.move'    => 'Customer Invoices, Vendor Bills, Credit Notes',
            'sale.order'      => 'Sales Quotations, Order Confirmations, Delivery Notes',
            'account.payment' => 'Customer Receipts, Payment Confirmations',
            'stock.picking'   => 'Delivery Orders, Dispatch Tracking',
            'res.partner'     => 'Customer Portals, Welcome & Verification Notices'
        ],
        'meta_sender'       => $settings['business_display_name'] ?? 'SaNDS Lab Middle East',
        'system_currency'   => $settings['system_currency'] ?? 'BHD',
        'active_templates'  => $tCount,
        'timestamp'         => date('Y-m-d H:i:s')
    ]);
}

function handleGetOdooCompatibleTemplates(PDO $db): void {
    $stmt = $db->query("SELECT id, template_name, display_title, category, header_type, variable_count, meta_status, client_rate_bhd, body_text FROM whatsapp_templates WHERE is_active = 1 ORDER BY id ASC");
    sendJsonResponse([
        'success' => true,
        'data'    => $stmt->fetchAll()
    ]);
}

function handleGetRecentOdooMessages(PDO $db): void {
    $stmt = $db->query("
        SELECT id, message_id, to_phone, category, template_name, message_type, status, error_message, client_rate_bhd, parameters_json, created_at, sent_at, delivered_at, read_at
        FROM whatsapp_messages
        WHERE source_system LIKE '%Odoo%'
        ORDER BY id DESC
        LIMIT 25
    ");
    $records = $stmt->fetchAll();

    // Parse Odoo references
    foreach ($records as &$rec) {
        if (!empty($rec['parameters_json'])) {
            $parsed = json_decode($rec['parameters_json'], true);
            if (is_array($parsed)) {
                $rec['odoo_model']       = $parsed['_odoo_model'] ?? null;
                $rec['odoo_record_id']   = $parsed['_odoo_record_id'] ?? null;
                $rec['odoo_record_name'] = $parsed['_odoo_record_name'] ?? null;
            }
        }
    }

    sendJsonResponse([
        'success' => true,
        'data'    => $records
    ]);
}

// =============================================================================
// MAIN ODOO WEBHOOK DISPATCH PROCESSOR
// =============================================================================
function handleProcessOdooWebhook(PDO $db, array $auth, array $input): void {
    try {
        // Extract Model & Document Reference
        $model       = trim($input['model'] ?? $input['_model'] ?? 'account.move');
        $recordId    = $input['record_id'] ?? $input['id'] ?? null;
        $recordName  = trim((string)($input['record_name'] ?? $input['name'] ?? $input['invoice_number'] ?? $input['order_number'] ?? ''));
        $partnerName = trim((string)($input['partner_name'] ?? $input['customer_name'] ?? $input['name_partner'] ?? 'Valued Customer'));
        
        // Extract Destination Phone
        $rawPhone = trim((string)($input['partner_phone'] ?? $input['phone'] ?? $input['mobile'] ?? $input['to_phone'] ?? $input['recipient'] ?? ''));
        if (empty($rawPhone)) {
            sendJsonResponse([
                'success' => false,
                'error'   => 'Missing recipient phone number. Provide "partner_phone" or "phone" in the payload.'
            ], 400);
            return;
        }

        // Clean & Format Phone with Intelligent Country Code Default
        $cleanDigits = preg_replace('/[^0-9]/', '', $rawPhone);
        if (strpos($rawPhone, '+') === 0) {
            $toPhone = '+' . $cleanDigits;
        } else {
            // If Bahrain 8-digit mobile (e.g. 3xxxxxxx or 6xxxxxxx or 17xxxxxx)
            if (strlen($cleanDigits) === 8 && in_array(substr($cleanDigits, 0, 1), ['3', '6', '1', '7'], true)) {
                $toPhone = '+973' . $cleanDigits;
            } elseif (strlen($cleanDigits) === 10 && in_array(substr($cleanDigits, 0, 1), ['6', '7', '8', '9'], true)) {
                // If India 10-digit mobile
                $toPhone = '+91' . $cleanDigits;
            } else {
                $toPhone = '+' . $cleanDigits;
            }
        }

        // Fetch System Settings
        $settingsStmt = $db->query("SELECT setting_key, setting_value FROM system_settings");
        $settingsMap = [];
        while ($row = $settingsStmt->fetch()) {
            $settingsMap[$row['setting_key']] = $row['setting_value'];
        }

        $systemCurrency    = $settingsMap['system_currency'] ?? 'BHD';
        $walletEnforcement = ($settingsMap['wallet_enforcement'] ?? '1') === '1';
        $billingModel      = $settingsMap['billing_model'] ?? 'per_message';

        // Extract Amount & Date
        $amount = $input['amount'] ?? $input['amount_total'] ?? $input['total_amount'] ?? null;
        $currency = trim((string)($input['currency'] ?? $input['currency_id'] ?? $systemCurrency));
        $formattedAmount = '';
        if ($amount !== null && $amount !== '') {
            $numAmount = (float)$amount;
            $decimals = ($currency === 'BHD' || $currency === 'KWD' || $currency === 'OMR') ? 3 : 2;
            $formattedAmount = "{$currency} " . number_format($numAmount, $decimals);
        } else {
            $formattedAmount = "N/A";
        }

        $dateStr = trim((string)($input['date'] ?? $input['invoice_date'] ?? $input['order_date'] ?? date('d-M-Y')));

        // ---------------------------------------------------------------------
        // Dynamic PDF Handling (URL or Base64 binary)
        // ---------------------------------------------------------------------
        $mediaUrl  = trim((string)($input['pdf_url'] ?? $input['attachment_url'] ?? $input['media_url'] ?? ''));
        $mediaName = trim((string)($input['pdf_name'] ?? $input['filename'] ?? ($recordName ? "{$recordName}.pdf" : 'document.pdf')));
        $pdfBase64 = trim((string)($input['pdf_base64'] ?? $input['attachment_base64'] ?? ''));

        if (!empty($pdfBase64)) {
            // Strip data URI scheme if present (e.g., data:application/pdf;base64,...)
            if (preg_match('/^data:([^;]+);base64,(.*)$/s', $pdfBase64, $b64Matches)) {
                $pdfBase64 = $b64Matches[2];
            }

            $binaryData = base64_decode($pdfBase64, true);
            if ($binaryData !== false && strlen($binaryData) > 50) {
                $uploadsDir = __DIR__ . '/../uploads/odoo_docs';
                if (!is_dir($uploadsDir)) {
                    @mkdir($uploadsDir, 0755, true);
                }

                $cleanDocName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $recordName ?: 'doc');
                $uniqueFile   = $cleanDocName . '_' . substr(bin2hex(random_bytes(8)), 0, 8) . '.pdf';
                $filePath     = $uploadsDir . '/' . $uniqueFile;

                if (@file_put_contents($filePath, $binaryData) !== false) {
                    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                    $host   = $_SERVER['HTTP_HOST'] ?? 'whatsapp.sandslab.com';
                    $mediaUrl = "{$scheme}://{$host}/uploads/odoo_docs/{$uniqueFile}";
                    $mediaName = $uniqueFile;
                }
            }
        }

        // ---------------------------------------------------------------------
        // Template Selection & Dynamic Auto-Mapping
        // ---------------------------------------------------------------------
        $templateName = trim((string)($input['template_name'] ?? $input['template'] ?? ''));
        
        if (empty($templateName)) {
            // Smart Model Default Mapping
            if ($model === 'account.move') {
                $templateName = 'uniglobal_invoice_notification';
            } elseif ($model === 'sale.order') {
                $templateName = 'uniglobal_delivery_dispatch';
            } elseif ($model === 'account.payment') {
                $templateName = 'uniglobal_invoice_notification';
            } elseif ($model === 'stock.picking') {
                $templateName = 'uniglobal_delivery_dispatch';
            } else {
                $templateName = 'uniglobal_invoice_notification';
            }
        }

        // Fetch Template from DB
        $tStmt = $db->prepare("SELECT * FROM whatsapp_templates WHERE template_name = ? AND is_active = 1 LIMIT 1");
        $tStmt->execute([$templateName]);
        $tmpl = $tStmt->fetch();

        if (!$tmpl) {
            // Fallback to active template
            $tStmt = $db->query("SELECT * FROM whatsapp_templates WHERE is_active = 1 ORDER BY id ASC LIMIT 1");
            $tmpl = $tStmt->fetch();
            $templateName = $tmpl ? $tmpl['template_name'] : 'uniglobal_invoice_notification';
        }

        $category = $tmpl ? $tmpl['category'] : 'UTILITY';

        // ---------------------------------------------------------------------
        // Variable Parameter Mapping
        // ---------------------------------------------------------------------
        $bodyParams = $input['body_parameters'] ?? $input['parameters'] ?? $input['params'] ?? null;

        if (empty($bodyParams) || !is_array($bodyParams)) {
            // Build tailored parameters based on template requirements
            if ($templateName === 'uniglobal_invoice_notification') {
                // 4 parameters: [Customer Name, Invoice Number, Amount, Date]
                $bodyParams = [
                    $partnerName,
                    $recordName ?: 'INV-PREVIEW',
                    $formattedAmount,
                    $dateStr
                ];
            } elseif ($templateName === 'uniglobal_delivery_dispatch') {
                // 4 parameters: [Customer Name, Order Number, Tracking Ref, Expected Delivery]
                $bodyParams = [
                    $partnerName,
                    $recordName ?: 'SO-PREVIEW',
                    'TRK-' . ($recordName ?: 'EXP'),
                    $dateStr
                ];
            } elseif ($templateName === 'offer_sandslab') {
                $bodyParams = [
                    'customer_name'  => $partnerName,
                    'contact_number' => '+973 1700 8899'
                ];
            } elseif ($templateName === 'uniglobal_support_welcome') {
                $bodyParams = [
                    $partnerName,
                    $recordName ?: 'TCK-001',
                    'Inquiry regarding ' . ($recordName ?: 'Services')
                ];
            } elseif ($templateName === 'uniglobal_otp_verification') {
                $bodyParams = [
                    $recordName ?: '849201'
                ];
            } else {
                $bodyParams = [$partnerName, $recordName ?: 'REF', $formattedAmount, $dateStr];
            }
        }

        // Header media type
        $headerType = strtoupper(trim($tmpl['header_type'] ?? 'NONE'));
        if (empty($mediaUrl) && $headerType !== 'NONE' && !empty($tmpl['header_sample'])) {
            $mediaUrl = $tmpl['header_sample'];
        }

        // ---------------------------------------------------------------------
        // Charging Engine & 24h Meta Deduplication (Option A vs B)
        // ---------------------------------------------------------------------
        $catKey = strtolower($category === 'AUTHENTICATION' ? 'auth' : $category);
        $metaRate     = (float)($settingsMap["tariff_{$catKey}_meta"] ?? 0.0140);
        $platformRate = (float)($settingsMap["tariff_{$catKey}_platform"] ?? 0.0045);

        if ($tmpl) {
            $metaRate     = (float)$tmpl['meta_cost_bhd'];
            $platformRate = (float)$tmpl['platform_charge_bhd'];
        }

        $isSessionReused = false;
        $sessionNote     = "Standard Per-Message Billing (Option A)";

        if ($billingModel === '24h_session') {
            $cleanRecipient = preg_replace('/[^0-9]/', '', $toPhone);
            $sessionStmt = $db->prepare("
                SELECT id, created_at FROM whatsapp_messages 
                WHERE (to_phone = ? OR REPLACE(REPLACE(to_phone, '+', ''), ' ', '') = ?)
                  AND category = ? 
                  AND status IN ('sent', 'delivered', 'read')
                  AND created_at >= (NOW() - INTERVAL 24 HOUR)
                ORDER BY created_at DESC LIMIT 1
            ");
            $sessionStmt->execute([$toPhone, $cleanRecipient, $category]);
            $activeSession = $sessionStmt->fetch();

            if ($activeSession) {
                $isSessionReused = true;
                $metaRate = 0.0000;
                $sessionNote = "24h Session Active (Opened at {$activeSession['created_at']}) - Meta Fee Waived";
            } else {
                $sessionNote = "New 24h Meta Conversation Session Opened";
            }
        }

        $costToDeduct = $metaRate + $platformRate;

        // ---------------------------------------------------------------------
        // Meta Cloud API cURL Dispatch
        // ---------------------------------------------------------------------
        $defaultToken = 'EAATLuWFVcZBkBSIQfQ02NV8tXYHXIOLwZC5CZBMngCZB32TH1f5b9HibzLqjDrnWI30GBOuXLwzaH2j9Iju4RZCpNLDZCaZAFAm9hcaTgcBETEXQDyzcQ3oj53dvuLjxG6Wt2rr9cVh0XhRFqbs2C21rRtZCeJPLcS2sQVJtk05qhxSzA2fmmsnU8dJsBcUZAgpWzv05hAGAS4w5hqYEOqQEMY69H14nuzBAZBng86HwjR3AhMepkZCQQSPFqDAPYERoidjae8S94QHXkgJsutN0q8Dsz0gvSVNGWvuU6HhBwZDZD';
        $defaultPhoneId = '347848611735147';
        $metaPhoneId     = (!empty($settingsMap['meta_phone_number_id']) && $settingsMap['meta_phone_number_id'] !== '109823471928374') ? $settingsMap['meta_phone_number_id'] : $defaultPhoneId;
        $metaAccessToken = (!empty($settingsMap['meta_access_token']) && !str_starts_with($settingsMap['meta_access_token'], 'EAAJz9284jklasdf')) ? $settingsMap['meta_access_token'] : $defaultToken;
        $businessPhone   = $settingsMap['business_phone_number'] ?? '+91 99954 89008';

        $cleanRecipient = preg_replace('/[^0-9]/', '', $toPhone);
        $wamid = 'wamid.HBgL' . base64_encode($toPhone . ':' . bin2hex(random_bytes(16)));
        $status = 'queued';
        $metaError = null;

        $metaPayload = [
            'messaging_product' => 'whatsapp',
            'recipient_type'    => 'individual',
            'to'                => $cleanRecipient,
            'type'              => 'template'
        ];

        $components = [];

        // Header Media
        if (!empty($mediaUrl) && $headerType !== 'NONE') {
            if ($headerType === 'DOCUMENT') {
                $components[] = [
                    'type' => 'header',
                    'parameters' => [
                        [
                            'type'     => 'document',
                            'document' => [
                                'link'     => $mediaUrl,
                                'filename' => $mediaName ?: 'invoice.pdf'
                            ]
                        ]
                    ]
                ];
            } elseif ($headerType === 'IMAGE') {
                $components[] = [
                    'type' => 'header',
                    'parameters' => [
                        [
                            'type'  => 'image',
                            'image' => [
                                'link' => $mediaUrl
                            ]
                        ]
                    ]
                ];
            }
        }

        // Body Parameters
        if (!empty($bodyParams)) {
            $paramObjects = [];
            $isAssoc = array_keys($bodyParams) !== range(0, count($bodyParams) - 1);

            // Extract variable names from template
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
            foreach ($bodyParams as $pKey => $pVal) {
                $paramItem = ['type' => 'text', 'text' => (string)$pVal];
                $varName = null;
                if ($isAssoc && is_string($pKey)) {
                    $varName = $pKey;
                } elseif (isset($detectedVarNames[$pIdx])) {
                    $varName = $detectedVarNames[$pIdx];
                }

                if (!empty($varName) && !ctype_digit((string)$varName)) {
                    $paramItem['parameter_name'] = (string)$varName;
                }

                $paramObjects[] = $paramItem;
                $pIdx++;
            }

            $components[] = [
                'type'       => 'body',
                'parameters' => $paramObjects
            ];
        }

        $langCode = !empty($tmpl['language']) ? trim($tmpl['language']) : 'en';
        if ($templateName === 'hello_world') $langCode = 'en_US';

        $metaPayload['template'] = [
            'name'     => $templateName,
            'language' => ['code' => $langCode]
        ];
        if (!empty($components)) {
            $metaPayload['template']['components'] = $components;
        }

        // Dispatch cURL to Meta Cloud API
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
        } else {
            $status = 'failed';
            $errMsg = $resJson['error']['message'] ?? ($resRaw ?: 'Meta HTTP Error ' . $httpCode);
            if (!empty($resJson['error']['error_data']['details'])) {
                $errMsg .= ' (' . $resJson['error']['error_data']['details'] . ')';
            }
            $metaError = $errMsg;
        }

        // ---------------------------------------------------------------------
        // Render Final Body for Logs
        // ---------------------------------------------------------------------
        $finalBody = $tmpl['body_text'] ?? "Odoo ERP Notification: {$recordName}";
        if (!empty($bodyParams)) {
            $isAssoc = array_keys($bodyParams) !== range(0, count($bodyParams) - 1);
            $pIdx = 0;
            foreach ($bodyParams as $pKey => $paramVal) {
                $targetVar = ($isAssoc && is_string($pKey)) ? $pKey : ($detectedVarNames[$pIdx] ?? ($pIdx + 1));
                $finalBody = str_replace('{{' . $targetVar . '}}', (string)$paramVal, $finalBody);
                $finalBody = preg_replace('/\{+[\(\[]?\s*' . preg_quote((string)$targetVar, '/') . '\s*[\)\]]?\}+/', (string)$paramVal, $finalBody);
                $pIdx++;
            }
        }

        // Construct Meta Parameters with Odoo Context Tracking
        $savedParams = [
            'body_parameters'    => $bodyParams,
            '_odoo_model'        => $model,
            '_odoo_record_id'    => $recordId,
            '_odoo_record_name'  => $recordName,
            '_odoo_callback_url' => $input['callback_url'] ?? null,
            '_source'            => 'Odoo Automated Action'
        ];

        $sourceSystem = "Odoo ERP ({$model})";

        // Insert Record into `whatsapp_messages`
        $sentAt = ($status === 'sent') ? date('Y-m-d H:i:s') : null;
        $insStmt = $db->prepare("
            INSERT INTO whatsapp_messages (
                message_id, direction, source_system, to_phone, from_phone, category,
                template_name, message_type, message_body, header_media_url, header_media_name,
                parameters_json, status, error_message, meta_cost_bhd, platform_charge_bhd, client_rate_bhd,
                sent_at, delivered_at
            ) VALUES (
                ?, 'outbound', ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, NULL
            )
        ");

        $insStmt->execute([
            $wamid,
            $sourceSystem,
            $toPhone,
            $businessPhone,
            $category,
            $templateName,
            (!empty($mediaUrl) ? 'document' : 'template'),
            $finalBody,
            $mediaUrl ?: null,
            $mediaName ?: null,
            json_encode($savedParams),
            $status,
            $metaError,
            $metaRate,
            $platformRate,
            $costToDeduct,
            $sentAt
        ]);

        $dbId = (int)$db->lastInsertId();

        // Structured JSON Response for Odoo
        sendJsonResponse([
            'success'        => ($status === 'sent'),
            'message'        => ($status === 'sent') 
                                ? "WhatsApp template [{$templateName}] dispatched successfully to {$toPhone}"
                                : "Dispatch failed: {$metaError}",
            'message_id'     => $wamid,
            'db_id'          => $dbId,
            'status'         => $status,
            'recipient'      => $toPhone,
            'partner_name'   => $partnerName,
            'template_name'  => $templateName,
            'odoo_ref'       => [
                'model'       => $model,
                'record_id'   => $recordId,
                'record_name' => $recordName
            ],
            'attachment_url' => $mediaUrl ?: null,
            'tariff'         => [
                'meta_cost'       => number_format($metaRate, 4) . " {$systemCurrency}",
                'platform_charge' => '+' . number_format($platformRate, 4) . " {$systemCurrency}",
                'client_rate'     => number_format($costToDeduct, 4) . " {$systemCurrency}",
                'session_status'  => $sessionNote
            ],
            'meta_error'     => $metaError,
            'timestamp'      => $sentAt ?: date('Y-m-d H:i:s')
        ], ($status === 'sent' ? 201 : 400));

    } catch (Throwable $e) {
        sendJsonResponse([
            'success' => false,
            'error'   => 'Odoo Webhook Controller Exception: ' . $e->getMessage()
        ], 500);
    }
}

// =============================================================================
// SIMULATION HANDLER
// =============================================================================
function handleSimulateOdooWebhook(PDO $db, array $auth, array $input): void {
    // Fill realistic simulated values
    $simModel = $input['model'] ?? 'account.move';
    $simData = [
        'model'           => $simModel,
        'record_id'       => $input['record_id'] ?? rand(100, 999),
        'record_name'     => $input['record_name'] ?? ($simModel === 'sale.order' ? 'SO-' . rand(1000, 9999) : 'INV/' . date('Y') . '/' . sprintf('%04d', rand(1, 999))),
        'partner_name'    => $input['partner_name'] ?? 'Ahmed Al-Khalifa',
        'partner_phone'   => $input['partner_phone'] ?? '+97335078079',
        'amount'          => $input['amount'] ?? '345.500',
        'currency'        => $input['currency'] ?? 'BHD',
        'date'            => $input['date'] ?? date('d-M-Y'),
        'template_name'   => $input['template_name'] ?? ($simModel === 'sale.order' ? 'uniglobal_delivery_dispatch' : 'uniglobal_invoice_notification'),
        'pdf_url'         => $input['pdf_url'] ?? 'https://whatsapp.sandslab.com/assets/images/sample_invoice.pdf',
        'callback_url'    => $input['callback_url'] ?? 'https://whatsapp.sandslab.com/api/odoo_webhook.php?action=simulate_callback'
    ];

    handleProcessOdooWebhook($db, $auth, $simData);
}
