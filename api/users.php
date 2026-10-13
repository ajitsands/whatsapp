<?php
/**
 * Users Management API Endpoint
 * Handles Superadmin, Admin, and User Accounts
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest(['superadmin', 'admin']);
$db   = Database::getConnection();
$currentUserRole = $auth['user']['role'] ?? '';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Superadmin user record is only visible when authenticated as Superadmin.
        // For Admin and other logins, only Admin and Users are visible.
        if ($currentUserRole === 'superadmin') {
            $stmt = $db->query("SELECT id, name, email, role, status, avatar_color, last_login, created_at FROM users ORDER BY id DESC");
        } else {
            $stmt = $db->query("SELECT id, name, email, role, status, avatar_color, last_login, created_at FROM users WHERE role != 'superadmin' ORDER BY id DESC");
        }
        sendJsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'POST':
        $input = getJsonInput();
        $action = $_GET['action'] ?? ($input['action'] ?? '');

        // 1. ACTION: Toggle User Status (Suspend / Activate)
        if ($action === 'toggle_status') {
            $id = (int)($input['id'] ?? 0);
            $status = strtolower(trim($input['status'] ?? 'active'));
            if (!in_array($status, ['active', 'suspended'], true)) {
                sendJsonResponse(['success' => false, 'error' => 'Invalid status (must be active or suspended)'], 400);
            }

            // Prevent self-suspension
            if (isset($_SESSION['user_id']) && (int)$_SESSION['user_id'] === $id) {
                sendJsonResponse(['success' => false, 'error' => 'You cannot suspend your own logged-in account'], 400);
            }

            $stmtTarget = $db->prepare("SELECT role, name FROM users WHERE id = ?");
            $stmtTarget->execute([$id]);
            $targetUser = $stmtTarget->fetch();
            if (!$targetUser) {
                sendJsonResponse(['success' => false, 'error' => 'User not found'], 404);
            }
            if ($targetUser['role'] === 'superadmin' && $currentUserRole !== 'superadmin') {
                sendJsonResponse(['success' => false, 'error' => 'Cannot suspend Superadmin account'], 403);
            }

            $stmt = $db->prepare("UPDATE users SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            sendJsonResponse([
                'success' => true,
                'message' => $status === 'suspended' ? "User \"{$targetUser['name']}\" suspended" : "User \"{$targetUser['name']}\" activated",
                'status'  => $status
            ]);
            break;
        }

        // 2. ACTION: Admin Reset Password for User
        if ($action === 'reset_password') {
            $id = (int)($input['id'] ?? 0);
            $newPassword = trim($input['new_password'] ?? '');
            if (empty($newPassword) || strlen($newPassword) < 6) {
                sendJsonResponse(['success' => false, 'error' => 'New password must be at least 6 characters'], 400);
            }

            $stmtTarget = $db->prepare("SELECT role, name FROM users WHERE id = ?");
            $stmtTarget->execute([$id]);
            $targetUser = $stmtTarget->fetch();
            if (!$targetUser) {
                sendJsonResponse(['success' => false, 'error' => 'User not found'], 404);
            }
            if ($targetUser['role'] === 'superadmin' && $currentUserRole !== 'superadmin') {
                sendJsonResponse(['success' => false, 'error' => 'Cannot reset Superadmin password'], 403);
            }

            $hash = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$hash, $id]);
            sendJsonResponse([
                'success' => true,
                'message' => "Password for \"{$targetUser['name']}\" has been reset successfully"
            ]);
            break;
        }

        $id = !empty($input['id']) ? (int)$input['id'] : null;

        $name     = trim($input['name'] ?? '');
        $email    = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');
        $role     = strtolower(trim($input['role'] ?? 'user'));
        $status   = strtolower(trim($input['status'] ?? 'active'));

        if (empty($name) || empty($email)) {
            sendJsonResponse(['success' => false, 'error' => 'Name and email are required'], 400);
        }

        if (!in_array($role, ['superadmin', 'admin', 'user'], true)) {
            sendJsonResponse(['success' => false, 'error' => 'Invalid role specified'], 400);
        }

        if ($role === 'superadmin' && $currentUserRole !== 'superadmin') {
            sendJsonResponse(['success' => false, 'error' => 'Only Superadmin can create or assign the Superadmin role'], 403);
        }

        $colors = ['#075E54', '#128C7E', '#25D366', '#2563EB', '#7C3AED', '#D97706'];
        $avatarColor = $colors[array_rand($colors)];

        if ($id) {
            // Check target user authorization
            $stmtTarget = $db->prepare("SELECT role FROM users WHERE id = ?");
            $stmtTarget->execute([$id]);
            $targetUser = $stmtTarget->fetch();
            if (!$targetUser) {
                sendJsonResponse(['success' => false, 'error' => 'User not found'], 404);
            }
            if ($targetUser['role'] === 'superadmin' && $currentUserRole !== 'superadmin') {
                sendJsonResponse(['success' => false, 'error' => 'Cannot edit Superadmin account'], 403);
            }

            // Check email uniqueness among other users
            $checkEmail = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1");
            $checkEmail->execute([$email, $id]);
            if ($checkEmail->fetch()) {
                sendJsonResponse(['success' => false, 'error' => 'Another user with this email address already exists'], 400);
            }

            // Update
            if (!empty($password)) {
                $hash = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, password = ?, role = ?, status = ? WHERE id = ?");
                $stmt->execute([$name, $email, $hash, $role, $status, $id]);
            } else {
                $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?");
                $stmt->execute([$name, $email, $role, $status, $id]);
            }
            sendJsonResponse(['success' => true, 'message' => 'User updated successfully']);
        } else {
            // Create
            if (empty($password)) {
                $password = 'Password@123';
            }
            $hash = password_hash($password, PASSWORD_BCRYPT);

            // Check if email exists
            $check = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
            $check->execute([$email]);
            if ($check->fetch()) {
                sendJsonResponse(['success' => false, 'error' => 'A user with this email already exists'], 400);
            }

            $stmt = $db->prepare("
                INSERT INTO users (name, email, password, role, status, avatar_color)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$name, $email, $hash, $role, $status, $avatarColor]);

            sendJsonResponse([
                'success' => true,
                'message' => 'User created successfully',
                'id' => (int)$db->lastInsertId()
            ], 201);
        }
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendJsonResponse(['success' => false, 'error' => 'User ID required'], 400);
        }

        // Prevent self-deletion
        if (isset($_SESSION['user_id']) && (int)$_SESSION['user_id'] === $id) {
            sendJsonResponse(['success' => false, 'error' => 'Cannot delete currently logged in user'], 400);
        }

        // Prevent non-superadmin from deleting superadmin
        $stmtTarget = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmtTarget->execute([$id]);
        $targetUser = $stmtTarget->fetch();
        if ($targetUser && $targetUser['role'] === 'superadmin' && $currentUserRole !== 'superadmin') {
            sendJsonResponse(['success' => false, 'error' => 'Cannot delete Superadmin account'], 403);
        }

        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        sendJsonResponse(['success' => true, 'message' => 'User deleted']);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
