<?php
/**
 * WhatsApp Integration Platform - Database Setup & Seeder
 * Run once to initialize tables, seed templates, API keys, and demo users.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $db = Database::getConnection();
    $sqlFile = __DIR__ . '/../schema.sql';

    if (!file_exists($sqlFile)) {
        throw new Exception("schema.sql file not found at " . $sqlFile);
    }

    $sqlContent = file_get_contents($sqlFile);

    // Remove comments
    $lines = explode("\n", $sqlContent);
    $cleanSql = '';
    foreach ($lines as $line) {
        $trimmed = trim($line);
        if (str_starts_with($trimmed, '--') || str_starts_with($trimmed, '/*') || empty($trimmed)) {
            continue;
        }
        $cleanSql .= $line . "\n";
    }

    // Split queries by semicolon
    $statements = array_filter(array_map('trim', explode(';', $cleanSql)));
    $executedCount = 0;

    foreach ($statements as $stmtSql) {
        if (!empty($stmtSql)) {
            $db->exec($stmtSql);
            $executedCount++;
        }
    }

    // Verify seed records
    $userCount = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $templateCount = $db->query("SELECT COUNT(*) FROM whatsapp_templates")->fetchColumn();
    $apiKeyCount = $db->query("SELECT COUNT(*) FROM api_keys")->fetchColumn();
    $messageCount = $db->query("SELECT COUNT(*) FROM whatsapp_messages")->fetchColumn();

    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Database Setup Successful | SaNDS Lab</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f4f8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #fff; max-width: 600px; width: 100%; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 32px; box-sizing: border-box; }
            .badge { display: inline-block; background: #e6f9f0; color: #0d8a4f; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 12px; }
            h1 { font-size: 22px; color: #111827; margin: 0 0 8px; }
            p { color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
            .stat-box .title { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
            .stat-box .val { font-size: 20px; font-weight: 700; color: #128c7e; margin-top: 4px; }
            .creds { background: #f3f4f6; border-left: 4px solid #128c7e; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #374151; margin-bottom: 24px; }
            .btn { display: block; text-align: center; background: #128c7e; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
            .btn:hover { background: #075e54; }
        </style>
    </head>
    <body>
        <div class="card">
            <span class="badge">✓ Setup Completed</span>
            <h1>Database Initialized & Seeded Successfully</h1>
            <p>All tables, initial schema, templates, and telemetry records have been loaded into <strong>sandsl23_whatsapp_db</strong>.</p>

            <div class="grid">
                <div class="stat-box">
                    <div class="title">Demo Users</div>
                    <div class="val"><?= htmlspecialchars((string)$userCount) ?> Active</div>
                </div>
                <div class="stat-box">
                    <div class="title">WhatsApp Templates</div>
                    <div class="val"><?= htmlspecialchars((string)$templateCount) ?> Seeded</div>
                </div>
                <div class="stat-box">
                    <div class="title">Odoo API Keys</div>
                    <div class="val"><?= htmlspecialchars((string)$apiKeyCount) ?> Generated</div>
                </div>
                <div class="stat-box">
                    <div class="title">Telemetry Logs</div>
                    <div class="val"><?= htmlspecialchars((string)$messageCount) ?> Recorded</div>
                </div>
            </div>

            <div class="creds">
                <strong>Default Sign-in Credentials:</strong><br>
                • Email: <code>superadmin@sandslab.com</code><br>
                • Password: <code>Password@123</code>
            </div>

            <a href="../" class="btn">🚀 Open WhatsApp Gateway Dashboard</a>
        </div>
    </body>
    </html>
    <?php

} catch (Throwable $e) {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Database Setup Error | SaNDS Lab</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #fff; max-width: 550px; width: 100%; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 32px; border: 1px solid #fed7d7; }
            h1 { font-size: 20px; color: #e53e3e; margin: 0 0 12px; }
            pre { background: #2d3748; color: #edf2f7; padding: 14px; border-radius: 6px; font-size: 12px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>❌ Setup Encountered an Error</h1>
            <p style="color:#4a5568; font-size:14px;">Error details:</p>
            <pre><?= htmlspecialchars($e->getMessage()) ?></pre>
        </div>
    </body>
    </html>
    <?php
}
