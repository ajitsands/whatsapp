<?php
/**
 * Wallet & Billing Management API Endpoint
 * Handles Prepaid Balance Top-ups (Superadmin), Transaction Ledgers, and Multi-Currency Auditing
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest(['superadmin', 'admin', 'user']);
$db   = Database::getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$currentUser = $auth['user'] ?? null;
$isSuperadmin = ($currentUser && $currentUser['role'] === 'superadmin');

switch ($method) {
    case 'GET':
        handleGetWallet($db, $currentUser, $isSuperadmin);
        break;

    case 'POST':
        handleTopUpWallet($db, $currentUser, $isSuperadmin);
        break;

    case 'DELETE':
        handleDeleteTransaction($db, $currentUser, $isSuperadmin);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

/**
 * GET Wallet Balance, Users Summary, and Transaction Ledger
 */
function handleGetWallet(PDO $db, ?array $currentUser, bool $isSuperadmin): void {
    $targetUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
    $limit        = max(1, min(200, (int)($_GET['limit'] ?? 50)));
    $page         = max(1, (int)($_GET['page'] ?? 1));
    $offset       = ($page - 1) * $limit;
    $txType       = trim($_GET['type'] ?? '');

    // Fetch System Currency & Decimals from Settings
    $currStmt = $db->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('system_currency', 'currency_decimals', 'system_date_format')");
    $settings = [];
    while ($r = $currStmt->fetch()) {
        $settings[$r['setting_key']] = $r['setting_value'];
    }
    $systemCurrency = $settings['system_currency'] ?? 'BHD';
    $currencyDecimals = (int)($settings['currency_decimals'] ?? 3);

    // If Superadmin and no specific target requested, provide all accounts overview
    $usersSummary = [];
    if ($isSuperadmin) {
        $uStmt = $db->query("SELECT id, name, email, role, status, wallet_balance, currency FROM users ORDER BY role ASC, name ASC");
        $usersSummary = $uStmt->fetchAll();
    }

    // Determine whose transactions to view
    $where = [];
    $params = [];

    if (!$isSuperadmin) {
        // Non-superadmin can only see their own transactions
        $where[] = "wt.user_id = ?";
        $params[] = (int)($currentUser['id'] ?? 0);
    } elseif ($targetUserId) {
        $where[] = "wt.user_id = ?";
        $params[] = $targetUserId;
    }

    if (!empty($txType) && in_array($txType, ['credit', 'debit', 'adjustment'], true)) {
        $where[] = "wt.transaction_type = ?";
        $params[] = $txType;
    }

    $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    // Count
    $cStmt = $db->prepare("SELECT COUNT(*) as total FROM wallet_transactions wt {$whereSql}");
    $cStmt->execute($params);
    $total = (int)$cStmt->fetch()['total'];

    // Ledger Records
    $sql = "
        SELECT wt.*, u.name as user_name, u.email as user_email, p.name as performed_by_name
        FROM wallet_transactions wt
        LEFT JOIN users u ON wt.user_id = u.id
        LEFT JOIN users p ON wt.performed_by = p.id
        {$whereSql}
        ORDER BY wt.created_at DESC, wt.id DESC
        LIMIT {$limit} OFFSET {$offset}
    ";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();

    // Fetch current user's active balance
    $myBalance = 0.0000;
    if ($currentUser) {
        $balStmt = $db->prepare("SELECT wallet_balance, currency FROM users WHERE id = ? LIMIT 1");
        $balStmt->execute([(int)$currentUser['id']]);
        $balRow = $balStmt->fetch();
        if ($balRow) {
            $myBalance = (float)$balRow['wallet_balance'];
        }
    }

    sendJsonResponse([
        'success'           => true,
        'wallet_balance'    => $myBalance,
        'currency'          => $systemCurrency,
        'currency_decimals' => $currencyDecimals,
        'users'             => $usersSummary,
        'transactions'      => $transactions,
        'pagination'        => [
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => (int)ceil($total / $limit)
        ]
    ]);
}

/**
 * POST Superadmin Top-Up / Balance Credit
 */
function handleTopUpWallet(PDO $db, ?array $currentUser, bool $isSuperadmin): void {
    if (!$isSuperadmin) {
        sendJsonResponse(['success' => false, 'error' => 'Forbidden: Only Superadmin can add or adjust wallet balance'], 403);
    }

    $input = getJsonInput();
    $targetUserId = (int)($input['user_id'] ?? 0);
    $amount       = (float)($input['amount'] ?? 0);
    $type         = strtolower(trim($input['transaction_type'] ?? 'credit'));
    $referenceId  = trim($input['reference_id'] ?? $input['receipt_no'] ?? '');
    $notes        = trim($input['notes'] ?? $input['description'] ?? '');

    if ($targetUserId <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Please select a valid User / Admin account to credit'], 400);
    }

    if ($amount <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Amount must be greater than 0.000'], 400);
    }

    if (!in_array($type, ['credit', 'debit', 'adjustment'], true)) {
        $type = 'credit';
    }

    // Fetch System Currency
    $currStmt = $db->query("SELECT setting_value FROM system_settings WHERE setting_key = 'system_currency' LIMIT 1");
    $currRow  = $currStmt->fetch();
    $currency = $currRow['setting_value'] ?? 'BHD';

    try {
        $db->beginTransaction();

        // Lock user row for update
        $uStmt = $db->prepare("SELECT id, name, email, wallet_balance, currency FROM users WHERE id = ? FOR UPDATE");
        $uStmt->execute([$targetUserId]);
        $targetUser = $uStmt->fetch();

        if (!$targetUser) {
            $db->rollBack();
            sendJsonResponse(['success' => false, 'error' => 'Target user account not found'], 404);
        }

        $balanceBefore = (float)$targetUser['wallet_balance'];
        
        if ($type === 'credit') {
            $balanceAfter = $balanceBefore + $amount;
        } elseif ($type === 'debit') {
            if ($balanceBefore < $amount) {
                $db->rollBack();
                sendJsonResponse(['success' => false, 'error' => "Cannot debit {$amount} {$currency}. Current balance is {$balanceBefore} {$currency}"], 400);
            }
            $balanceAfter = $balanceBefore - $amount;
        } else { // adjustment
            $balanceAfter = $amount;
            $amount = abs($balanceAfter - $balanceBefore);
        }

        // Update User Balance
        $updUser = $db->prepare("UPDATE users SET wallet_balance = ?, currency = ? WHERE id = ?");
        $updUser->execute([$balanceAfter, $currency, $targetUserId]);

        // Insert Transaction Log
        $insTx = $db->prepare("
            INSERT INTO wallet_transactions 
            (user_id, transaction_type, amount, currency, balance_before, balance_after, reference_type, reference_id, description, performed_by)
            VALUES (?, ?, ?, ?, ?, ?, 'superadmin_topup', ?, ?, ?)
        ");
        $desc = !empty($notes) ? $notes : ($type === 'credit' ? "Recharge added by Superadmin" : "Manual adjustment by Superadmin");
        $insTx->execute([
            $targetUserId,
            $type,
            $amount,
            $currency,
            $balanceBefore,
            $balanceAfter,
            $referenceId ?: 'TOPUP-' . strtoupper(substr(uniqid(), -6)),
            $desc,
            (int)($currentUser['id'] ?? 1)
        ]);

        $db->commit();

        sendJsonResponse([
            'success'        => true,
            'message'        => "Successfully credited {$amount} {$currency} to {$targetUser['name']}. New Balance: {$balanceAfter} {$currency}",
            'new_balance'    => $balanceAfter,
            'currency'       => $currency,
            'user_id'        => $targetUserId
        ]);

    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        sendJsonResponse(['success' => false, 'error' => 'Database transaction failed: ' . $e->getMessage()], 500);
    }
}

/**
 * DELETE Wallet Transaction (Superadmin Only)
 */
function handleDeleteTransaction(PDO $db, ?array $currentUser, bool $isSuperadmin): void {
    if (!$isSuperadmin) {
        sendJsonResponse(['success' => false, 'error' => 'Forbidden: Only Superadmin can delete transaction logs'], 403);
    }

    $id = (int)($_GET['id'] ?? 0);
    $revertBalance = ($_GET['revert'] ?? '1') === '1';

    if ($id <= 0) {
        sendJsonResponse(['success' => false, 'error' => 'Valid transaction ID is required'], 400);
    }

    try {
        $db->beginTransaction();

        $stmt = $db->prepare("SELECT * FROM wallet_transactions WHERE id = ? FOR UPDATE");
        $stmt->execute([$id]);
        $tx = $stmt->fetch();

        if (!$tx) {
            $db->rollBack();
            sendJsonResponse(['success' => false, 'error' => 'Transaction record not found'], 404);
        }

        $userId = (int)$tx['user_id'];
        $amount = (float)$tx['amount'];
        $txType = $tx['transaction_type'];

        // If reverting balance
        if ($revertBalance && $userId > 0) {
            $uStmt = $db->prepare("SELECT id, wallet_balance FROM users WHERE id = ? FOR UPDATE");
            $uStmt->execute([$userId]);
            $u = $uStmt->fetch();
            if ($u) {
                $curBal = (float)$u['wallet_balance'];
                if ($txType === 'credit') {
                    $newBal = max(0.0000, $curBal - $amount);
                } elseif ($txType === 'debit') {
                    $newBal = $curBal + $amount;
                } else {
                    $newBal = $curBal;
                }
                $upd = $db->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?");
                $upd->execute([$newBal, $userId]);
            }
        }

        $del = $db->prepare("DELETE FROM wallet_transactions WHERE id = ?");
        $del->execute([$id]);

        $db->commit();

        sendJsonResponse([
            'success' => true,
            'message' => 'Transaction record deleted successfully' . ($revertBalance ? ' and user balance adjusted.' : '.')
        ]);

    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        sendJsonResponse(['success' => false, 'error' => 'Failed to delete transaction: ' . $e->getMessage()], 500);
    }
}

