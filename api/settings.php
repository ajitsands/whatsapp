<?php
/**
 * System Settings API Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest(['superadmin', 'admin']);
$db   = Database::getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT setting_key, setting_value, setting_group, description FROM system_settings ORDER BY id ASC");
        $rows = $stmt->fetchAll();
        $settingsMap = [];
        foreach ($rows as $row) {
            $settingsMap[$row['setting_key']] = $row['setting_value'];
        }
        sendJsonResponse([
            'success'  => true,
            'settings' => $settingsMap,
            'raw_list' => $rows
        ]);
        break;

    case 'POST':
        $input = getJsonInput();
        $settings = $input['settings'] ?? $input;

        if (!is_array($settings)) {
            sendJsonResponse(['success' => false, 'error' => 'Invalid settings payload'], 400);
        }

        $stmt = $db->prepare("
            INSERT INTO system_settings (setting_key, setting_value)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");

        foreach ($settings as $key => $value) {
            if (is_string($key)) {
                $stmt->execute([$key, is_array($value) ? json_encode($value) : (string)$value]);
            }
        }

        sendJsonResponse(['success' => true, 'message' => 'Settings saved successfully']);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
