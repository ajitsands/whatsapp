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

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT id, name, email, role, status, avatar_color, last_login, created_at FROM users ORDER BY id DESC");
        sendJsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'POST':
        $input = getJsonInput();
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

        $colors = ['#075E54', '#128C7E', '#25D366', '#2563EB', '#7C3AED', '#D97706'];
        $avatarColor = $colors[array_rand($colors)];

        if ($id) {
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

        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        sendJsonResponse(['success' => true, 'message' => 'User deleted']);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
