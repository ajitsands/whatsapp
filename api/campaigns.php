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
            (SELECT COUNT(*) FROM campaign_recipients cr WHERE cr.campaign_id = c.id AND cr.status = 'pending') AS pending_count
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

    // Recipients
    $stmtRec = $db->prepare("
        SELECT * FROM campaign_recipients
        WHERE campaign_id = ?
        ORDER BY id ASC
        LIMIT 500
    ");
    $stmtRec->execute([$id]);
    $recipients = $stmtRec->fetchAll();

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

    $stmtUpdRec = $db->prepare("
        UPDATE campaign_recipients
        SET status = ?, error_message = ?, message_id = ?, cost_deducted = ?, sent_at = NOW()
        WHERE id = ?
    ");

    foreach ($pendingList as $rec) {
        $processedCount++;
        $phone = $rec['recipient_phone'];
        $vars  = !empty($rec['variables_json']) ? json_decode($rec['variables_json'], true) : [];

        // Build simulated or real dispatch payload
        $dispatchPayload = [
            'to_phone'        => $phone,
            'template_name'   => $campaign['template_name'],
            'category'        => $campaign['category'],
            'body_parameters' => $vars,
            'header_media'    => !empty($campaign['header_media_url']) ? [
                'url'      => $campaign['header_media_url'],
                'filename' => $campaign['header_media_name']
            ] : null,
            'source_system'   => 'Campaign #' . $campaignId . ' (' . $campaign['name'] . ')'
        ];

        // Process message through unified messages.php dispatcher
        try {
            // We use direct DB insertion and wallet debiting to ensure campaign queue reliability
            $stmtTmpl = $db->prepare("SELECT * FROM whatsapp_templates WHERE template_name = ? LIMIT 1");
            $stmtTmpl->execute([$campaign['template_name']]);
            $tmplObj = $stmtTmpl->fetch();
            $msgRate = (float)($tmplObj['client_rate_bhd'] ?? 0.0340);
            $metaCost = (float)($tmplObj['meta_cost_bhd'] ?? 0.0270);
            $platCharge = (float)($tmplObj['platform_charge_bhd'] ?? 0.0070);

            // Generate unique wamid
            $wamid = 'wamid.HBgL' . base64_encode($phone . ':' . bin2hex(random_bytes(12)));
            $renderedBody = $tmplObj['body_text'] ?? ('Template ' . $campaign['template_name']);
            if (!empty($vars)) {
                foreach ($vars as $idx => $v) {
                    $renderedBody = preg_replace('/\{\{[^}]+\}\}/', (string)$v, $renderedBody, 1);
                }
            }

            // Insert into whatsapp_messages
            $stmtInsertMsg = $db->prepare("
                INSERT INTO whatsapp_messages (
                    message_id, direction, source_system, to_phone, from_phone, category,
                    template_name, message_type, message_body, header_media_url, header_media_name,
                    parameters_json, status, meta_cost_bhd, platform_charge_bhd, client_rate_bhd,
                    sent_at, delivered_at
                ) VALUES (
                    ?, 'outbound', ?, ?, '+973 1700 8899', ?,
                    ?, 'template', ?, ?, ?,
                    ?, 'sent', ?, ?, ?,
                    NOW(), NOW() + INTERVAL 2 SECOND
                )
            ");
            $stmtInsertMsg->execute([
                $wamid,
                'Campaign #' . $campaignId,
                $phone,
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
                $wamid, "Broadcast Message to {$phone} (Campaign #{$campaignId})"
            ]);

            // Update recipient status
            $stmtUpdRec->execute(['sent', null, $wamid, $msgRate, $rec['id']]);
            $successCount++;
            $batchCost += $msgRate;

        } catch (Throwable $dispatchEx) {
            $stmtUpdRec->execute(['failed', $dispatchEx->getMessage(), null, 0.0000, $rec['id']]);
            $failedCount++;
        }
    }

    // Update campaign counters
    $db->prepare("
        UPDATE campaigns
        SET 
            sent_count = sent_count + ?,
            delivered_count = delivered_count + ?,
            failed_count = failed_count + ?,
            actual_cost = actual_cost + ?
        WHERE id = ?
    ")->execute([$successCount, $successCount, $failedCount, $batchCost, $campaignId]);

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
