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

        $defaultToken = 'EAATLuWFVcZBkBShyqCMEBcxXp77EAXXyWJXvyLr2ZBUisziJohZBDCozF0NFb61TnfJGY0vlBTfZAEzGoq6n9E7xAZAmbLD0dSZCogqYjAKJFzB9yTmaq10kQ2ZCfms3GOT0J9xi0Lzh4ZCYpZCILHx7nPFbVaGCmhs1TsVlHxUMMFNm2EYiDZCpGKLFSZAGLKo9onKZAAYGOZCOZCyou0ALgb4OXJJRXZCRVrqfn3ocZBHfv664guNKm8HeZB61mLZBH1HZC4uMR0Ngw4h3Gdskwt5mxcOIy5kOks6UCUS9s33G0ckbBAZDZD';
        $defaultPhoneId = '347848611735147';
        $defaultWebhookToken = 'sands_uniglobal_wh_verify_token_2026';

        if (empty($settingsMap['meta_phone_number_id']) || $settingsMap['meta_phone_number_id'] === '109823471928374') {
            $settingsMap['meta_phone_number_id'] = $defaultPhoneId;
            $db->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES ('meta_phone_number_id', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([$defaultPhoneId]);
        }
        if (empty($settingsMap['meta_access_token']) || str_starts_with($settingsMap['meta_access_token'], 'EAAJz9284jklasdf')) {
            $settingsMap['meta_access_token'] = $defaultToken;
            $db->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES ('meta_access_token', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([$defaultToken]);
        }
        if (empty($settingsMap['webhook_verify_token'])) {
            $settingsMap['webhook_verify_token'] = $defaultWebhookToken;
            $db->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES ('webhook_verify_token', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([$defaultWebhookToken]);
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
