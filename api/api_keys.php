<?php
/**
 * API Keys Management API Endpoint
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest(['superadmin', 'admin']);
$db   = Database::getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT id, system_name, api_key, permissions, rate_limit_per_minute, is_active, last_used_at, created_at FROM api_keys ORDER BY id DESC");
        sendJsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'POST':
        $input = getJsonInput();
        $systemName = trim($input['system_name'] ?? '');
        $rateLimit  = max(10, (int)($input['rate_limit_per_minute'] ?? 120));
        $permissions = $input['permissions'] ?? ['send_messages', 'read_status'];

        if (empty($systemName)) {
            sendJsonResponse(['success' => false, 'error' => 'System Name is required (e.g. Odoo ERP Module)'], 400);
        }

        // Generate clean secure API Key: sk_live_...
        $randomHex = bin2hex(random_bytes(16));
        $cleanSystemPrefix = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $systemName));
        $cleanSystemPrefix = substr($cleanSystemPrefix ?: 'app', 0, 8);
        $newApiKey = "sk_live_{$cleanSystemPrefix}_{$randomHex}";

        $stmt = $db->prepare("
            INSERT INTO api_keys (system_name, api_key, permissions, rate_limit_per_minute, is_active)
            VALUES (?, ?, ?, ?, 1)
        ");
        $stmt->execute([
            $systemName,
            $newApiKey,
            json_encode($permissions),
            $rateLimit
        ]);

        sendJsonResponse([
            'success' => true,
            'message' => 'API Key generated successfully',
            'api_key' => $newApiKey,
            'system_name' => $systemName
        ], 201);
        break;

    case 'PUT':
    case 'PATCH':
        $input = getJsonInput();
        $id = (int)($input['id'] ?? 0);
        $isActive = isset($input['is_active']) ? (int)$input['is_active'] : 1;

        if (!$id) {
            sendJsonResponse(['success' => false, 'error' => 'Key ID required'], 400);
        }

        $stmt = $db->prepare("UPDATE api_keys SET is_active = ? WHERE id = ?");
        $stmt->execute([$isActive, $id]);

        sendJsonResponse(['success' => true, 'message' => 'Key status updated']);
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendJsonResponse(['success' => false, 'error' => 'Key ID required'], 400);
        }
        $stmt = $db->prepare("DELETE FROM api_keys WHERE id = ?");
        $stmt->execute([$id]);
        sendJsonResponse(['success' => true, 'message' => 'API key revoked and deleted']);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
