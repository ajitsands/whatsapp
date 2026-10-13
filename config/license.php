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
    private const ONLINE_CHECK_INTERVAL   = 86400; // 24 Hours in seconds

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
                    'sands_license_activated_at',
                    'sands_license_last_online_check',
                    'sands_license_status'
                )
            ");
            $rows = $stmt->fetchAll();
            $settings = [];
            foreach ($rows as $row) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }

            return [
                'license_key'       => $settings['sands_license_key'] ?? '',
                'token'             => $settings['sands_license_token'] ?? '',
                'public_key'        => $settings['sands_license_public_key'] ?? '',
                'domain'            => $settings['sands_license_domain'] ?? '',
                'activated_at'      => $settings['sands_license_activated_at'] ?? null,
                'last_online_check' => $settings['sands_license_last_online_check'] ?? null,
                'status'            => $settings['sands_license_status'] ?? 'active',
            ];
        } catch (Throwable $e) {
            return [
                'license_key'       => '',
                'token'             => '',
                'public_key'        => '',
                'domain'            => '',
                'activated_at'      => null,
                'last_online_check' => null,
                'status'            => 'unlicensed',
            ];
        }
    }

    /**
     * Save license credentials into system_settings
     */
    public static function saveStoredLicense(string $licenseKey, string $token, string $publicKey, string $domain, string $status = 'active'): void {
        $db = Database::getConnection();
        $items = [
            'sands_license_key'               => $licenseKey,
            'sands_license_token'             => $token,
            'sands_license_public_key'        => $publicKey,
            'sands_license_domain'            => $domain,
            'sands_license_activated_at'      => date('Y-m-d H:i:s'),
            'sands_license_last_online_check' => date('Y-m-d H:i:s'),
            'sands_license_status'            => $status
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
     * Touch or update the last online verification timestamp and optional status flag
     */
    public static function updateLastOnlineCheck(?string $status = null): void {
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("
                INSERT INTO system_settings (setting_key, setting_value, setting_group, description)
                VALUES ('sands_license_last_online_check', ?, 'license', 'Last Online Verification Timestamp')
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
            ");
            $stmt->execute([date('Y-m-d H:i:s')]);

            if ($status !== null) {
                $stmtStatus = $db->prepare("
                    INSERT INTO system_settings (setting_key, setting_value, setting_group, description)
                    VALUES ('sands_license_status', ?, 'license', 'License Status Flag')
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
                ");
                $stmtStatus->execute([$status]);
            }
        } catch (Throwable $e) {}
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
                'sands_license_activated_at',
                'sands_license_last_online_check',
                'sands_license_status'
            )
        ");
    }

    /**
     * Local Offline RSA SHA-256 Verification & Automated 24-Hour Remote Check
     */
    public static function checkLicenseLocally(?string $token = null, ?string $publicKey = null, bool $allowOnlineSync = true): array {
        if ($token === null || $publicKey === null) {
            $stored = self::getStoredLicense();
            $token = $stored['token'];
            $publicKey = $stored['public_key'];
            $licenseKey = $stored['license_key'];
        } else {
            $stored = self::getStoredLicense();
            $licenseKey = $stored['license_key'] ?? '';
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

        // If previously flagged as suspended by key.sandslab.com
        if (($stored['status'] ?? 'active') === 'suspended') {
            return [
                'valid'               => false,
                'status'              => 'suspended',
                'message'             => 'Application Key is suspended by licensing server (key.sandslab.com).',
                'requires_activation' => true,
                'duration_text'       => 'Key Suspended',
                'days_left'           => 0,
                'license_key'         => $licenseKey
            ];
        }

        // 24-Hour Remote Check Routine with key.sandslab.com
        if ($allowOnlineSync && !empty($licenseKey) && !empty($stored['domain'])) {
            $isTrialKey = str_starts_with(strtoupper($licenseKey), 'SANDSLAB-TRIAL-');
            if (!$isTrialKey) {
                $lastCheckStr = $stored['last_online_check'] ?? null;
                $lastCheckTime = !empty($lastCheckStr) ? strtotime($lastCheckStr) : 0;
                $secondsSinceCheck = time() - $lastCheckTime;

                if ($secondsSinceCheck >= self::ONLINE_CHECK_INTERVAL) {
                    // Update timestamp immediately as a lock to prevent concurrent requests from firing duplicate curls
                    self::updateLastOnlineCheck();

                    // Contact key.sandslab.com with a snappy 5-second timeout
                    $refreshRes = self::activate($licenseKey, $stored['domain'], 5);
                    if ($refreshRes['success']) {
                        $stored = self::getStoredLicense();
                        $token = $stored['token'];
                        $publicKey = $stored['public_key'];
                        $licenseKey = $stored['license_key'];
                    } elseif (isset($refreshRes['http_code']) && in_array($refreshRes['http_code'], [400, 401, 403, 404, 422], true)) {
                        // Key server explicitly rejected / suspended / revoked the key
                        self::updateLastOnlineCheck('suspended');
                        return [
                            'valid'               => false,
                            'status'              => 'suspended',
                            'message'             => $refreshRes['error'] ?? 'Application Key has been suspended or revoked by key.sandslab.com.',
                            'requires_activation' => true,
                            'duration_text'       => 'Key Suspended',
                            'days_left'           => 0,
                            'license_key'         => $licenseKey
                        ];
                    }
                    // If network timeout or key server is unreachable, gracefully fall back to local RSA verification below
                }
            }
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

        // 3. Payload Status Check (Suspension / Revocation Flag)
        $payloadStatus = strtolower(trim((string)($payload['status'] ?? ($payload['license_status'] ?? 'active'))));
        if (in_array($payloadStatus, ['suspended', 'revoked', 'disabled', 'cancelled', 'blocked'], true)) {
            self::updateLastOnlineCheck('suspended');
            return [
                'valid'               => false,
                'status'              => 'suspended',
                'message'             => 'Application Key is suspended. Please contact SaNDS Lab support.',
                'requires_activation' => true,
                'duration_text'       => 'Key Suspended',
                'days_left'           => 0,
                'license_key'         => $payload['license_key'] ?? $licenseKey,
                'domain'              => $licenseHost,
                'payload'             => $payload
            ];
        }

        // 4. Expiry / Duration Calculation
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
                $rawExpiryIso = date('Y-m-d', $expiryTime);

                // Fetch application setting for system date format
                $systemDateFormat = 'YYYY-MM-DD';
                try {
                    $db = Database::getConnection();
                    $stmtFmt = $db->query("SELECT setting_value FROM system_settings WHERE setting_key = 'system_date_format' LIMIT 1");
                    if ($stmtFmt && $rowFmt = $stmtFmt->fetch()) {
                        $systemDateFormat = $rowFmt['setting_value'] ?? 'YYYY-MM-DD';
                    }
                } catch (Throwable $e) {}

                $hasSpecificTime = (date('H:i:s', $expiryTime) !== '00:00:00' && date('H:i:s', $expiryTime) !== '23:59:59');

                if (str_contains($systemDateFormat, 'DD/MM/YYYY')) {
                    $formattedExpiry = date($hasSpecificTime ? 'd/m/Y h:i:s A' : 'd/m/Y', $expiryTime);
                } elseif (str_contains($systemDateFormat, 'DD-MM-YYYY')) {
                    $formattedExpiry = date($hasSpecificTime ? 'd-m-Y H:i' : 'd-m-Y', $expiryTime);
                } elseif (str_contains($systemDateFormat, 'MM/DD/YYYY')) {
                    $formattedExpiry = date($hasSpecificTime ? 'm/d/Y h:i A' : 'm/d/Y', $expiryTime);
                } else {
                    $formattedExpiry = date($hasSpecificTime ? 'Y-m-d H:i:s' : 'Y-m-d', $expiryTime);
                }

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
                        'expires_at_raw'      => $rawExpiryIso,
                        'days_left'           => $daysLeft,
                        'duration_text'       => $durationText,
                        'license_key'         => $payload['license_key'] ?? $licenseKey,
                        'domain'              => $licenseHost,
                        'last_online_check'   => $stored['last_online_check'] ?? null,
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
            'valid'                => true,
            'status'               => 'active',
            'message'              => 'Application Key verified and active.',
            'requires_activation'  => false,
            'license_key'          => $payload['license_key'] ?? $licenseKey,
            'domain'               => $licenseHost,
            'client_name'          => $payload['client_name'] ?? ($payload['customer'] ?? 'Licensed Customer'),
            'plan'                 => $payload['plan'] ?? 'Standard Enterprise',
            'expires_at'           => $formattedExpiry,
            'expires_at_raw'       => $rawExpiryIso ?? $formattedExpiry,
            'days_left'            => $daysLeft !== null ? $daysLeft : 9999,
            'duration_text'        => $durationText,
            'last_online_check'    => $stored['last_online_check'] ?? null,
            'online_sync_interval' => '24 Hours',
            'payload'              => $payload
        ];
    }

    /**
     * Activate License Online with key.sandslab.com (Per SaNDS Lab Specs Section 2)
     */
    public static function activate(string $licenseKey, ?string $domain = null, int $timeout = 15): array {
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
            CURLOPT_TIMEOUT        => $timeout
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return [
                'success'   => false,
                'error'     => 'Could not connect to licensing server: ' . ($curlError ?: 'Network Timeout'),
                'http_code' => 0
            ];
        }

        $data = json_decode($response, true);
        if ($httpCode === 200 && !empty($data['token']) && !empty($data['public_key'])) {
            // SUCCESS: Save data to application
            self::saveStoredLicense($licenseKey, $data['token'], $data['public_key'], $domain, 'active');

            // Verify locally without re-triggering remote sync
            $localCheck = self::checkLicenseLocally($data['token'], $data['public_key'], false);
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
