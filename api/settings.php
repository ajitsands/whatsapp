<?php
/**
 * System Settings API Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Determine caller role if session or headers present
$auth = null;
$userRole = null;
$userId = $_SESSION['user_id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? null;
$userEmail = $_SERVER['HTTP_X_USER_EMAIL'] ?? null;

if ($userId || $userEmail) {
    if ($userId) {
        $stmtU = $db->prepare("SELECT id, name, email, role, status FROM users WHERE id = ? AND status = 'active' LIMIT 1");
        $stmtU->execute([(int)$userId]);
    } else {
        $stmtU = $db->prepare("SELECT id, name, email, role, status FROM users WHERE email = ? AND status = 'active' LIMIT 1");
        $stmtU->execute([$userEmail]);
    }
    $uRow = $stmtU->fetch();
    if ($uRow) {
        $auth = ['type' => 'session', 'user' => $uRow];
        $userRole = $uRow['role'];
    }
}

// Fallback to active superadmin if session not explicit (matches authenticateRequest convention)
if (!$auth && $method === 'POST') {
    $auth = authenticateRequest(['superadmin', 'admin']);
    $userRole = $auth['role'] ?? ($auth['user']['role'] ?? 'admin');
}

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

        if (empty($settingsMap['company_name'])) {
            $settingsMap['company_name'] = $settingsMap['business_display_name'] ?? 'UniGlobal Consultancy W.L.L';
        }
        if (empty($settingsMap['company_logo'])) {
            $settingsMap['company_logo'] = './assets/logos/SaNDSLab-LogoNewUpdated.png';
        }

        if ($userRole !== 'superadmin') {
            if (!empty($settingsMap['meta_access_token'])) {
                $settingsMap['meta_access_token'] = '••••••••••••••••';
            }
            if (!empty($settingsMap['webhook_verify_token'])) {
                $settingsMap['webhook_verify_token'] = '••••••••';
            }
        }

        sendJsonResponse([
            'success'              => true,
            'settings'             => $settingsMap,
            'raw_list'             => $rows,
            'app_version'          => APP_VERSION,
            'app_version_stage'    => APP_VERSION_STAGE,
            'app_baseline_version' => APP_BASELINE_VERSION,
            'app_locked_tag'       => APP_LOCKED_V1_TAG
        ]);
        break;

    case 'POST':
        $userRole = $auth['role'] ?? ($auth['user']['role'] ?? 'admin');
        $isSuperadmin = ($userRole === 'superadmin');
        $action = $_GET['action'] ?? '';

        // ACTION: Upload Company Branding Logo (Superadmin only)
        if ($action === 'upload_logo') {
            if (!$isSuperadmin) {
                sendJsonResponse(['success' => false, 'error' => 'Forbidden: Only Superadmin can change or upload company logo'], 403);
            }

            if (!isset($_FILES['logo_file']) || $_FILES['logo_file']['error'] !== UPLOAD_ERR_OK) {
                sendJsonResponse(['success' => false, 'error' => 'No valid logo image file was uploaded'], 400);
            }

            $file = $_FILES['logo_file'];
            $maxBytes = 5 * 1024 * 1024; // 5 MB
            if ($file['size'] > $maxBytes) {
                sendJsonResponse(['success' => false, 'error' => 'Logo file size exceeds 5MB limit'], 400);
            }

            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowed = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'];
            if (!in_array($ext, $allowed, true)) {
                sendJsonResponse(['success' => false, 'error' => 'Invalid image format. Allowed: PNG, JPG, JPEG, SVG, WEBP'], 400);
            }

            $uploadDir = __DIR__ . '/../uploads/branding';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0755, true);
            }

            $filename = 'company_logo_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $dest = $uploadDir . '/' . $filename;

            if (!move_uploaded_file($file['tmp_name'], $dest)) {
                sendJsonResponse(['success' => false, 'error' => 'Failed to save uploaded logo file to disk'], 500);
            }

            $relativeUrl = './uploads/branding/' . $filename;

            $stmtLogo = $db->prepare("
                INSERT INTO system_settings (setting_key, setting_value, setting_group, description)
                VALUES ('company_logo', ?, 'general', 'Company Branding Logo')
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
            ");
            $stmtLogo->execute([$relativeUrl]);

            sendJsonResponse([
                'success'  => true,
                'message'  => 'Company logo uploaded and updated successfully!',
                'logo_url' => $relativeUrl
            ]);
            break;
        }

        $input = getJsonInput();
        $settings = $input['settings'] ?? $input;

        if (!is_array($settings)) {
            sendJsonResponse(['success' => false, 'error' => 'Invalid settings payload'], 400);
        }

        // Restrict Company Branding, Tariff, Pricing Engine & Meta Cloud API Credentials modifications exclusively to Superadmin
        $superadminOnlyKeys = [
            'company_name', 'company_logo', 'business_display_name',
            'tariff_utility_meta', 'tariff_utility_platform',
            'tariff_auth_meta', 'tariff_auth_platform',
            'tariff_marketing_meta', 'tariff_marketing_platform',
            'tariff_service_meta', 'tariff_service_platform',
            'billing_model', 'wallet_enforcement',
            'meta_phone_number_id', 'meta_waba_account_id',
            'meta_access_token', 'webhook_verify_token'
        ];

        if (!$isSuperadmin) {
            foreach ($superadminOnlyKeys as $sk) {
                if (isset($settings[$sk])) {
                    unset($settings[$sk]);
                }
            }
        } else {
            // Keep business_display_name synchronized with company_name
            if (isset($settings['company_name'])) {
                $settings['business_display_name'] = $settings['company_name'];
            } elseif (isset($settings['business_display_name'])) {
                $settings['company_name'] = $settings['business_display_name'];
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
