<?php
/**
 * WhatsApp Bulk Campaign Broadcasts & Queue Pacing API
 * Version 2.2.0
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest();
$db   = Database::getConnection();

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

switch ($action) {
    case 'list':
        handleListCampaigns($db);
        break;

    case 'details':
        handleCampaignDetails($db);
        break;

    case 'create':
        handleCreateCampaign($db, $auth);
        break;

    case 'process_batch':
        handleProcessBatch($db, $auth);
        break;

    case 'pause':
        handleUpdateCampaignStatus($db, 'paused');
        break;

    case 'resume':
        handleUpdateCampaignStatus($db, 'running');
        break;

    case 'cancel':
        handleUpdateCampaignStatus($db, 'cancelled');
        break;

    case 'rerun':
        handleRerunCampaign($db);
        break;

    case 'sample_csv':
        handleSampleCsv($db);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => "Unknown action '{$action}'"], 400);
        break;
}

/**
 * 1. GET List All Campaigns with Summary Stats
 */
function handleListCampaigns(PDO $db): void {
    $stmt = $db->query("
        SELECT 
            c.*,
            t.display_title AS template_title,
            t.client_rate_bhd AS template_rate,
            (SELECT COUNT(*) FROM campaign_recipients cr WHERE cr.campaign_id = c.id AND cr.status = 'pending') AS pending_count,
            (SELECT COUNT(*) FROM campaign_recipients cr LEFT JOIN whatsapp_messages wm ON wm.message_id = cr.message_id WHERE cr.campaign_id = c.id AND (cr.status IN ('delivered', 'read') OR wm.status IN ('delivered', 'read'))) AS live_delivered_count,
            (SELECT COUNT(*) FROM campaign_recipients cr LEFT JOIN whatsapp_messages wm ON wm.message_id = cr.message_id WHERE cr.campaign_id = c.id AND (cr.status = 'read' OR wm.status = 'read')) AS live_read_count
        FROM campaigns c
        LEFT JOIN whatsapp_templates t ON t.template_name = c.template_name
        ORDER BY c.id DESC
    ");
    $campaigns = $stmt->fetchAll();

    // Overall Aggregate Metrics
    $totalCampaigns = count($campaigns);
    $totalRecipients = 0;
    $totalSent = 0;
    $totalDelivered = 0;
    $totalRead = 0;
    $totalFailed = 0;
    $totalSpend = 0.0;

    foreach ($campaigns as &$c) {
        // Sync live delivery count if higher
        $liveDeliv = (int)($c['live_delivered_count'] ?? 0);
        $liveRead  = (int)($c['live_read_count'] ?? 0);
        if ($liveDeliv > (int)$c['delivered_count']) {
            $c['delivered_count'] = $liveDeliv;
        }
        if ($liveRead > (int)$c['read_count']) {
            $c['read_count'] = $liveRead;
        }

        $c['progress_percent'] = $c['total_recipients'] > 0
            ? round((($c['sent_count'] + $c['failed_count']) / $c['total_recipients']) * 100, 1)
            : 0;

        $c['delivery_rate'] = $c['sent_count'] > 0
            ? round(($c['delivered_count'] / $c['sent_count']) * 100, 1)
            : 0;

        $c['read_rate'] = $c['sent_count'] > 0
            ? round(($c['read_count'] / $c['sent_count']) * 100, 1)
            : 0;

        $totalRecipients += (int)$c['total_recipients'];
        $totalSent += (int)$c['sent_count'];
        $totalDelivered += (int)$c['delivered_count'];
        $totalRead += (int)$c['read_count'];
        $totalFailed += (int)$c['failed_count'];
        $totalSpend += (float)$c['actual_cost'];
    }

    sendJsonResponse([
        'success'   => true,
        'summary'   => [
            'total_campaigns'       => $totalCampaigns,
            'total_recipients'      => $totalRecipients,
            'total_sent'            => $totalSent,
            'total_delivered'       => $totalDelivered,
            'total_read'            => $totalRead,
            'total_failed'          => $totalFailed,
            'total_spend'           => round($totalSpend, 4),
            'overall_delivery_rate' => $totalSent > 0 ? round(($totalDelivered / $totalSent) * 100, 1) : 0,
            'overall_read_rate'     => $totalSent > 0 ? round(($totalRead / $totalSent) * 100, 1) : 0,
        ],
        'campaigns' => $campaigns
    ]);
}

/**
 * 2. GET Campaign Details & Recipient Log
 */
function handleCampaignDetails(PDO $db): void {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Campaign ID is required'], 400);
    }

    $stmt = $db->prepare("
        SELECT c.*, t.display_title AS template_title, t.body_text, t.client_rate_bhd AS template_rate
        FROM campaigns c
        LEFT JOIN whatsapp_templates t ON t.template_name = c.template_name
        WHERE c.id = ?
    ");
    $stmt->execute([$id]);
    $campaign = $stmt->fetch();

    if (!$campaign) {
        sendJsonResponse(['success' => false, 'error' => 'Campaign not found'], 404);
    }

    // Recipients with live message status
    $stmtRec = $db->prepare("
        SELECT 
            cr.*,
            IFNULL(wm.status, cr.status) AS live_delivery_status,
            wm.delivered_at,
            wm.read_at
        FROM campaign_recipients cr
        LEFT JOIN whatsapp_messages wm ON wm.message_id = cr.message_id
        WHERE cr.campaign_id = ?
        ORDER BY cr.id ASC
        LIMIT 500
    ");
    $stmtRec->execute([$id]);
    $recipients = $stmtRec->fetchAll();

    foreach ($recipients as &$r) {
        if (!empty($r['live_delivery_status']) && in_array($r['live_delivery_status'], ['delivered', 'read'])) {
            $r['status'] = $r['live_delivery_status'];
        }
    }

    $campaign['progress_percent'] = $campaign['total_recipients'] > 0
        ? round((($campaign['sent_count'] + $campaign['failed_count']) / $campaign['total_recipients']) * 100, 1)
        : 0;

    sendJsonResponse([
        'success'    => true,
        'campaign'   => $campaign,
        'recipients' => $recipients
    ]);
}

/**
 * 3. POST Create New Campaign & Queue Recipients
 */
function handleCreateCampaign(PDO $db, array $auth): void {
    $input = getJsonInput();

    $name = trim($input['name'] ?? '');
    $templateName = trim($input['template_name'] ?? '');
    $pacePerMinute = max(10, min(300, (int)($input['pace_per_minute'] ?? 50)));
    $recipients = $input['recipients'] ?? [];
    $headerMediaUrl = !empty($input['header_media_url']) ? trim($input['header_media_url']) : null;
    $headerMediaName = !empty($input['header_media_name']) ? trim($input['header_media_name']) : null;

    if (empty($name)) {
        sendJsonResponse(['success' => false, 'error' => 'Campaign name is required'], 400);
    }
    if (empty($templateName)) {
        sendJsonResponse(['success' => false, 'error' => 'Please select a WhatsApp approved template'], 400);
    }
    if (empty($recipients) || !is_array($recipients)) {
        sendJsonResponse(['success' => false, 'error' => 'Please provide at least one recipient with phone number'], 400);
    }

    // Verify Template & Rate
    $stmtTmpl = $db->prepare("SELECT * FROM whatsapp_templates WHERE template_name = ? LIMIT 1");
    $stmtTmpl->execute([$templateName]);
    $template = $stmtTmpl->fetch();

    if (!$template) {
        sendJsonResponse(['success' => false, 'error' => "Template '{$templateName}' does not exist in catalog"], 404);
    }

    $clientRate = (float)($template['client_rate_bhd'] ?? 0.0340);
    $category   = $template['category'] ?? 'MARKETING';
    $totalCount = count($recipients);
    $estimatedCost = round($totalCount * $clientRate, 4);

    // Verify Sender Wallet
    $senderUserId = $auth['user']['id'] ?? 1;
    $stmtUser = $db->prepare("SELECT wallet_balance FROM users WHERE id = ?");
    $stmtUser->execute([$senderUserId]);
    $userBal = (float)$stmtUser->fetchColumn();

    if ($userBal < $estimatedCost) {
        sendJsonResponse([
            'success'        => false,
            'error'          => "Insufficient wallet balance (Current: " . number_format($userBal, 4) . " BHD, Required for {$totalCount} recipients: " . number_format($estimatedCost, 4) . " BHD). Please top up your wallet before launching this broadcast.",
            'wallet_balance' => $userBal,
            'required'       => $estimatedCost
        ], 402);
    }

    // Insert Campaign
    $stmtInsert = $db->prepare("
        INSERT INTO campaigns (
            name, template_name, category, header_media_url, header_media_name,
            pace_per_minute, total_recipients, estimated_cost, status, created_by
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, 'draft', ?
        )
    ");
    $stmtInsert->execute([
        $name, $templateName, $category, $headerMediaUrl, $headerMediaName,
        $pacePerMinute, $totalCount, $estimatedCost, $senderUserId
    ]);
    $campaignId = (int)$db->lastInsertId();

    // Insert Recipients into Queue
    $stmtRec = $db->prepare("
        INSERT INTO campaign_recipients (
            campaign_id, recipient_phone, contact_name, variables_json, status
        ) VALUES (
            ?, ?, ?, ?, 'pending'
        )
    ");

    $inserted = 0;
    foreach ($recipients as $r) {
        $phone = preg_replace('/[^0-9\+]/', '', (string)($r['phone'] ?? ''));
        if (empty($phone)) continue;
        if (strpos($phone, '+') !== 0) $phone = '+' . $phone;

        $cName = trim((string)($r['name'] ?? ''));
        $vars  = $r['variables'] ?? [];
        if (!is_array($vars)) $vars = [];

        $stmtRec->execute([
            $campaignId,
            $phone,
            !empty($cName) ? $cName : null,
            !empty($vars) ? json_encode($vars, JSON_UNESCAPED_UNICODE) : null
        ]);
        $inserted++;
    }

    // Update real total count if any invalid phones were dropped
    if ($inserted !== $totalCount) {
        $db->prepare("UPDATE campaigns SET total_recipients = ?, estimated_cost = ? WHERE id = ?")
           ->execute([$inserted, round($inserted * $clientRate, 4), $campaignId]);
    }

    sendJsonResponse([
        'success'          => true,
        'campaign_id'      => $campaignId,
        'name'             => $name,
        'total_recipients' => $inserted,
        'estimated_cost'   => round($inserted * $clientRate, 4),
        'pace_per_minute'  => $pacePerMinute
    ], 201);
}

/**
 * 4. POST Process Batch for Queued Campaign
 */
function handleProcessBatch(PDO $db, array $auth): void {
    $input = getJsonInput();
    $campaignId = (int)($input['campaign_id'] ?? $_GET['id'] ?? 0);
    $batchSize  = max(1, min(20, (int)($input['batch_size'] ?? 5)));

    if ($campaignId <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Campaign ID is required'], 400);
    }

    // Fetch Campaign
    $stmtCamp = $db->prepare("SELECT * FROM campaigns WHERE id = ?");
    $stmtCamp->execute([$campaignId]);
    $campaign = $stmtCamp->fetch();

    if (!$campaign) {
        sendJsonResponse(['success' => false, 'error' => 'Campaign not found'], 404);
    }

    if ($campaign['status'] === 'paused') {
        sendJsonResponse(['success' => false, 'error' => 'Campaign is currently paused', 'status' => 'paused'], 400);
    }
    if ($campaign['status'] === 'cancelled') {
        sendJsonResponse(['success' => false, 'error' => 'Campaign has been cancelled', 'status' => 'cancelled'], 400);
    }
    if ($campaign['status'] === 'completed') {
        sendJsonResponse(['success' => true, 'message' => 'Campaign already completed', 'status' => 'completed', 'progress_percent' => 100]);
    }

    // Mark as running if draft
    if ($campaign['status'] === 'draft') {
        $db->prepare("UPDATE campaigns SET status = 'running', started_at = IFNULL(started_at, NOW()) WHERE id = ?")->execute([$campaignId]);
    }

    // Fetch pending recipients
    $stmtRec = $db->prepare("
        SELECT * FROM campaign_recipients
        WHERE campaign_id = ? AND status = 'pending'
        ORDER BY id ASC
        LIMIT ?
    ");
    $stmtRec->bindValue(1, $campaignId, PDO::PARAM_INT);
    $stmtRec->bindValue(2, $batchSize, PDO::PARAM_INT);
    $stmtRec->execute();
    $pendingList = $stmtRec->fetchAll();

    if (empty($pendingList)) {
        // All recipients are processed
        $db->prepare("UPDATE campaigns SET status = 'completed', completed_at = NOW() WHERE id = ?")->execute([$campaignId]);
        sendJsonResponse([
            'success'          => true,
            'status'           => 'completed',
            'processed'        => 0,
            'progress_percent' => 100,
            'message'          => 'All recipients have been processed successfully'
        ]);
    }

    $processedCount = 0;
    $successCount   = 0;
    $failedCount    = 0;
    $batchCost      = 0.0;

    // Fetch Meta Settings & credentials
    $settingsStmt = $db->query("SELECT setting_key, setting_value FROM system_settings");
    $settingsMap = $settingsStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $defaultToken = 'EAATLuWFVcZBkBSIQfQ02NV8tXYHXIOLwZC5CZBMngCZB32TH1f5b9HibzLqjDrnWI30GBOuXLwzaH2j9Iju4RZCpNLDZCaZAFAm9hcaTgcBETEXQDyzcQ3oj53dvuLjxG6Wt2rr9cVh0XhRFqbs2C21rRtZCeJPLcS2sQVJtk05qhxSzA2fmmsnU8dJsBcUZAgpWzv05hAGAS4w5hqYEOqQEMY69H14nuzBAZBng86HwjR3AhMepkZCQQSPFqDAPYERoidjae8S94QHXkgJsutN0q8Dsz0gvSVNGWvuU6HhBwZDZD';
    $defaultPhoneId = '347848611735147';
    $metaPhoneId     = (!empty($settingsMap['meta_phone_number_id']) && $settingsMap['meta_phone_number_id'] !== '109823471928374') ? $settingsMap['meta_phone_number_id'] : $defaultPhoneId;
    $metaAccessToken = (!empty($settingsMap['meta_access_token']) && !str_starts_with($settingsMap['meta_access_token'], 'EAAJz9284jklasdf')) ? $settingsMap['meta_access_token'] : $defaultToken;
    $businessPhone   = $settingsMap['business_phone_number'] ?? '+973 1700 8899';

    // Fetch Template definition
    $stmtTmpl = $db->prepare("SELECT * FROM whatsapp_templates WHERE template_name = ? LIMIT 1");
    $stmtTmpl->execute([$campaign['template_name']]);
    $tmplObj = $stmtTmpl->fetch();

    $msgRate = (float)($tmplObj['client_rate_bhd'] ?? 0.0340);
    $metaCost = (float)($tmplObj['meta_cost_bhd'] ?? 0.0270);
    $platCharge = (float)($tmplObj['platform_charge_bhd'] ?? 0.0070);
    $headerType = strtoupper(trim($tmplObj['header_type'] ?? 'NONE'));
    $langCode = !empty($tmplObj['language']) ? trim($tmplObj['language']) : 'en';
    if ($campaign['template_name'] === 'hello_world') {
        $langCode = 'en_US';
    }

    $stmtUpdRec = $db->prepare("
        UPDATE campaign_recipients
        SET status = ?, error_message = ?, message_id = ?, cost_deducted = ?, sent_at = NOW()
        WHERE id = ?
    ");

    foreach ($pendingList as $rec) {
        $processedCount++;
        $phone = $rec['recipient_phone'];
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        $vars  = !empty($rec['variables_json']) ? json_decode($rec['variables_json'], true) : [];
        if (!is_array($vars)) $vars = [];

        // Auto-fill template variables if offer_sandslab
        if ($campaign['template_name'] === 'offer_sandslab') {
            if (empty($vars[0])) {
                $vars[0] = !empty($rec['contact_name']) ? $rec['contact_name'] : 'Valued Customer';
            }
            if (empty($vars[1])) {
                $vars[1] = '+97317008899';
            }
        }

        try {
            $components = [];

            // 1. Header Component (Image, Document, Video)
            if (!empty($campaign['header_media_url']) && $headerType !== 'NONE') {
                if ($headerType === 'IMAGE') {
                    $components[] = [
                        'type' => 'header',
                        'parameters' => [
                            ['type' => 'image', 'image' => ['link' => $campaign['header_media_url']]]
                        ]
                    ];
                } elseif ($headerType === 'DOCUMENT') {
                    $components[] = [
                        'type' => 'header',
                        'parameters' => [
                            ['type' => 'document', 'document' => ['link' => $campaign['header_media_url'], 'filename' => $campaign['header_media_name'] ?: 'document.pdf']]
                        ]
                    ];
                } elseif ($headerType === 'VIDEO') {
                    $components[] = [
                        'type' => 'header',
                        'parameters' => [
                            ['type' => 'video', 'video' => ['link' => $campaign['header_media_url']]]
                        ]
                    ];
                }
            }

            // 2. Body Parameters
            if (!empty($vars)) {
                $paramObjects = [];
                $isAssoc = array_keys($vars) !== range(0, count($vars) - 1);

                preg_match_all('/\{\{([a-zA-Z0-9_]+)\}\}/', $tmplObj['body_text'] ?? '', $varMatches);
                $detectedVarNames = $varMatches[1] ?? [];
                if (empty($detectedVarNames)) {
                    preg_match_all('/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/', $tmplObj['body_text'] ?? '', $numMatches);
                    $detectedVarNames = $numMatches[1] ?? [];
                }
                if ($campaign['template_name'] === 'offer_sandslab' && (empty($detectedVarNames) || $detectedVarNames === ['1', '2'])) {
                    $detectedVarNames = ['customer_name', 'contact_number'];
                }

                $pIdx = 0;
                foreach ($vars as $pKey => $val) {
                    $paramItem = ['type' => 'text', 'text' => (string)$val];
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

                if (!empty($paramObjects)) {
                    $components[] = [
                        'type' => 'body',
                        'parameters' => $paramObjects
                    ];
                }
            }

            // 3. Assemble Meta Cloud API Payload
            $metaPayload = [
                'messaging_product' => 'whatsapp',
                'recipient_type'    => 'individual',
                'to'                => $cleanPhone,
                'type'              => 'template',
                'template'          => [
                    'name'     => $campaign['template_name'],
                    'language' => ['code' => $langCode]
                ]
            ];
            if (!empty($components)) {
                $metaPayload['template']['components'] = $components;
            }

            // 4. Send cURL request to Meta Cloud API
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
            curl_setopt($ch, CURLOPT_TIMEOUT, 20);
            $resRaw = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $resJson = json_decode((string)$resRaw, true);
            if ($httpCode === 200 && isset($resJson['messages'][0]['id'])) {
                $realWamid = $resJson['messages'][0]['id'];

                // Render body for DB record
                $renderedBody = $tmplObj['body_text'] ?? ('Template ' . $campaign['template_name']);
                if (!empty($vars)) {
                    foreach ($vars as $idx => $v) {
                        $renderedBody = preg_replace('/\{\{[^}]+\}\}/', (string)$v, $renderedBody, 1);
                    }
                }

                // Insert into whatsapp_messages with status = 'sent' and delivered_at = NULL
                $stmtInsertMsg = $db->prepare("
                    INSERT INTO whatsapp_messages (
                        message_id, direction, source_system, to_phone, from_phone, category,
                        template_name, message_type, message_body, header_media_url, header_media_name,
                        parameters_json, status, meta_cost_bhd, platform_charge_bhd, client_rate_bhd,
                        sent_at, delivered_at
                    ) VALUES (
                        ?, 'outbound', ?, ?, ?, ?,
                        ?, 'template', ?, ?, ?,
                        ?, 'sent', ?, ?, ?,
                        NOW(), NULL
                    )
                ");
                $stmtInsertMsg->execute([
                    $realWamid,
                    'Campaign #' . $campaignId,
                    $phone,
                    $businessPhone,
                    $campaign['category'],
                    $campaign['template_name'],
                    $renderedBody,
                    $campaign['header_media_url'],
                    $campaign['header_media_name'],
                    json_encode($vars),
                    $metaCost,
                    $platCharge,
                    $msgRate
                ]);

                // Debit user wallet
                $userId = (int)($campaign['created_by'] ?: 1);
                $stmtBal = $db->prepare("SELECT wallet_balance FROM users WHERE id = ?");
                $stmtBal->execute([$userId]);
                $oldBal = (float)$stmtBal->fetchColumn();
                $newBal = max(0, $oldBal - $msgRate);

                $db->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?")->execute([$newBal, $userId]);
                $db->prepare("
                    INSERT INTO wallet_transactions (
                        user_id, transaction_type, amount, balance_before, balance_after,
                        reference_type, reference_id, description
                    ) VALUES (
                        ?, 'debit', ?, ?, ?,
                        'campaign_message', ?, ?
                    )
                ")->execute([
                    $userId, $msgRate, $oldBal, $newBal,
                    $realWamid, "Broadcast Message to {$phone} (Campaign #{$campaignId})"
                ]);

                // Update recipient status to 'sent'
                $stmtUpdRec->execute(['sent', null, $realWamid, $msgRate, $rec['id']]);
                $successCount++;
                $batchCost += $msgRate;
            } else {
                // Meta returned an error
                $errMsg = $resJson['error']['message'] ?? ($resRaw ?: ('Meta HTTP ' . $httpCode));
                if (!empty($resJson['error']['error_data']['details'])) {
                    $errMsg .= ' (' . $resJson['error']['error_data']['details'] . ')';
                } elseif (!empty($resJson['error']['error_user_msg'])) {
                    $errMsg .= ' (' . $resJson['error']['error_user_msg'] . ')';
                }

                $dummyMsgId = 'failed.' . bin2hex(random_bytes(10));
                $db->prepare("
                    INSERT INTO whatsapp_messages (
                        message_id, direction, source_system, to_phone, from_phone, category,
                        template_name, message_type, message_body, status, error_message,
                        meta_cost_bhd, platform_charge_bhd, client_rate_bhd, created_at
                    ) VALUES (
                        ?, 'outbound', ?, ?, ?, ?,
                        ?, 'template', 'Campaign Broadcast Failed', 'failed', ?,
                        0.0000, 0.0000, 0.0000, NOW()
                    )
                ")->execute([
                    $dummyMsgId,
                    'Campaign #' . $campaignId,
                    $phone,
                    $businessPhone,
                    $campaign['category'],
                    $campaign['template_name'],
                    $errMsg
                ]);

                $stmtUpdRec->execute(['failed', $errMsg, null, 0.0000, $rec['id']]);
                $failedCount++;
            }
        } catch (Throwable $dispatchEx) {
            $stmtUpdRec->execute(['failed', $dispatchEx->getMessage(), null, 0.0000, $rec['id']]);
            $failedCount++;
        }
    }

    // Update campaign counters: ONLY increment sent_count and failed_count. Do NOT increment delivered_count here!
    $db->prepare("
        UPDATE campaigns
        SET 
            sent_count = sent_count + ?,
            failed_count = failed_count + ?,
            actual_cost = actual_cost + ?
        WHERE id = ?
    ")->execute([$successCount, $failedCount, $batchCost, $campaignId]);

    // Check if any remain
    $remStmt = $db->prepare("SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = ? AND status = 'pending'");
    $remStmt->execute([$campaignId]);
    $remaining = (int)$remStmt->fetchColumn();

    $newStatus = $remaining === 0 ? 'completed' : 'running';
    if ($remaining === 0) {
        $db->prepare("UPDATE campaigns SET status = 'completed', completed_at = NOW() WHERE id = ?")->execute([$campaignId]);
    }

    $totalRec = (int)$campaign['total_recipients'];
    $progressPercent = $totalRec > 0 ? round((($totalRec - $remaining) / $totalRec) * 100, 1) : 100;

    sendJsonResponse([
        'success'          => true,
        'status'           => $newStatus,
        'batch_processed'  => $processedCount,
        'success_count'    => $successCount,
        'failed_count'     => $failedCount,
        'remaining'        => $remaining,
        'progress_percent' => $progressPercent
    ]);
}

/**
 * 5. POST Pause / Resume / Cancel Campaign Status
 */
function handleUpdateCampaignStatus(PDO $db, string $newStatus): void {
    $input = getJsonInput();
    $id = (int)($input['campaign_id'] ?? $_GET['id'] ?? 0);

    if ($id <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Campaign ID is required'], 400);
    }

    $stmt = $db->prepare("UPDATE campaigns SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $id]);

    sendJsonResponse([
        'success' => true,
        'id'      => $id,
        'status'  => $newStatus,
        'message' => "Campaign status updated to '{$newStatus}'"
    ]);
}

/**
 * 6. GET Sample CSV Download
 */
function handleSampleCsv(PDO $db): void {
    $templateName = trim($_GET['template_name'] ?? '');

    $headers = ['phone', 'name'];
    $sampleRow = ['+97335078079', 'Ali Al-Hassan'];

    if (!empty($templateName)) {
        $stmt = $db->prepare("SELECT * FROM whatsapp_templates WHERE template_name = ? LIMIT 1");
        $stmt->execute([$templateName]);
        $tmpl = $stmt->fetch();
        if ($tmpl) {
            $varCount = (int)($tmpl['variable_count'] ?? 0);
            for ($i = 1; $i <= $varCount; $i++) {
                $headers[] = "param_{$i}";
                $sampleRow[] = "Sample Value {$i}";
            }
        }
    }

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="campaign_recipients_template.csv"');

    $output = fopen('php://output', 'w');
    fputcsv($output, $headers);
    fputcsv($output, $sampleRow);
    fputcsv($output, ['+97339000001', 'Ahmed Al-Khalifa', 'Value A', 'Value B']);
    fputcsv($output, ['+97339000002', 'Dr. Tariq Salman', 'Value A', 'Value B']);
    fclose($output);
    exit;
}

/**
 * 7. POST Re-run / Reset Completed Campaign
 */
function handleRerunCampaign(PDO $db): void {
    $input = getJsonInput();
    $id = (int)($input['campaign_id'] ?? $_GET['id'] ?? 0);

    if ($id <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Campaign ID is required'], 400);
    }

    // Reset recipients
    $db->prepare("
        UPDATE campaign_recipients 
        SET status = 'pending', error_message = NULL, message_id = NULL, cost_deducted = 0.0000, sent_at = NULL 
        WHERE campaign_id = ?
    ")->execute([$id]);

    // Reset campaign
    $db->prepare("
        UPDATE campaigns 
        SET status = 'draft', sent_count = 0, delivered_count = 0, read_count = 0, failed_count = 0, actual_cost = 0.0000, started_at = NULL, completed_at = NULL 
        WHERE id = ?
    ")->execute([$id]);

    sendJsonResponse([
        'success' => true,
        'id'      => $id,
        'status'  => 'draft',
        'message' => 'Campaign reset to draft queue ready for re-broadcasting'
    ]);
}
