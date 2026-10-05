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

        $defaultToken = 'EAATLuWFVcZBkBSIQfQ02NV8tXYHXIOLwZC5CZBMngCZB32TH1f5b9HibzLqjDrnWI30GBOuXLwzaH2j9Iju4RZCpNLDZCaZAFAm9hcaTgcBETEXQDyzcQ3oj53dvuLjxG6Wt2rr9cVh0XhRFqbs2C21rRtZCeJPLcS2sQVJtk05qhxSzA2fmmsnU8dJsBcUZAgpWzv05hAGAS4w5hqYEOqQEMY69H14nuzBAZBng86HwjR3AhMepkZCQQSPFqDAPYERoidjae8S94QHXkgJsutN0q8Dsz0gvSVNGWvuU6HhBwZDZD';
        $defaultPhoneId = '347848611735147';
        $defaultWabaId  = '313160575215815';
        $defaultWebhookToken = 'sands_uniglobal_wh_verify_token_2026';

        if (empty($settingsMap['meta_phone_number_id']) || $settingsMap['meta_phone_number_id'] === '109823471928374') {
            $settingsMap['meta_phone_number_id'] = $defaultPhoneId;
            $db->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES ('meta_phone_number_id', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([$defaultPhoneId]);
        }
        if (empty($settingsMap['meta_waba_account_id']) || $settingsMap['meta_waba_account_id'] === '981273918237192') {
            $settingsMap['meta_waba_account_id'] = $defaultWabaId;
            $db->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES ('meta_waba_account_id', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([$defaultWabaId]);
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
        $userRole = $auth['role'] ?? ($auth['user']['role'] ?? 'admin');
        $isSuperadmin = ($userRole === 'superadmin');

        $input = getJsonInput();
        $settings = $input['settings'] ?? $input;

        if (!is_array($settings)) {
            sendJsonResponse(['success' => false, 'error' => 'Invalid settings payload'], 400);
        }

        // Restrict Tariff & Pricing Engine modifications exclusively to Superadmin
        $tariffKeys = [
            'tariff_utility_meta', 'tariff_utility_platform',
            'tariff_auth_meta', 'tariff_auth_platform',
            'tariff_marketing_meta', 'tariff_marketing_platform',
            'tariff_service_meta', 'tariff_service_platform',
            'billing_model', 'wallet_enforcement'
        ];

        if (!$isSuperadmin) {
            foreach ($tariffKeys as $tk) {
                if (isset($settings[$tk])) {
                    unset($settings[$tk]);
                }
            }
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
