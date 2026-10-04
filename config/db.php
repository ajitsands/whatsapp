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
        }
        return self::$pdoInstance;
    }
}

/**
 * Send standard JSON Response
 */
function sendJsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Handle CORS preflight
 */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With');
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
 * Authenticate API Request (via Session or X-API-Key / Bearer Token)
 */
function authenticateRequest(array $allowedRoles = []): array {
    // 1. Check Session Auth (React Dashboard user)
    if (isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])) {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, name, email, role, status FROM users WHERE id = ? AND status = 'active' LIMIT 1");
        $stmt->execute([$_SESSION['user_id']]);
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
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM api_keys WHERE api_key = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$apiKey]);
        $keyRecord = $stmt->fetch();
        if ($keyRecord) {
            // Update last_used_at
            $upd = $db->prepare("UPDATE api_keys SET last_used_at = NOW() WHERE id = ?");
            $upd->execute([$keyRecord['id']]);
            return ['type' => 'api_key', 'system_name' => $keyRecord['system_name'], 'api_key_id' => $keyRecord['id']];
        }
    }

    // If unauthenticated
    sendJsonResponse([
        'success' => false,
        'error'   => 'Unauthorized: Please log in or provide a valid X-API-Key header'
    ], 401);
    exit;
}
