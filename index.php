<?php
/**
 * WhatsApp Integration Platform Web Application
 * Engineered by SaNDS Lab Middle East W.L.L.
 */
declare(strict_types=1);
require_once __DIR__ . '/config/db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Integration Platform | SaNDS Lab Middle East W.L.L.</title>
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="./assets/logos/SaNDSLab-LogoNewUpdated.png">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

  <!-- Application Stylesheet -->
  <link rel="stylesheet" href="./assets/css/app.css">

  <!-- Local Offline React 18 Core -->
  <script src="./assets/js/vendor/react.min.js"></script>
  <script src="./assets/js/vendor/react-dom.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <!-- Pre-compiled Fast React 18 Application Bundle -->
  <script src="./assets/js/app.compiled.js"></script>
</body>
</html>
