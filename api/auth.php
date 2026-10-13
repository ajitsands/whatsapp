<?php
/**
 * Authentication API Endpoint
 * Handles Login, Logout, Profile Check, and Password Reset
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';
$input  = getJsonInput();

$db = Database::getConnection();

switch ($action) {
    case 'login':
        require_once __DIR__ . '/../config/license.php';
        $licenseCheck = LicenseManager::checkLicenseLocally();
        if (!$licenseCheck['valid']) {
            sendJsonResponse([
                'success'        => false,
                'error'          => 'Application access is locked: Valid SaNDS Lab License Key is required before logging in (' . $licenseCheck['duration_text'] . ').',
                'license_locked' => true,
                'license_status' => $licenseCheck['status']
            ], 403);
        }

        $email    = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($email) || empty($password)) {
            sendJsonResponse(['success' => false, 'error' => 'Email and password are required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            sendJsonResponse(['success' => false, 'error' => 'Invalid email or password'], 401);
        }

        if ($user['status'] !== 'active') {
            sendJsonResponse(['success' => false, 'error' => 'Account is suspended or deactivated'], 403);
        }

        // Check password (supports Password@123 or direct bcrypt match)
        $passwordValid = password_verify($password, $user['password']) || ($password === 'Password@123');

        if (!$passwordValid) {
            sendJsonResponse(['success' => false, 'error' => 'Invalid email or password'], 401);
        }

        // Set Session
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_name'] = $user['name'];

        // Update last login
        $upd = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $upd->execute([$user['id']]);

        sendJsonResponse([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id'           => $user['id'],
                'name'         => $user['name'],
                'email'        => $user['email'],
                'role'         => $user['role'],
                'status'       => $user['status'],
                'avatar_color' => $user['avatar_color'] ?? '#128C7E'
            ]
        ]);
        break;

    case 'logout':
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        sendJsonResponse(['success' => true, 'message' => 'Logged out successfully']);
        break;

    case 'me':
    case 'check':
        if (isset($_SESSION['user_id'])) {
            $stmt = $db->prepare("SELECT id, name, email, role, status, avatar_color, last_login FROM users WHERE id = ? LIMIT 1");
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch();
            if ($user && $user['status'] === 'active') {
                sendJsonResponse([
                    'success' => true,
                    'authenticated' => true,
                    'user' => $user
                ]);
            }
        }
        sendJsonResponse([
            'success' => false,
            'authenticated' => false,
            'user' => null
        ], 200);
        break;

    case 'switch_demo_user':
        // Quick switch for testing roles (superadmin, admin, user)
        $role = $input['role'] ?? 'superadmin';
        $stmt = $db->prepare("SELECT * FROM users WHERE role = ? AND status = 'active' LIMIT 1");
        $stmt->execute([$role]);
        $user = $stmt->fetch();
        if ($user) {
            $_SESSION['user_id']   = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['user_name'] = $user['name'];
            sendJsonResponse([
                'success' => true,
                'message' => "Switched to {$user['role']}",
                'user' => [
                    'id'           => $user['id'],
                    'name'         => $user['name'],
                    'email'        => $user['email'],
                    'role'         => $user['role'],
                    'status'       => $user['status'],
                    'avatar_color' => $user['avatar_color'] ?? '#128C7E'
                ]
            ]);
        }
        sendJsonResponse(['success' => false, 'error' => 'User role not found'], 404);
        break;

    case 'change_password':
        $auth = authenticateRequest();
        $userId = $auth['user']['id'] ?? null;
        if (!$userId) {
            sendJsonResponse(['success' => false, 'error' => 'Unauthorized: Please log in'], 401);
        }

        $currentPassword = trim($input['current_password'] ?? '');
        $newPassword     = trim($input['new_password'] ?? '');

        if (empty($newPassword) || strlen($newPassword) < 6) {
            sendJsonResponse(['success' => false, 'error' => 'New password must be at least 6 characters long'], 400);
        }

        $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        if (!$row) {
            sendJsonResponse(['success' => false, 'error' => 'User account not found'], 404);
        }

        if (!empty($currentPassword)) {
            $currentValid = password_verify($currentPassword, $row['password']) || ($currentPassword === 'Password@123');
            if (!$currentValid) {
                sendJsonResponse(['success' => false, 'error' => 'Current password is incorrect'], 400);
            }
        }

        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $upd = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
        $upd->execute([$hash, $userId]);

        sendJsonResponse([
            'success' => true,
            'message' => 'Your password has been changed successfully'
        ]);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Invalid auth action'], 400);
}
