<?php
/**
 * Inbound Live Chat & Two-Way Agent Inbox API
 * Handles Conversation Threading, Inbound Message Ingestion, 24-Hour Session Tracking, and Agent Replies
 * Version 2.1.0 — Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest(['superadmin', 'admin', 'user']);
$db   = Database::getConnection();

$action = $_GET['action'] ?? $_POST['action'] ?? 'threads';

switch ($action) {
    case 'threads':
        handleGetThreads($db);
        break;

    case 'messages':
        handleGetThreadMessages($db);
        break;

    case 'send_reply':
        handleSendAgentReply($db, $auth);
        break;

    case 'mark_read':
        handleMarkThreadRead($db);
        break;

    case 'simulate_inbound':
        handleSimulateInbound($db);
        break;

    case 'canned_replies':
        handleGetCannedReplies();
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
}

/**
 * 1. GET Conversation Threads with 24h Window Expiry Calculations
 */
function handleGetThreads(PDO $db): void {
    $search = trim($_GET['search'] ?? '');
    $filter = trim($_GET['filter'] ?? 'all'); // 'all', 'unread', 'active_24h'

    // Fetch all messages ordered by created_at DESC
    $stmt = $db->query("
        SELECT id, message_id, direction, source_system, to_phone, from_phone,
               category, template_name, message_type, message_body, header_media_name,
               status, meta_cost_bhd, platform_charge_bhd, client_rate_bhd,
               sent_at, delivered_at, read_at, created_at
        FROM whatsapp_messages
        ORDER BY created_at DESC
        LIMIT 500
    ");
    $allMessages = $stmt->fetchAll();

    // Group by contact phone
    $threadMap = [];
    foreach ($allMessages as $m) {
        $contactPhone = ($m['direction'] === 'inbound' ? $m['from_phone'] : $m['to_phone']) ?: $m['to_phone'] ?: $m['from_phone'];
        $cleanPhone = preg_replace('/[^0-9\+]/', '', (string)$contactPhone);
        if (strpos($cleanPhone, '+') !== 0) {
            $cleanPhone = '+' . $cleanPhone;
        }

        if (!isset($threadMap[$cleanPhone])) {
            $threadMap[$cleanPhone] = [
                'contact_phone'     => $cleanPhone,
                'contact_name'      => resolveContactName($cleanPhone),
                'avatar_letter'     => strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $cleanPhone), -2)),
                'total_messages'    => 1,
                'unread_inbound'    => ($m['direction'] === 'inbound' && $m['status'] !== 'read') ? 1 : 0,
                'latest_message'    => $m,
                'last_inbound_at'   => ($m['direction'] === 'inbound') ? $m['created_at'] : null,
                'last_outbound_at'  => ($m['direction'] === 'outbound') ? $m['created_at'] : null,
                'has_inbound'       => ($m['direction'] === 'inbound')
            ];
        } else {
            $threadMap[$cleanPhone]['total_messages'] += 1;
            if ($m['direction'] === 'inbound') {
                $threadMap[$cleanPhone]['has_inbound'] = true;
                if ($m['status'] !== 'read') {
                    $threadMap[$cleanPhone]['unread_inbound'] += 1;
                }
                if ($threadMap[$cleanPhone]['last_inbound_at'] === null) {
                    $threadMap[$cleanPhone]['last_inbound_at'] = $m['created_at'];
                }
            } elseif ($m['direction'] === 'outbound' && $threadMap[$cleanPhone]['last_outbound_at'] === null) {
                $threadMap[$cleanPhone]['last_outbound_at'] = $m['created_at'];
            }
        }
    }

    $now = time();
    $threads = [];

    foreach ($threadMap as $phone => &$t) {
        // Calculate 24-hour Meta Customer Care session window
        $is24hActive = false;
        $hoursRemaining = 0.0;
        $sessionExpiresAt = null;

        if (!empty($t['last_inbound_at'])) {
            $inboundTime = strtotime($t['last_inbound_at']);
            $diffSeconds = $now - $inboundTime;
            $windowSeconds = 24 * 3600;

            if ($diffSeconds < $windowSeconds) {
                $is24hActive = true;
                $secondsLeft = $windowSeconds - $diffSeconds;
                $hoursRemaining = round($secondsLeft / 3600, 1);
                $sessionExpiresAt = date('Y-m-d H:i:s', $inboundTime + $windowSeconds);
            }
        }

        $t['is_24h_active']      = $is24hActive;
        $t['hours_remaining']     = $hoursRemaining;
        $t['session_expires_at']  = $sessionExpiresAt;

        // Apply Search Filter
        if (!empty($search)) {
            $term = strtolower($search);
            $matchPhone = str_contains(strtolower($t['contact_phone']), $term);
            $matchName  = str_contains(strtolower($t['contact_name']), $term);
            $matchBody  = str_contains(strtolower($t['latest_message']['message_body'] ?? ''), $term);
            if (!$matchPhone && !$matchName && !$matchBody) {
                continue;
            }
        }

        // Apply Tab Filter
        if ($filter === 'unread' && $t['unread_inbound'] <= 0) {
            continue;
        }
        if ($filter === 'active_24h' && !$t['is_24h_active']) {
            continue;
        }

        $threads[] = $t;
    }

    // Sort newest activity first
    usort($threads, function ($a, $b) {
        $tA = strtotime($a['latest_message']['created_at'] ?? '2000-01-01');
        $tB = strtotime($b['latest_message']['created_at'] ?? '2000-01-01');
        return $tB <=> $tA;
    });

    sendJsonResponse([
        'success' => true,
        'threads' => $threads,
        'count'   => count($threads)
    ]);
}

/**
 * 2. GET Full Message History for a Specific Thread & Auto-Mark Read
 */
function handleGetThreadMessages(PDO $db): void {
    $phone = trim($_GET['phone'] ?? '');
    if (empty($phone)) {
        sendJsonResponse(['success' => false, 'error' => 'Contact phone number is required'], 400);
    }

    $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
    $stmt = $db->prepare("
        SELECT *
        FROM whatsapp_messages
        WHERE (to_phone LIKE ? OR from_phone LIKE ?)
        ORDER BY created_at ASC
    ");
    $param = "%{$cleanPhone}%";
    $stmt->execute([$param, $param]);
    $messages = $stmt->fetchAll();

    // Auto-mark inbound messages as read
    $markStmt = $db->prepare("
        UPDATE whatsapp_messages
        SET status = 'read', read_at = IFNULL(read_at, NOW())
        WHERE direction = 'inbound'
          AND (from_phone LIKE ? OR to_phone LIKE ?)
          AND status != 'read'
    ");
    $markStmt->execute([$param, $param]);

    // Check 24-hour status
    $lastInbound = null;
    foreach (array_reverse($messages) as $m) {
        if ($m['direction'] === 'inbound') {
            $lastInbound = $m['created_at'];
            break;
        }
    }

    $is24hActive = false;
    $hoursRemaining = 0.0;
    if ($lastInbound) {
        $diffSeconds = time() - strtotime($lastInbound);
        if ($diffSeconds < (24 * 3600)) {
            $is24hActive = true;
            $hoursRemaining = round(((24 * 3600) - $diffSeconds) / 3600, 1);
        }
    }

    sendJsonResponse([
        'success'         => true,
        'contact_phone'   => $phone,
        'contact_name'    => resolveContactName($phone),
        'is_24h_active'   => $is24hActive,
        'hours_remaining' => $hoursRemaining,
        'last_inbound_at' => $lastInbound,
        'messages'        => $messages
    ]);
}

/**
 * 3. POST Agent Reply Dispatch (Free-text or Template)
 */
function handleSendAgentReply(PDO $db, array $auth): void {
    $input = getJsonInput();
    $toPhone = trim($input['phone'] ?? $input['to_phone'] ?? '');
    $message = trim($input['message'] ?? $input['text'] ?? '');
    $templateName = trim($input['template_name'] ?? '');
    $bodyParams = $input['params'] ?? $input['body_parameters'] ?? [];

    if (empty($toPhone)) {
        sendJsonResponse(['success' => false, 'error' => 'Recipient phone is required'], 400);
    }
    if (empty($message) && empty($templateName)) {
        sendJsonResponse(['success' => false, 'error' => 'Message body or Template name is required'], 400);
    }

    // Call the unified dispatcher in messages.php
    require_once __DIR__ . '/messages.php';
    
    // Set up payload for messages.php
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $agentName = $auth['user']['name'] ?? ($auth['user']['email'] ?? 'Support Agent');

    $dispatchPayload = [
        'to_phone'        => $toPhone,
        'message'         => $message,
        'template_name'   => $templateName,
        'body_parameters' => $bodyParams,
        'category'        => 'SERVICE',
        'source_system'   => 'Live Agent Inbox (' . $agentName . ')'
    ];

    // Delegate directly
    $_POST = $dispatchPayload;
    handleSendMessage($db, $auth);
}

/**
 * 4. POST Mark Inbound Thread as Read
 */
function handleMarkThreadRead(PDO $db): void {
    $input = getJsonInput();
    $phone = trim($input['phone'] ?? $_GET['phone'] ?? '');
    if (empty($phone)) {
        sendJsonResponse(['success' => false, 'error' => 'Phone is required'], 400);
    }

    $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
    $param = "%{$cleanPhone}%";
    $stmt = $db->prepare("
        UPDATE whatsapp_messages
        SET status = 'read', read_at = IFNULL(read_at, NOW())
        WHERE direction = 'inbound'
          AND (from_phone LIKE ? OR to_phone LIKE ?)
    ");
    $stmt->execute([$param, $param]);

    sendJsonResponse(['success' => true, 'marked_read' => true, 'phone' => $phone]);
}

/**
 * 5. POST Simulate Inbound Message (For Testing & Verification)
 */
function handleSimulateInbound(PDO $db): void {
    $input = getJsonInput();
    $fromPhone = trim($input['from_phone'] ?? $input['phone'] ?? '+97335078079');
    $text = trim($input['message'] ?? 'Hello, I have an inquiry regarding my invoice statement.');

    if (strpos($fromPhone, '+') !== 0) {
        $fromPhone = '+' . preg_replace('/[^0-9]/', '', $fromPhone);
    }

    $wamid = 'wamid.HBgL' . base64_encode($fromPhone . ':inbound_' . bin2hex(random_bytes(8)));

    $stmt = $db->prepare("
        INSERT INTO whatsapp_messages (
            message_id, direction, source_system, to_phone, from_phone,
            category, message_type, message_body, status,
            meta_cost_bhd, platform_charge_bhd, client_rate_bhd,
            delivered_at, created_at
        ) VALUES (
            ?, 'inbound', 'WhatsApp Inbound User', '+97317008899', ?,
            'SERVICE', 'text', ?, 'delivered',
            0.0075, 0.0025, 0.0100,
            NOW(), NOW()
        )
    ");
    $stmt->execute([$wamid, $fromPhone, $text]);

    sendJsonResponse([
        'success'    => true,
        'message_id' => $wamid,
        'from_phone' => $fromPhone,
        'message'    => $text,
        'status'     => 'delivered',
        'notice'     => '24-hour Customer Service Session Window is now OPEN for ' . $fromPhone
    ]);
}

/**
 * 6. GET Standard Canned Quick Responses
 */
function handleGetCannedReplies(): void {
    $canned = [
        [
            'id'    => 'greet',
            'title' => '👋 Support Greeting',
            'text'  => 'Hello! Thank you for contacting UniGlobal Customer Support. How may I assist you today?'
        ],
        [
            'id'    => 'reviewing',
            'title' => '📄 Reviewing Inquiry',
            'text'  => 'We have received your request. Our operations and accounts team are currently reviewing the details.'
        ],
        [
            'id'    => 'payment_confirmed',
            'title' => '✅ Payment Confirmed',
            'text'  => 'Your payment has been successfully verified and posted to your account ledger. Thank you!'
        ],
        [
            'id'    => 'closing',
            'title' => '🙏 Resolution Closing',
            'text'  => 'Your request has been resolved. Please let us know if there is anything else we can assist you with!'
        ]
    ];

    sendJsonResponse([
        'success' => true,
        'canned_replies' => $canned
    ]);
}

/**
 * Helper: Resolve Contact Name from Known Seed Customers
 */
function resolveContactName(string $phone): string {
    $clean = preg_replace('/[^0-9]/', '', $phone);
    $directory = [
        '97339000001' => 'Ahmed Al-Khalifa',
        '97339000002' => 'Dr. Tariq Salman',
        '97339000003' => 'Fatima Noor',
        '97335078079' => 'Ali Al-Hassan (UniGlobal VIP)',
        '919995489008' => 'SaNDS Lab Dispatch Gateway',
        '919895765626' => 'Ajit Kumar KV'
    ];

    return $directory[$clean] ?? ('Contact ' . $phone);
}
