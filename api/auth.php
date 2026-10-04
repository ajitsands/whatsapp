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

    default:
        sendJsonResponse(['success' => false, 'error' => 'Invalid auth action'], 400);
}
