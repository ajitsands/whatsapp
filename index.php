<?php
/**
 * WhatsApp Integration Platform Web Application
 * Engineered by SaNDS Lab Middle East W.L.L.
 */
declare(strict_types=1);
require_once __DIR__ . '/config/db.php';

$appCompanyName = 'WhatsApp Integration Platform';
$appCompanyLogo = './assets/logos/SaNDSLab-LogoNewUpdated.png';

try {
    $db = Database::getConnection();
    $stmtBranding = $db->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('company_name', 'company_logo', 'business_display_name')");
    $brandingMap = $stmtBranding->fetchAll(PDO::FETCH_KEY_PAIR);
    if (!empty($brandingMap['company_name'])) {
        $appCompanyName = $brandingMap['company_name'];
    } elseif (!empty($brandingMap['business_display_name'])) {
        $appCompanyName = $brandingMap['business_display_name'];
    }
    if (!empty($brandingMap['company_logo'])) {
        $appCompanyLogo = $brandingMap['company_logo'];
    }
} catch (Throwable $e) {
    // Graceful fallback to default values
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($appCompanyName, ENT_QUOTES, 'UTF-8') ?> | SaNDS Lab</title>
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="<?= htmlspecialchars($appCompanyLogo, ENT_QUOTES, 'UTF-8') ?>">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

  <!-- Application Stylesheet -->
  <link rel="stylesheet" href="./assets/css/app.css?v=<?= @filemtime(__DIR__ . '/assets/css/app.css') ?: time() ?>">

  <!-- Local Offline React 18 Core -->
  <script src="./assets/js/vendor/react.min.js"></script>
  <script src="./assets/js/vendor/react-dom.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <!-- Pre-compiled Fast React 18 Application Bundle -->
  <script src="./assets/js/app.compiled.js?v=<?= @filemtime(__DIR__ . '/assets/js/app.compiled.js') ?: time() ?>"></script>
</body>
</html>
