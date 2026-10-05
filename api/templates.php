<?php
/**
 * WhatsApp Templates API Endpoint
 * Handles Template Catalog, Variable Management & Tariffs
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

$auth = authenticateRequest();
$db   = Database::getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Auto-heal offer_sandslab template if missing or using old placeholder format
        try {
            $offerBody = "Hello {{customer_name}},\nHere we have an special *OFFER * for you\nplease contact on this number {{contact_number}}\n\nTeam *SaNDS Lab* 👍";
            $db->prepare("
                INSERT INTO whatsapp_templates (
                    template_name, display_title, category, language,
                    header_type, header_sample, body_text, footer_text,
                    variable_count, sample_params_json, meta_status, meta_cost_bhd, platform_charge_bhd, client_rate_bhd
                ) VALUES (
                    'offer_sandslab', 'SaNDS Lab Special Offer QR', 'MARKETING', 'en',
                    'IMAGE', 'https://whatsapp.sandslab.com/assets/images/QRCodePoster.jpg', ?, 'SaNDS Lab Middle East W.L.L',
                    2, '[\"Ajit Kumar\", \"+919895765626\"]', 'APPROVED', 0.0270, 0.0070, 0.0340
                )
                ON DUPLICATE KEY UPDATE
                    body_text = VALUES(body_text),
                    variable_count = 2,
                    sample_params_json = '[\"Ajit Kumar\", \"+919895765626\"]'
            ")->execute([$offerBody]);
        } catch (Throwable $ignore) {}

        $stmt = $db->query("SELECT * FROM whatsapp_templates ORDER BY id DESC");
        $templates = $stmt->fetchAll();

        // Dynamically verify and auto-heal variable_count & sample parameters for any existing template
        foreach ($templates as &$tmpl) {
            preg_match_all('/\{\{([a-zA-Z0-9_]+)\}\}/', $tmpl['body_text'], $varMatches);
            $varNames = $varMatches[1] ?? [];
            if (empty($varNames)) {
                preg_match_all('/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/', $tmpl['body_text'], $numMatches);
                $varNames = $numMatches[1] ?? [];
            }
            $computedCount = count($varNames);
            if ($computedCount > (int)$tmpl['variable_count']) {
                $tmpl['variable_count'] = $computedCount;
            }
            $existing = !empty($tmpl['sample_params_json']) ? json_decode($tmpl['sample_params_json'], true) : [];
            if (!is_array($existing)) $existing = [];
            $needed = max($computedCount, (int)$tmpl['variable_count']);
            for ($i = count($existing); $i < $needed; $i++) {
                $varLabel = $varNames[$i] ?? ("Param " . ($i + 1));
                $existing[] = "Sample " . $varLabel;
            }
            $tmpl['sample_params_json'] = json_encode($existing);
            $tmpl['variable_names'] = $varNames;
        }
        unset($tmpl);

        sendJsonResponse(['success' => true, 'data' => $templates]);
        break;

    case 'POST':
        $input = getJsonInput();
        $id = !empty($input['id']) ? (int)$input['id'] : null;

        $templateName = trim($input['template_name'] ?? '');
        $displayTitle = trim($input['display_title'] ?? $templateName);
        $category     = strtoupper(trim($input['category'] ?? 'UTILITY'));
        $language     = trim($input['language'] ?? 'en');
        $headerType   = strtoupper(trim($input['header_type'] ?? 'NONE'));
        $headerSample = trim($input['header_sample'] ?? '');
        $bodyText     = trim($input['body_text'] ?? '');
        $footerText   = trim($input['footer_text'] ?? '');

        if (empty($templateName) || empty($bodyText)) {
            sendJsonResponse(['success' => false, 'error' => 'Template name and body text are required'], 400);
        }

        // Count variables: support {{customer_name}}, {{1}}, etc.
        preg_match_all('/\{\{([a-zA-Z0-9_]+)\}\}/', $bodyText, $varMatches);
        $varNames = $varMatches[1] ?? [];
        if (empty($varNames)) {
            preg_match_all('/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/', $bodyText, $numMatches);
            $varNames = $numMatches[1] ?? [];
        }
        $variableCount = count($varNames);

        // Tariffs based on Category
        $tariffs = [
            'AUTHENTICATION' => ['meta' => 0.0110, 'platform' => 0.0035, 'client' => 0.0145],
            'UTILITY'        => ['meta' => 0.0140, 'platform' => 0.0045, 'client' => 0.0185],
            'MARKETING'      => ['meta' => 0.0270, 'platform' => 0.0070, 'client' => 0.0340],
            'SERVICE'        => ['meta' => 0.0075, 'platform' => 0.0025, 'client' => 0.0100],
        ];
        $t = $tariffs[$category] ?? $tariffs['UTILITY'];

        $sampleParams = [];
        for ($i = 1; $i <= $variableCount; $i++) {
            $sampleParams[] = "Sample Value {$i}";
        }
        $sampleParamsJson = json_encode($sampleParams);

        if ($id) {
            // Update
            $stmt = $db->prepare("
                UPDATE whatsapp_templates SET
                    template_name = ?, display_title = ?, category = ?, language = ?,
                    header_type = ?, header_sample = ?, body_text = ?, footer_text = ?,
                    variable_count = ?, sample_params_json = ?, meta_cost_bhd = ?, platform_charge_bhd = ?, client_rate_bhd = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $templateName, $displayTitle, $category, $language,
                $headerType, $headerSample ?: null, $bodyText, $footerText ?: null,
                $variableCount, $sampleParamsJson, $t['meta'], $t['platform'], $t['client'], $id
            ]);
            sendJsonResponse(['success' => true, 'message' => 'Template updated successfully', 'id' => $id]);
        } else {
            // Insert
            $stmt = $db->prepare("
                INSERT INTO whatsapp_templates (
                    template_name, display_title, category, language,
                    header_type, header_sample, body_text, footer_text,
                    variable_count, sample_params_json, meta_status, meta_cost_bhd, platform_charge_bhd, client_rate_bhd
                ) VALUES (
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, 'APPROVED', ?, ?, ?
                )
            ");
            $stmt->execute([
                $templateName, $displayTitle, $category, $language,
                $headerType, $headerSample ?: null, $bodyText, $footerText ?: null,
                $variableCount, $sampleParamsJson, $t['meta'], $t['platform'], $t['client']
            ]);
            sendJsonResponse(['success' => true, 'message' => 'Template created successfully', 'id' => (int)$db->lastInsertId()], 201);
        }
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendJsonResponse(['success' => false, 'error' => 'Template ID required'], 400);
        }
        $stmt = $db->prepare("DELETE FROM whatsapp_templates WHERE id = ?");
        $stmt->execute([$id]);
        sendJsonResponse(['success' => true, 'message' => 'Template deleted']);
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
