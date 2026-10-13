<?php
/**
 * SaNDS Lab Application Key / Licensing API
 * Handles License Status, Online Activation, and Duration Calculations
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/license.php';

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? '';
$input  = getJsonInput();

switch ($action) {
    case 'status':
        $check = LicenseManager::checkLicenseLocally();
        $stored = LicenseManager::getStoredLicense();

        sendJsonResponse([
            'success' => true,
            'data'    => array_merge($check, [
                'stored_license_key' => !empty($stored['license_key']) 
                    ? substr($stored['license_key'], 0, 7) . '••••-••••-' . substr($stored['license_key'], -4)
                    : null,
                'full_license_key'   => $stored['license_key'] ?? '',
                'detected_domain'    => explode(':', $_SERVER['HTTP_HOST'] ?? 'localhost')[0],
                'activated_at'       => $stored['activated_at'] ?? null,
            ])
        ]);
        break;

    case 'activate':
        $licenseKey = trim($input['license_key'] ?? '');
        $domainName = trim($input['domain_name'] ?? '');

        if (empty($licenseKey)) {
            sendJsonResponse(['success' => false, 'error' => 'Please enter a valid License Key'], 400);
        }

        $res = LicenseManager::activate($licenseKey, $domainName ?: null);
        if ($res['success']) {
            sendJsonResponse([
                'success' => true,
                'message' => $res['message'] ?? 'Application Key activated successfully!',
                'data'    => $res['data']
            ]);
        } else {
            sendJsonResponse([
                'success' => false,
                'error'   => $res['error'] ?? 'Activation failed'
            ], 400);
        }
        break;

    case 'activate_eval':
        $domainName = trim($input['domain_name'] ?? '');
        $domain = $domainName ?: explode(':', $_SERVER['HTTP_HOST'] ?? 'localhost')[0];
        $res = LicenseManager::createEvaluationLicense($domain, 30);
        if ($res['success']) {
            sendJsonResponse([
                'success' => true,
                'message' => '30-Day Evaluation License activated successfully!',
                'data'    => $res['data']
            ]);
        } else {
            sendJsonResponse(['success' => false, 'error' => $res['error'] ?? 'Evaluation activation failed'], 400);
        }
        break;

    case 'deactivate':
        LicenseManager::clearStoredLicense();
        sendJsonResponse([
            'success' => true,
            'message' => 'Application Key removed. Activation required.'
        ]);
        break;

    case 'refresh':
        $stored = LicenseManager::getStoredLicense();
        if (empty($stored['license_key'])) {
            sendJsonResponse(['success' => false, 'error' => 'No license installed to refresh.'], 400);
        }

        $res = LicenseManager::activate($stored['license_key'], $stored['domain'] ?: null);
        if ($res['success']) {
            sendJsonResponse([
                'success' => true,
                'message' => 'License refreshed successfully!',
                'data'    => $res['data']
            ]);
        } else {
            // If online refresh fails, fall back to local check
            $check = LicenseManager::checkLicenseLocally();
            sendJsonResponse([
                'success' => true,
                'message' => 'Key server unreachable; retained existing local verification.',
                'data'    => $check
            ]);
        }
        break;

    default:
        sendJsonResponse(['success' => false, 'error' => 'Invalid license action'], 400);
}
