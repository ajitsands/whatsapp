<?php
/**
 * SaNDS Lab Licensing Service
 * Implements Asymmetric Offline Verification & Activation via key.sandslab.com
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

class LicenseManager {
    private const KEY_SERVER_ACTIVATE_URL = 'https://key.sandslab.com/public/api/activate';

    /**
     * Retrieve stored license configuration from database
     */
    public static function getStoredLicense(): array {
        try {
            $db = Database::getConnection();
            $stmt = $db->query("
                SELECT setting_key, setting_value 
                FROM system_settings 
                WHERE setting_key IN (
                    'sands_license_key',
                    'sands_license_token',
                    'sands_license_public_key',
                    'sands_license_domain',
                    'sands_license_activated_at'
                )
            ");
            $rows = $stmt->fetchAll();
            $settings = [];
            foreach ($rows as $row) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }

            return [
                'license_key'  => $settings['sands_license_key'] ?? '',
                'token'        => $settings['sands_license_token'] ?? '',
                'public_key'   => $settings['sands_license_public_key'] ?? '',
                'domain'       => $settings['sands_license_domain'] ?? '',
                'activated_at' => $settings['sands_license_activated_at'] ?? null,
            ];
        } catch (Throwable $e) {
            return [
                'license_key'  => '',
                'token'        => '',
                'public_key'   => '',
                'domain'       => '',
                'activated_at' => null,
            ];
        }
    }

    /**
     * Save license credentials into system_settings
     */
    public static function saveStoredLicense(string $licenseKey, string $token, string $publicKey, string $domain): void {
        $db = Database::getConnection();
        $items = [
            'sands_license_key'          => $licenseKey,
            'sands_license_token'        => $token,
            'sands_license_public_key'   => $publicKey,
            'sands_license_domain'       => $domain,
            'sands_license_activated_at' => date('Y-m-d H:i:s')
        ];

        $stmt = $db->prepare("
            INSERT INTO system_settings (setting_key, setting_value, setting_group, description)
            VALUES (?, ?, 'license', 'SaNDS Lab Licensing Key Data')
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
        ");

        foreach ($items as $k => $v) {
            $stmt->execute([$k, (string)$v]);
        }
    }

    /**
     * Clear stored license
     */
    public static function clearStoredLicense(): void {
        $db = Database::getConnection();
        $db->exec("
            DELETE FROM system_settings 
            WHERE setting_key IN (
                'sands_license_key',
                'sands_license_token',
                'sands_license_public_key',
                'sands_license_domain',
                'sands_license_activated_at'
            )
        ");
    }

    /**
     * Local Offline RSA SHA-256 Verification (Per SaNDS Lab Specs Section 3)
     */
    public static function checkLicenseLocally(?string $token = null, ?string $publicKey = null): array {
        if ($token === null || $publicKey === null) {
            $stored = self::getStoredLicense();
            $token = $stored['token'];
            $publicKey = $stored['public_key'];
            $licenseKey = $stored['license_key'];
        } else {
            $licenseKey = '';
        }

        if (empty($token) || empty($publicKey)) {
            return [
                'valid'               => false,
                'status'              => 'unlicensed',
                'message'             => 'No Application Key installed. Please enter your SaNDS Lab License Key.',
                'requires_activation' => true,
                'duration_text'       => 'Unlicensed',
                'days_left'           => 0
            ];
        }

        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return [
                'valid'               => false,
                'status'              => 'corrupted',
                'message'             => 'Invalid token format.',
                'requires_activation' => true,
                'duration_text'       => 'Corrupted Key',
                'days_left'           => 0
            ];
        }

        list($payloadBase64, $signatureBase64) = $parts;
        $payloadJson = base64_decode($payloadBase64, true);
        $signature   = base64_decode($signatureBase64, true);

        if ($payloadJson === false || $signature === false) {
            return [
                'valid'               => false,
                'status'              => 'corrupted',
                'message'             => 'Failed to decode license token payloads.',
                'requires_activation' => true,
                'duration_text'       => 'Decode Error',
                'days_left'           => 0
            ];
        }

        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            return [
                'valid'               => false,
                'status'              => 'corrupted',
                'message'             => 'Malformed payload JSON in license token.',
                'requires_activation' => true,
                'duration_text'       => 'Invalid Data',
                'days_left'           => 0
            ];
        }

        // 1. Verify RSA Signature
        $verifyResult = @openssl_verify($payloadJson, $signature, $publicKey, OPENSSL_ALGO_SHA256);
        if ($verifyResult !== 1) {
            return [
                'valid'               => false,
                'status'              => 'invalid_signature',
                'message'             => 'Signature mismatch. Token is corrupted or forged.',
                'requires_activation' => true,
                'duration_text'       => 'Signature Mismatch',
                'days_left'           => 0
            ];
        }

        // 2. Verify Domain Match
        $currentRaw = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $currentDomain = preg_replace('#^https?://#', '', strtolower($currentRaw));
        $currentHost = explode(':', $currentDomain)[0];

        $licenseRaw = $payload['domain_name'] ?? 'localhost';
        $licenseDomain = preg_replace('#^https?://#', '', strtolower($licenseRaw));
        $licenseHost = explode(':', $licenseDomain)[0];

        $isLocalMatch = in_array($currentHost, ['localhost', '127.0.0.1', '::1'], true) &&
                        in_array($licenseHost, ['localhost', '127.0.0.1', '::1'], true);

        if (!$isLocalMatch && $currentHost !== $licenseHost) {
            return [
                'valid'               => false,
                'status'              => 'domain_mismatch',
                'message'             => "Domain mismatch. License is bound to '{$licenseHost}', accessed from '{$currentHost}'.",
                'requires_activation' => true,
                'duration_text'       => 'Domain Mismatch',
                'days_left'           => 0,
                'license_domain'      => $licenseHost,
                'current_domain'      => $currentHost
            ];
        }

        // 3. Expiry / Duration Calculation
        $expiresAt = $payload['expires_at'] 
            ?? $payload['expiry_date'] 
            ?? $payload['valid_until'] 
            ?? $payload['expiration'] 
            ?? $payload['expiry'] 
            ?? null;

        $daysLeft = null;
        $isExpired = false;
        $formattedExpiry = 'Lifetime License';
        $durationText = 'Lifetime Active';

        if (!empty($expiresAt)) {
            $expiryTime = is_numeric($expiresAt) ? (int)$expiresAt : strtotime((string)$expiresAt);
            if ($expiryTime && $expiryTime > 0) {
                $formattedExpiry = date('Y-m-d', $expiryTime);
                $secondsLeft = $expiryTime - time();
                $daysLeft = (int)ceil($secondsLeft / 86400);

                if ($secondsLeft <= 0) {
                    $isExpired = true;
                    $durationText = 'Expired ' . abs($daysLeft) . 'd ago';
                    return [
                        'valid'               => false,
                        'status'              => 'expired',
                        'message'             => "Application key expired on {$formattedExpiry}.",
                        'requires_activation' => true,
                        'expires_at'          => $formattedExpiry,
                        'days_left'           => $daysLeft,
                        'duration_text'       => $durationText,
                        'license_key'         => $payload['license_key'] ?? $licenseKey,
                        'domain'              => $licenseHost,
                        'payload'             => $payload
                    ];
                } else {
                    if ($daysLeft === 1) {
                        $durationText = '1 Day Left';
                    } else {
                        $durationText = "{$daysLeft} Days Left";
                    }
                }
            }
        }

        return [
            'valid'               => true,
            'status'              => 'active',
            'message'             => 'Application Key verified and active.',
            'requires_activation' => false,
            'license_key'         => $payload['license_key'] ?? $licenseKey,
            'domain'              => $licenseHost,
            'client_name'         => $payload['client_name'] ?? ($payload['customer'] ?? 'Licensed Customer'),
            'plan'                => $payload['plan'] ?? 'Standard Enterprise',
            'expires_at'          => $formattedExpiry,
            'days_left'           => $daysLeft !== null ? $daysLeft : 9999,
            'duration_text'       => $durationText,
            'payload'             => $payload
        ];
    }

    /**
     * Activate License Online with key.sandslab.com (Per SaNDS Lab Specs Section 2)
     */
    public static function activate(string $licenseKey, ?string $domain = null): array {
        $licenseKey = trim($licenseKey);
        if (empty($licenseKey)) {
            return ['success' => false, 'error' => 'License Key is required.'];
        }

        // Resolve domain name
        if (empty($domain)) {
            $rawDomain = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $domain = explode(':', $rawDomain)[0];
        }
        $domain = strtolower(trim($domain));
        if (empty($domain) || $domain === '::1') {
            $domain = 'localhost';
        }

        // Resolve IP Address (optional but recommended in docs)
        $ip = $_SERVER['SERVER_ADDR'] ?? ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
        if (in_array($ip, ['127.0.0.1', '::1', 'localhost'], true)) {
            $publicIp = @file_get_contents('https://api.ipify.org');
            if ($publicIp && filter_var($publicIp, FILTER_VALIDATE_IP)) {
                $ip = trim($publicIp);
            }
        }

        // Support evaluation / dev trial keys
        if (in_array(strtoupper($licenseKey), ['DEMO-TRIAL-2026', 'TRIAL', 'SANDSLAB-DEV-TRIAL', 'EVALUATION'], true)) {
            return self::createEvaluationLicense($domain, 30);
        }

        // cURL Request to SaNDS Lab Key Server
        $ch = curl_init(self::KEY_SERVER_ACTIVATE_URL);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode([
                'license_key' => $licenseKey,
                'domain_name' => $domain,
                'ip_address'  => trim($ip)
            ]),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT        => 15
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return [
                'success' => false,
                'error'   => 'Could not connect to licensing server: ' . ($curlError ?: 'Network Timeout')
            ];
        }

        $data = json_decode($response, true);
        if ($httpCode === 200 && !empty($data['token']) && !empty($data['public_key'])) {
            // SUCCESS: Save data to application
            self::saveStoredLicense($licenseKey, $data['token'], $data['public_key'], $domain);

            // Verify locally
            $localCheck = self::checkLicenseLocally($data['token'], $data['public_key']);
            return [
                'success' => true,
                'message' => $data['message'] ?? 'Activation successful.',
                'data'    => $localCheck
            ];
        }

        $errorMsg = $data['message'] ?? ($data['error'] ?? "Activation error (HTTP {$httpCode})");
        return [
            'success'   => false,
            'error'     => $errorMsg,
            'http_code' => $httpCode
        ];
    }

    /**
     * Generate an Evaluation / Developer Trial License (30 Days)
     */
    public static function createEvaluationLicense(string $domain = 'localhost', int $days = 30): array {
        exec('openssl genrsa 2048 2>NUL', $privLines);
        $privKey = implode("\n", $privLines);

        $desc = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w']
        ];
        $proc = proc_open('openssl rsa -pubout 2>NUL', $desc, $pipes);
        if (is_resource($proc)) {
            fwrite($pipes[0], $privKey);
            fclose($pipes[0]);
            $pubKey = stream_get_contents($pipes[1]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            proc_close($proc);
        } else {
            return ['success' => false, 'error' => 'Failed to initialize OpenSSL key generator'];
        }

        $licenseKey = 'SANDSLAB-TRIAL-' . strtoupper(bin2hex(random_bytes(3))) . '-' . strtoupper(bin2hex(random_bytes(3)));
        $expiryDate = date('Y-m-d', strtotime("+{$days} days"));

        $payload = json_encode([
            'license_key' => $licenseKey,
            'domain_name' => $domain,
            'client_name' => 'UniGlobal Logistics (Evaluation)',
            'plan'        => '30-Day Developer Trial',
            'expires_at'  => $expiryDate
        ]);

        openssl_sign($payload, $sig, $privKey, OPENSSL_ALGO_SHA256);
        $token = base64_encode($payload) . '.' . base64_encode($sig);

        self::saveStoredLicense($licenseKey, $token, $pubKey, $domain);
        $check = self::checkLicenseLocally($token, $pubKey);

        return [
            'success' => true,
            'message' => "Evaluation license activated successfully for {$days} days.",
            'data'    => $check
        ];
    }
}
