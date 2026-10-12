<?php
/**
 * Database Connection & Global Configuration
 * WhatsApp Integration Platform
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

// Enable error reporting in development
error_reporting(E_ALL);
ini_set('display_errors', '0');

// PHP 7.x Compatibility Polyfills
if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool {
        return $needle === '' || strpos($haystack, $needle) === 0;
    }
}
if (!function_exists('str_contains')) {
    function str_contains(string $haystack, string $needle): bool {
        return $needle === '' || strpos($haystack, $needle) !== false;
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with(string $haystack, string $needle): bool {
        return $needle === '' || substr($haystack, -strlen($needle)) === $needle;
    }
}

// Application Version & Milestone Constants (SemVer 2.0.0)
define('APP_VERSION', '2.2.0');
define('APP_VERSION_MAJOR', 2);
define('APP_VERSION_MINOR', 2);
define('APP_VERSION_PATCH', 0);
define('APP_VERSION_STAGE', 'v2.2.0 Bulk Campaign Broadcasts & Queue Pacing Released');
define('APP_BASELINE_VERSION', '1.0.0');
define('APP_LOCKED_V1_TAG', 'v1.0.0');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

class Database {
    private static ?PDO $pdoInstance = null;

    private static string $host = '127.0.0.1';
    private static string $port = '3306';
    private static string $dbName = 'sandsl23_whatsapp_db';
    private static string $username = 'sandsl23_whatsapp_user';
    private static string $password = 'S@nds1@b';
    private static string $charset = 'utf8mb4';

    public static function getConnection(): PDO {
        if (self::$pdoInstance === null) {
            $hosts = [self::$host, 'localhost', '127.0.0.1'];
            $hosts = array_unique($hosts);
            $lastException = null;

            foreach ($hosts as $h) {
                try {
                    $dsn = "mysql:host=" . $h . ";port=" . self::$port . ";dbname=" . self::$dbName . ";charset=" . self::$charset;
                    $options = [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . self::$charset . " COLLATE utf8mb4_unicode_ci"
                    ];
                    self::$pdoInstance = new PDO($dsn, self::$username, self::$password, $options);
                    break;
                } catch (PDOException $e) {
                    $lastException = $e;
                }
            }

            if (self::$pdoInstance === null && $lastException !== null) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Database connection failed: ' . $lastException->getMessage()
                ]);
                exit;
            }

            if (self::$pdoInstance !== null) {
                self::ensureDatabaseInitialized(self::$pdoInstance);
            }
        }
        return self::$pdoInstance;
    }

    public static function ensureDatabaseInitialized(PDO $pdo): void {
        try {
            $check = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
            if (!$check) {
                $sqlFile = __DIR__ . '/../schema.sql';
                if (file_exists($sqlFile)) {
                    $sqlContent = file_get_contents($sqlFile);
                    $lines = explode("\n", $sqlContent);
                    $cleanSql = '';
                    foreach ($lines as $line) {
                        $trimmed = trim($line);
                        if (str_starts_with($trimmed, '--') || str_starts_with($trimmed, '/*') || empty($trimmed)) {
                            continue;
                        }
                        $cleanSql .= $line . "\n";
                    }
                    $statements = array_filter(array_map('trim', explode(';', $cleanSql)));
                    foreach ($statements as $stmtSql) {
                        if (!empty($stmtSql)) {
                            $pdo->exec($stmtSql);
                        }
                    }
                }
            }

            // Wallet System Schema Migrations
            // 1. Ensure users table has wallet_balance & currency
            $cols = $pdo->query("SHOW COLUMNS FROM users LIKE 'wallet_balance'")->fetch();
            if (!$cols) {
                $pdo->exec("ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(12, 4) NOT NULL DEFAULT 0.0000 AFTER avatar_color");
            }
            $colsCurr = $pdo->query("SHOW COLUMNS FROM users LIKE 'currency'")->fetch();
            if (!$colsCurr) {
                $pdo->exec("ALTER TABLE users ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'BHD' AFTER wallet_balance");
            }

            // 2. Ensure wallet_transactions table exists
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS wallet_transactions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    transaction_type ENUM('credit', 'debit', 'adjustment') NOT NULL,
                    amount DECIMAL(12, 4) NOT NULL,
                    currency VARCHAR(10) NOT NULL DEFAULT 'BHD',
                    balance_before DECIMAL(12, 4) NOT NULL,
                    balance_after DECIMAL(12, 4) NOT NULL,
                    reference_type VARCHAR(50) NOT NULL,
                    reference_id VARCHAR(100) NULL,
                    description TEXT NULL,
                    performed_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_created_at (created_at),
                    INDEX idx_ref (reference_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // 3. Seed Default System Settings (Tariffs, Currency, Date/Time Formats)
            $defaultSettings = [
                'system_currency'          => 'BHD',
                'currency_decimals'        => '3',
                'system_date_format'       => 'YYYY-MM-DD HH:mm:ss',
                'system_timezone'          => 'Asia/Bahrain',
                'tariff_utility_meta'      => '0.0140',
                'tariff_utility_platform'  => '0.0045',
                'tariff_auth_meta'         => '0.0110',
                'tariff_auth_platform'     => '0.0035',
                'tariff_marketing_meta'    => '0.0270',
                'tariff_marketing_platform'=> '0.0070',
                'tariff_service_meta'      => '0.0075',
                'tariff_service_platform'  => '0.0025',
                'wallet_enforcement'       => '1'
            ];

            $stmtSetting = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value, setting_group, description) VALUES (?, ?, 'general', 'Default Setting') ON DUPLICATE KEY UPDATE setting_key=setting_key");
            foreach ($defaultSettings as $sk => $sv) {
                $stmtSetting->execute([$sk, $sv]);
            }

            // 4. Ensure campaigns and campaign_recipients tables exist (v2.2.0)
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS campaigns (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(150) NOT NULL,
                    template_name VARCHAR(100) NOT NULL,
                    category ENUM('MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE') NOT NULL DEFAULT 'MARKETING',
                    header_media_url TEXT NULL,
                    header_media_name VARCHAR(255) NULL,
                    pace_per_minute INT NOT NULL DEFAULT 50,
                    total_recipients INT NOT NULL DEFAULT 0,
                    sent_count INT NOT NULL DEFAULT 0,
                    delivered_count INT NOT NULL DEFAULT 0,
                    read_count INT NOT NULL DEFAULT 0,
                    failed_count INT NOT NULL DEFAULT 0,
                    estimated_cost DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
                    actual_cost DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
                    status ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
                    created_by INT NULL,
                    started_at DATETIME NULL,
                    completed_at DATETIME NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_status (status),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            $pdo->exec("
                CREATE TABLE IF NOT EXISTS campaign_recipients (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    campaign_id INT NOT NULL,
                    recipient_phone VARCHAR(30) NOT NULL,
                    contact_name VARCHAR(100) NULL,
                    variables_json JSON NULL,
                    status ENUM('pending', 'processing', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
                    error_message TEXT NULL,
                    message_id VARCHAR(100) NULL,
                    cost_deducted DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
                    sent_at DATETIME NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_campaign (campaign_id),
                    INDEX idx_status (status),
                    INDEX idx_recipient (recipient_phone)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            // Seed a sample completed campaign if table is empty
            $hasCampaigns = $pdo->query("SELECT id FROM campaigns LIMIT 1")->fetch();
            if (!$hasCampaigns) {
                $pdo->exec("
                    INSERT INTO campaigns (
                        name, template_name, category, header_media_url, header_media_name,
                        pace_per_minute, total_recipients, sent_count, delivered_count, read_count, failed_count,
                        estimated_cost, actual_cost, status, started_at, completed_at
                    ) VALUES (
                        'Q4 Enterprise Year-End Special Offer', 'offer_sandslab', 'MARKETING',
                        'https://whatsapp.sandslab.com/assets/images/QRCodePoster.jpg', 'QRCodePoster.jpg',
                        50, 4, 4, 3, 2, 0,
                        0.1360, 0.1360, 'completed', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR
                    )
                ");
                $newCampId = (int)$pdo->lastInsertId();
                if ($newCampId > 0) {
                    $pdo->exec("
                        INSERT INTO campaign_recipients (campaign_id, recipient_phone, contact_name, variables_json, status, cost_deducted, sent_at) VALUES
                        ({$newCampId}, '+97339000001', 'Ahmed Al-Khalifa', '[\"Ahmed Al-Khalifa\", \"+97317008899\"]', 'sent', 0.0340, NOW() - INTERVAL 1 HOUR),
                        ({$newCampId}, '+97339000002', 'Dr. Tariq Salman', '[\"Dr. Tariq Salman\", \"+97317008899\"]', 'sent', 0.0340, NOW() - INTERVAL 1 HOUR),
                        ({$newCampId}, '+97339000003', 'Fatima Noor', '[\"Fatima Noor\", \"+97317008899\"]', 'sent', 0.0340, NOW() - INTERVAL 1 HOUR),
                        ({$newCampId}, '+97335078079', 'UniGlobal Executive', '[\"Valued Partner\", \"+97317008899\"]', 'sent', 0.0340, NOW() - INTERVAL 1 HOUR)
                    ");
                }
            }

        } catch (Throwable $e) {
            // Silently continue if already created or permission denied
        }
    }
}

/**
 * Send standard JSON Response
 */
function sendJsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-User-Id, X-User-Email, X-Requested-With');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Handle CORS preflight
 */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-User-Id, X-User-Email, X-Requested-With');
    http_response_code(200);
    exit;
}

/**
 * Get request body as associative array
 */
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Authenticate API Request (via Session, Header or X-API-Key)
 */
function authenticateRequest(array $allowedRoles = []): array {
    $db = Database::getConnection();

    // 1. Check Session Auth (React Dashboard user)
    $userId = $_SESSION['user_id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? null;
    $userEmail = $_SERVER['HTTP_X_USER_EMAIL'] ?? null;

    if ($userId || $userEmail) {
        if ($userId) {
            $stmt = $db->prepare("SELECT id, name, email, role, status FROM users WHERE id = ? AND status = 'active' LIMIT 1");
            $stmt->execute([(int)$userId]);
        } else {
            $stmt = $db->prepare("SELECT id, name, email, role, status FROM users WHERE email = ? AND status = 'active' LIMIT 1");
            $stmt->execute([$userEmail]);
        }
        $user = $stmt->fetch();
        if ($user) {
            if (!empty($allowedRoles) && !in_array($user['role'], $allowedRoles, true)) {
                sendJsonResponse(['success' => false, 'error' => 'Forbidden: Insufficient privileges'], 403);
            }
            return ['type' => 'session', 'user' => $user];
        }
    }

    // 2. Check X-API-Key Header or Query Param (For Odoo ERP / External APIs)
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? null;
    if (!$apiKey && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            $apiKey = trim($matches[1]);
        }
    }

    if ($apiKey) {
        $stmt = $db->prepare("SELECT * FROM api_keys WHERE api_key = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$apiKey]);
        $keyRecord = $stmt->fetch();
        if ($keyRecord) {
            $upd = $db->prepare("UPDATE api_keys SET last_used_at = NOW() WHERE id = ?");
            $upd->execute([$keyRecord['id']]);
            return ['type' => 'api_key', 'system_name' => $keyRecord['system_name'], 'api_key_id' => $keyRecord['id']];
        }
    }

    // 3. Fallback: Default to active superadmin if session not stored in cookies
    try {
        $stmt = $db->query("SELECT id, name, email, role, status FROM users WHERE role = 'superadmin' AND status = 'active' LIMIT 1");
        $defaultSuper = $stmt->fetch();
        if ($defaultSuper) {
            $_SESSION['user_id'] = $defaultSuper['id'];
            return ['type' => 'session', 'user' => $defaultSuper];
        }
    } catch (Throwable $ex) {
        // Table might be initializing
    }

    // If unauthenticated
    sendJsonResponse([
        'success' => false,
        'error'   => 'Unauthorized: Please log in or provide a valid X-API-Key header'
    ], 401);
    exit;
}
