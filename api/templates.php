<?php
/**
 * WhatsApp Templates API Endpoint (v2.4.0)
 * Handles Template Catalog, Variable Management, Tariffs,
 * Active/Inactive Toggles, and Direct Meta Graph API Submission & Sync
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest();
$db   = Database::getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Helper to retrieve Meta Graph API credentials
function getMetaCredentials(PDO $db): array {
    $settingsStmt = $db->query("SELECT setting_key, setting_value FROM system_settings");
    $settings = $settingsStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $defaultToken = 'EAATLuWFVcZBkBSIQfQ02NV8tXYHXIOLwZC5CZBMngCZB32TH1f5b9HibzLqjDrnWI30GBOuXLwzaH2j9Iju4RZCpNLDZCaZAFAm9hcaTgcBETEXQDyzcQ3oj53dvuLjxG6Wt2rr9cVh0XhRFqbs2C21rRtZCeJPLcS2sQVJtk05qhxSzA2fmmsnU8dJsBcUZAgpWzv05hAGAS4w5hqYEOqQEMY69H14nuzBAZBng86HwjR3AhMepkZCQQSPFqDAPYERoidjae8S94QHXkgJsutN0q8Dsz0gvSVNGWvuU6HhBwZDZD';
    $defaultWabaId = '313160575215815';

    $token  = (!empty($settings['meta_access_token']) && !str_starts_with($settings['meta_access_token'], 'EAAJz9284jklasdf')) ? $settings['meta_access_token'] : $defaultToken;
    $wabaId = (!empty($settings['meta_waba_account_id']) && $settings['meta_waba_account_id'] !== '981273918237192') ? $settings['meta_waba_account_id'] : $defaultWabaId;

    return ['token' => $token, 'waba_id' => $wabaId];
}

switch ($method) {
    case 'GET':
        // ACTION: Sync Approval Statuses Directly with Meta Graph API
        if ($action === 'sync_meta') {
            $creds = getMetaCredentials($db);
            $token = $creds['token'];
            $wabaId = $creds['waba_id'];

            $ch = curl_init("https://graph.facebook.com/v20.0/{$wabaId}/message_templates?limit=100&fields=name,status,category,language,components");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => ["Authorization: Bearer {$token}"],
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => 0,
                CURLOPT_TIMEOUT => 25
            ]);
            $raw = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $metaJson = json_decode((string)$raw, true);
            if ($httpCode !== 200 || !isset($metaJson['data'])) {
                sendJsonResponse([
                    'success' => false,
                    'error'   => $metaJson['error']['message'] ?? 'Failed to query Meta message templates API (HTTP ' . $httpCode . ')'
                ], 500);
            }

            $syncedCount = 0;
            $stmtCheck = $db->prepare("SELECT id, meta_status FROM whatsapp_templates WHERE template_name = ? LIMIT 1");
            $stmtUpdate = $db->prepare("UPDATE whatsapp_templates SET meta_status = ?, updated_at = NOW() WHERE id = ?");
            $stmtInsert = $db->prepare("
                INSERT INTO whatsapp_templates (
                    template_name, display_title, category, language,
                    header_type, body_text, meta_status, is_active,
                    meta_cost_bhd, platform_charge_bhd, client_rate_bhd
                ) VALUES (?, ?, ?, ?, 'NONE', ?, ?, 1, 0.0140, 0.0045, 0.0185)
            ");

            foreach ($metaJson['data'] as $mTmpl) {
                $mName = $mTmpl['name'] ?? '';
                $mStatus = strtoupper($mTmpl['status'] ?? 'APPROVED');
                $mCat = strtoupper($mTmpl['category'] ?? 'UTILITY');
                $mLang = $mTmpl['language'] ?? 'en_US';

                if (empty($mName)) continue;

                $stmtCheck->execute([$mName]);
                $local = $stmtCheck->fetch();

                if ($local) {
                    $stmtUpdate->execute([$mStatus, $local['id']]);
                    $syncedCount++;
                } else {
                    // Extract body text if present
                    $bodyText = "Template {$mName}";
                    if (!empty($mTmpl['components'])) {
                        foreach ($mTmpl['components'] as $c) {
                            if (($c['type'] ?? '') === 'BODY' && !empty($c['text'])) {
                                $bodyText = $c['text'];
                                break;
                            }
                        }
                    }
                    $dispTitle = ucwords(str_replace('_', ' ', $mName));
                    $stmtInsert->execute([$mName, $dispTitle, $mCat, $mLang, $bodyText, $mStatus]);
                    $syncedCount++;
                }
            }

            sendJsonResponse([
                'success'      => true,
                'message'      => "Synced {$syncedCount} templates from Meta WABA successfully",
                'synced_count' => $syncedCount,
                'total_meta'   => count($metaJson['data'])
            ]);
            break;
        }

        // DEFAULT GET: Fetch Template Catalog
        $activeOnly = !empty($_GET['active_only']);
        $sql = "SELECT * FROM whatsapp_templates";
        if ($activeOnly) {
            $sql .= " WHERE is_active = 1";
        }
        $sql .= " ORDER BY id DESC";

        $stmt = $db->query($sql);
        $templates = $stmt->fetchAll();

        // Dynamically compute variable counts and sample arrays
        foreach ($templates as &$tmpl) {
            preg_match_all('/\{\{([a-zA-Z0-9_]+)\}\}/', $tmpl['body_text'] ?? '', $varMatches);
            $varNames = $varMatches[1] ?? [];
            if (empty($varNames)) {
                preg_match_all('/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/', $tmpl['body_text'] ?? '', $numMatches);
                $varNames = $numMatches[1] ?? [];
            }
            $computedCount = count($varNames);
            if ($computedCount > (int)$tmpl['variable_count']) {
                $tmpl['variable_count'] = $computedCount;
            }
            $existing = !empty($tmpl['sample_params_json']) ? json_decode($tmpl['sample_params_json'], true) : [];
            if (!is_array($existing)) $existing = [];
            $needed = max($computedCount, (int)$tmpl['variable_count']);
            for ($i = count($existing); $i < $needed; $i++) {
                $varLabel = $varNames[$i] ?? ("Param " . ($i + 1));
                $existing[] = "Sample " . $varLabel;
            }
            $tmpl['sample_params_json'] = json_encode($existing);
            $tmpl['variable_names'] = $varNames;
            $tmpl['is_active'] = isset($tmpl['is_active']) ? (int)$tmpl['is_active'] : 1;
        }
        unset($tmpl);

        sendJsonResponse(['success' => true, 'data' => $templates]);
        break;

    case 'POST':
        $input = getJsonInput();
        $postAction = $action ?: ($input['action'] ?? '');

        // ACTION: 1-Click Toggle Active / Inactive
        if ($postAction === 'toggle_active') {
            $id = (int)($input['id'] ?? 0);
            if (!$id) {
                sendJsonResponse(['success' => false, 'error' => 'Template ID required'], 400);
            }
            $isActive = !empty($input['is_active']) ? 1 : 0;
            $stmt = $db->prepare("UPDATE whatsapp_templates SET is_active = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$isActive, $id]);

            sendJsonResponse([
                'success'   => true,
                'id'        => $id,
                'is_active' => $isActive,
                'message'   => $isActive ? 'Template activated successfully' : 'Template paused / deactivated'
            ]);
            break;
        }

        // Template Field Parsing
        $id = !empty($input['id']) ? (int)$input['id'] : null;
        $templateName = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '_', trim($input['template_name'] ?? '')));
        $templateName = trim($templateName, '_');
        $displayTitle = trim($input['display_title'] ?? $templateName);
        $category     = strtoupper(trim($input['category'] ?? 'UTILITY'));
        $language     = trim($input['language'] ?? 'en_US');
        $headerType   = strtoupper(trim($input['header_type'] ?? 'NONE'));
        $headerSample = trim($input['header_sample'] ?? '');
        $bodyText     = trim($input['body_text'] ?? '');
        $footerText   = trim($input['footer_text'] ?? '');
        $buttonsJson  = !empty($input['buttons_json']) ? (is_string($input['buttons_json']) ? $input['buttons_json'] : json_encode($input['buttons_json'])) : null;
        $isActive     = isset($input['is_active']) ? (int)$input['is_active'] : 1;
        $submitToMeta = !empty($input['submit_to_meta']) || ($postAction === 'submit_meta');

        if (empty($templateName) || empty($bodyText)) {
            sendJsonResponse(['success' => false, 'error' => 'Template key and message body text are required'], 400);
        }

        // Count variables: support {{1}}, {{2}}, {{customer_name}}, etc.
        preg_match_all('/\{\{([a-zA-Z0-9_]+)\}\}/', $bodyText, $varMatches);
        $varNames = $varMatches[1] ?? [];
        if (empty($varNames)) {
            preg_match_all('/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/', $bodyText, $numMatches);
            $varNames = $numMatches[1] ?? [];
        }
        $variableCount = count($varNames);

        // Parse Sample Params for Meta
        $sampleParams = !empty($input['sample_params']) ? $input['sample_params'] : (!empty($input['sample_params_json']) ? json_decode($input['sample_params_json'], true) : []);
        if (!is_array($sampleParams)) $sampleParams = [];
        for ($i = count($sampleParams); $i < $variableCount; $i++) {
            $sampleParams[] = "Sample " . ($varNames[$i] ?? ($i + 1));
        }
        $sampleParamsJson = json_encode($sampleParams);

        // Tariffs based on Category
        $tariffs = [
            'AUTHENTICATION' => ['meta' => 0.0110, 'platform' => 0.0035, 'client' => 0.0145],
            'UTILITY'        => ['meta' => 0.0140, 'platform' => 0.0045, 'client' => 0.0185],
            'MARKETING'      => ['meta' => 0.0270, 'platform' => 0.0070, 'client' => 0.0340],
            'SERVICE'        => ['meta' => 0.0075, 'platform' => 0.0025, 'client' => 0.0100],
        ];
        $t = $tariffs[$category] ?? $tariffs['UTILITY'];

        $metaStatus = 'APPROVED';
        $metaResponseData = null;

        // ACTION: Submit Directly to Meta Graph API for Official Approval
        if ($submitToMeta) {
            $creds = getMetaCredentials($db);
            $token = $creds['token'];
            $wabaId = $creds['waba_id'];

            // Build Meta Components Array
            $components = [];

            // 1. Header Component
            if ($headerType !== 'NONE') {
                if ($headerType === 'TEXT') {
                    $headerComp = [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => $headerSample ?: $displayTitle
                    ];
                    if (str_contains($headerComp['text'], '{{1}}')) {
                        $headerComp['example'] = ['header_text' => ['Sample Headline']];
                    }
                    $components[] = $headerComp;
                } else {
                    $mediaHandle = $headerSample ?: 'https://whatsapp.sandslab.com/assets/images/QRCodePoster.jpg';
                    $components[] = [
                        'type' => 'HEADER',
                        'format' => $headerType,
                        'example' => [
                            'header_handle' => [$mediaHandle]
                        ]
                    ];
                }
            }

            // 2. Body Component (With Mandatory Sample Variables Example)
            $bodyComp = [
                'type' => 'BODY',
                'text' => $bodyText
            ];
            if ($variableCount > 0) {
                $sampleRow = [];
                for ($v = 0; $v < $variableCount; $v++) {
                    $sampleRow[] = !empty($sampleParams[$v]) ? (string)$sampleParams[$v] : ("Value " . ($v + 1));
                }
                $bodyComp['example'] = [
                    'body_text' => [$sampleRow]
                ];
            }
            $components[] = $bodyComp;

            // 3. Footer Component
            if (!empty($footerText)) {
                $components[] = [
                    'type' => 'FOOTER',
                    'text' => $footerText
                ];
            }

            // 4. Buttons Component (Optional)
            if (!empty($buttonsJson)) {
                $parsedButtons = json_decode($buttonsJson, true);
                if (is_array($parsedButtons) && !empty($parsedButtons)) {
                    $components[] = [
                        'type' => 'BUTTONS',
                        'buttons' => $parsedButtons
                    ];
                }
            }

            $metaPayload = [
                'name'       => $templateName,
                'category'   => $category,
                'language'   => $language,
                'components' => $components
            ];

            // cURL Dispatch to Meta
            $ch = curl_init("https://graph.facebook.com/v20.0/{$wabaId}/message_templates");
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($metaPayload),
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bearer {$token}",
                    "Content-Type: application/json"
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => 0,
                CURLOPT_TIMEOUT => 30
            ]);
            $metaRaw = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $metaRes = json_decode((string)$metaRaw, true);

            if ($httpCode >= 400 || empty($metaRes['id'])) {
                $errMsg = $metaRes['error']['message'] ?? ('Meta rejected template creation (HTTP ' . $httpCode . ')');
                if (!empty($metaRes['error']['error_user_msg'])) {
                    $errMsg .= ' — ' . $metaRes['error']['error_user_msg'];
                }
                sendJsonResponse([
                    'success'      => false,
                    'error'        => $errMsg,
                    'meta_details' => $metaRes['error'] ?? null,
                    'meta_payload' => $metaPayload
                ], 400);
            }

            $metaStatus = strtoupper($metaRes['status'] ?? 'PENDING');
            $metaResponseData = $metaRes;
        }

        // Save Record into Local Database
        if ($id) {
            $stmt = $db->prepare("
                UPDATE whatsapp_templates SET
                    template_name = ?, display_title = ?, category = ?, language = ?,
                    header_type = ?, header_sample = ?, body_text = ?, footer_text = ?, buttons_json = ?,
                    variable_count = ?, sample_params_json = ?, meta_status = ?, is_active = ?,
                    meta_cost_bhd = ?, platform_charge_bhd = ?, client_rate_bhd = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $templateName, $displayTitle, $category, $language,
                $headerType, $headerSample ?: null, $bodyText, $footerText ?: null, $buttonsJson,
                $variableCount, $sampleParamsJson, $metaStatus, $isActive,
                $t['meta'], $t['platform'], $t['client'], $id
            ]);
            sendJsonResponse([
                'success'        => true,
                'message'        => $submitToMeta ? "Template submitted to Meta! Status: {$metaStatus}" : 'Template updated successfully',
                'id'             => $id,
                'meta_status'    => $metaStatus,
                'meta_submitted' => $submitToMeta,
                'meta_response'  => $metaResponseData
            ]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO whatsapp_templates (
                    template_name, display_title, category, language,
                    header_type, header_sample, body_text, footer_text, buttons_json,
                    variable_count, sample_params_json, meta_status, is_active,
                    meta_cost_bhd, platform_charge_bhd, client_rate_bhd
                ) VALUES (
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?
                )
            ");
            $stmt->execute([
                $templateName, $displayTitle, $category, $language,
                $headerType, $headerSample ?: null, $bodyText, $footerText ?: null, $buttonsJson,
                $variableCount, $sampleParamsJson, $metaStatus, $isActive,
                $t['meta'], $t['platform'], $t['client']
            ]);
            $newId = (int)$db->lastInsertId();
            sendJsonResponse([
                'success'        => true,
                'message'        => $submitToMeta ? "Template submitted to Meta successfully! Status: {$metaStatus}" : 'Template registered in catalog',
                'id'             => $newId,
                'meta_status'    => $metaStatus,
                'meta_submitted' => $submitToMeta,
                'meta_response'  => $metaResponseData
            ], 201);
        }
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendJsonResponse(['success' => false, 'error' => 'Template ID required'], 400);
        }
        $stmt = $db->prepare("DELETE FROM whatsapp_templates WHERE id = ?");
        $stmt->execute([$id]);
        sendJsonResponse(['success' => true, 'message' => 'Template deleted from catalog']);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
