-- WhatsApp Integration Platform Database Schema
-- Database: sandsl23_whatsapp_db
-- Engineered by SaNDS Lab Middle East W.L.L

-- USE sandsl23_whatsapp_db;

-- 1. Users Table (Superadmin, Admin, Standard Users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin', 'user') NOT NULL DEFAULT 'user',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    avatar_color VARCHAR(20) DEFAULT '#128C7E',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. API Keys for External Integrations (Odoo ERP, POS, 3rd-party)
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    system_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    ip_whitelist TEXT NULL,
    permissions JSON NULL,
    rate_limit_per_minute INT DEFAULT 120,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_used_at DATETIME NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_api_key (api_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. WhatsApp Message Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    display_title VARCHAR(150) NOT NULL,
    category ENUM('AUTHENTICATION', 'UTILITY', 'MARKETING', 'SERVICE') NOT NULL DEFAULT 'UTILITY',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    header_type ENUM('NONE', 'TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO') NOT NULL DEFAULT 'NONE',
    header_sample TEXT NULL,
    body_text TEXT NOT NULL,
    footer_text VARCHAR(255) NULL,
    buttons_json JSON NULL,
    variable_count INT DEFAULT 0,
    sample_params_json JSON NULL,
    meta_status ENUM('APPROVED', 'PENDING', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
    meta_cost_bhd DECIMAL(10, 4) NOT NULL DEFAULT 0.0140,
    platform_charge_bhd DECIMAL(10, 4) NOT NULL DEFAULT 0.0045,
    client_rate_bhd DECIMAL(10, 4) NOT NULL DEFAULT 0.0185,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. WhatsApp Messages Log (Outbound & Inbound)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(100) NOT NULL UNIQUE,
    direction ENUM('outbound', 'inbound') NOT NULL DEFAULT 'outbound',
    source_system VARCHAR(100) NOT NULL DEFAULT 'Manual Console',
    to_phone VARCHAR(30) NOT NULL,
    from_phone VARCHAR(30) NOT NULL DEFAULT '+97317000000',
    category ENUM('AUTHENTICATION', 'UTILITY', 'MARKETING', 'SERVICE') NOT NULL DEFAULT 'UTILITY',
    template_name VARCHAR(100) NULL,
    message_type ENUM('template', 'text', 'document', 'image', 'video', 'interactive') NOT NULL DEFAULT 'template',
    message_body TEXT NULL,
    header_media_url TEXT NULL,
    header_media_name VARCHAR(255) NULL,
    parameters_json JSON NULL,
    status ENUM('queued', 'sent', 'delivered', 'read', 'failed') NOT NULL DEFAULT 'queued',
    error_message TEXT NULL,
    meta_cost_bhd DECIMAL(10, 4) NOT NULL DEFAULT 0.0140,
    platform_charge_bhd DECIMAL(10, 4) NOT NULL DEFAULT 0.0045,
    client_rate_bhd DECIMAL(10, 4) NOT NULL DEFAULT 0.0185,
    sent_at DATETIME NULL,
    delivered_at DATETIME NULL,
    read_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_to_phone (to_phone),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. System Settings & Configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NULL,
    setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
    description VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Webhook Raw Events Log
CREATE TABLE IF NOT EXISTS webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    payload_json JSON NOT NULL,
    processed_status VARCHAR(30) NOT NULL DEFAULT 'processed',
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA
-- Default Passwords: Password@123 (BCrypt hash)
-- $2y$10$e0MYzXyjpJS7Pd0RVvHwHeFj7bK20QG3m0mR2kP5b0UvN7c4iFfO2
INSERT INTO users (name, email, password, role, status, avatar_color) VALUES
('SaNDS Lab Superadmin', 'superadmin@sandslab.com', '$2y$10$wS2x5.2E1gVjXqZgqgZ1u.3H6D8Teq9R4G8W6H1b4.J5xK0a7oG6O', 'superadmin', 'active', '#075E54'),
('UniGlobal Admin', 'admin@uniglobal.bh', '$2y$10$wS2x5.2E1gVjXqZgqgZ1u.3H6D8Teq9R4G8W6H1b4.J5xK0a7oG6O', 'admin', 'active', '#128C7E'),
('Operations Staff', 'user@uniglobal.bh', '$2y$10$wS2x5.2E1gVjXqZgqgZ1u.3H6D8Teq9R4G8W6H1b4.J5xK0a7oG6O', 'user', 'active', '#25D366')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed API Key for Odoo ERP
INSERT INTO api_keys (system_name, api_key, permissions, rate_limit_per_minute, is_active) VALUES
('Odoo ERP Production Middleware', 'sk_live_odoo_uniglobal_98741362', '["send_messages", "read_status", "templates_read", "webhooks_sync"]', 300, 1),
('UniGlobal POS Mobile App', 'sk_live_pos_uniglobal_44120938', '["send_messages", "read_status"]', 120, 1)
ON DUPLICATE KEY UPDATE system_name=VALUES(system_name);

-- Seed WhatsApp Templates as specified in the Architecture Proposal
INSERT INTO whatsapp_templates (template_name, display_title, category, language, header_type, header_sample, body_text, footer_text, variable_count, sample_params_json, meta_cost_bhd, platform_charge_bhd, client_rate_bhd) VALUES
('uniglobal_invoice_notification', 'Invoice Notification with PDF', 'UTILITY', 'en', 'DOCUMENT', 'https://erp.uniglobal.bh/INV_9941.pdf', 'Dear {{1}},\n\nYour invoice {{2}} for amount {{3}} has been generated on {{4}}. Please find your official tax invoice attached for your records.\n\nThank you for choosing UniGlobal.', 'UniGlobal Accounts | Powered by SaNDS Lab', 4, '["Ahmed Al-Khalifa", "INV/2026/0142", "BHD 345.500", "15-Oct-2026"]', 0.0140, 0.0045, 0.0185),
('uniglobal_otp_verification', 'Customer Portal OTP Verification', 'AUTHENTICATION', 'en', 'NONE', NULL, '{{1}} is your UniGlobal portal verification security code. Valid for 5 minutes. Do not share this code with anyone.', 'UniGlobal Security Center', 1, '["849201"]', 0.0110, 0.0035, 0.0145),
('uniglobal_delivery_dispatch', 'Order Dispatched Status', 'UTILITY', 'en', 'TEXT', 'Dispatch Notice: {{1}}', 'Hello {{1}}, your order #{{2}} is out for delivery with tracking ref {{3}}. Expected delivery time is {{4}}.', 'UniGlobal Logistics Support', 4, '["Dr. Tariq Salman", "ORD-88219", "TRK-BH-9912", "Today before 4:00 PM"]', 0.0140, 0.0045, 0.0185),
('uniglobal_seasonal_promo', 'Special Offers & Loyalty Benefits', 'MARKETING', 'en', 'IMAGE', 'https://erp.uniglobal.bh/assets/promo_banner.jpg', 'Exclusive Offer for {{1}}! Enjoy {{2}} off on all enterprise consultancy packages this month using promo code {{3}}. Valid until {{4}}.', 'Terms & Conditions Apply | UniGlobal', 4, '["Valued Partner", "25%", "UNI2026", "31-Oct-2026"]', 0.0270, 0.0070, 0.0340),
('uniglobal_support_welcome', 'Live Support Chat Response', 'SERVICE', 'en', 'NONE', NULL, 'Hello {{1}}, thank you for reaching UniGlobal Support. Ticket #{{2}} has been opened for your inquiry: "{{3}}". Our support agent will assist you shortly.', 'Customer Experience Hub', 3, '["Fatima Noor", "TCK-5541", "Invoice Adjustment Request"]', 0.0075, 0.0025, 0.0100),
('hello_world', 'Official Meta Hello World (Test)', 'UTILITY', 'en_US', 'NONE', NULL, 'Hello World', 'Meta Standard Test', 0, '[]', 0.0140, 0.0045, 0.0185)
ON DUPLICATE KEY UPDATE display_title=VALUES(display_title);

-- Seed System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_group, description) VALUES
('meta_phone_number_id', '347848611735147', 'whatsapp_cloud_api', 'Meta WhatsApp Business Cloud API Phone Number ID'),
('meta_waba_account_id', '981273918237192', 'whatsapp_cloud_api', 'Meta WhatsApp Business Account ID (WABA)'),
('meta_access_token', 'EAATLuWFVcZBkBShyqCMEBcxXp77EAXXyWJXvyLr2ZBUisziJohZBDCozF0NFb61TnfJGY0vlBTfZAEzGoq6n9E7xAZAmbLD0dSZCogqYjAKJFzB9yTmaq10kQ2ZCfms3GOT0J9xi0Lzh4ZCYpZCILHx7nPFbVaGCmhs1TsVlHxUMMFNm2EYiDZCpGKLFSZAGLKo9onKZAAYGOZCOZCyou0ALgb4OXJJRXZCRVrqfn3ocZBHfv664guNKm8HeZB61mLZBH1HZC4uMR0Ngw4h3Gdskwt5mxcOIy5kOks6UCUS9s33G0ckbBAZDZD', 'whatsapp_cloud_api', 'Permanent Meta System User Graph API Token'),
('webhook_verify_token', 'sands_uniglobal_wh_verify_token_2026', 'whatsapp_cloud_api', 'Webhook Verification Challenge Token for Meta Developer Dashboard'),
('system_mode', 'simulation_and_cloud', 'general', 'Mode: simulation_and_cloud (allows live simulation + real Cloud API dispatch)'),
('currency_symbol', 'BHD', 'general', 'Default Currency Display'),
('business_display_name', 'UniGlobal Consultancy W.L.L', 'general', 'Sender Business Display Name'),
('business_phone_number', '+973 1700 8899', 'general', 'WhatsApp Registered Business Contact Number')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Seed Sample Live Messages History
INSERT INTO whatsapp_messages (message_id, direction, source_system, to_phone, from_phone, category, template_name, message_type, message_body, header_media_name, status, meta_cost_bhd, platform_charge_bhd, client_rate_bhd, sent_at, delivered_at, read_at) VALUES
('wamid.HBgLMzk3MzkwMDAwMDBVAgARGBI5ODIzNzQxOTI4Mzc0AA==', 'outbound', 'Odoo ERP (Auto-Sync)', '+97339000001', '+97317008899', 'UTILITY', 'uniglobal_invoice_notification', 'template', 'Dear Ahmed Al-Khalifa, Your invoice INV/2026/0142 for amount BHD 345.500 has been generated on 15-Oct-2026.', 'INV_2026_0142.pdf', 'read', 0.0140, 0.0045, 0.0185, NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 58 MINUTE, NOW() - INTERVAL 45 MINUTE),
('wamid.HBgLMzk3MzkwMDAwMDJVAgARGBI1MTIzODk0NzE4MjM0AA==', 'outbound', 'Odoo ERP (Auto-Sync)', '+97339000002', '+97317008899', 'AUTHENTICATION', 'uniglobal_otp_verification', 'template', '849201 is your UniGlobal portal verification security code. Valid for 5 minutes.', NULL, 'delivered', 0.0110, 0.0035, 0.0145, NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 29 MINUTE, NULL),
('wamid.HBgLMzk3MzkwMDAwMDNVAgARGBI3MjM5MTgyNzM4MTk0AA==', 'outbound', 'Manual Console', '+97339000003', '+97317008899', 'MARKETING', 'uniglobal_seasonal_promo', 'template', 'Exclusive Offer for Valued Partner! Enjoy 25% off on all enterprise consultancy packages.', 'promo_banner.jpg', 'sent', 0.0270, 0.0070, 0.0340, NOW() - INTERVAL 10 MINUTE, NULL, NULL),
('wamid.HBgLMzk3MzkwMDAwMDRVAgARGBI5MjgzNzE5MjM4MTk0AA==', 'inbound', 'WhatsApp Webhook', '+97317008899', '+97339000004', 'SERVICE', NULL, 'text', 'Hello, I need assistance regarding our service quotation.', NULL, 'read', 0.0075, 0.0025, 0.0100, NOW() - INTERVAL 5 MINUTE, NOW() - INTERVAL 5 MINUTE, NOW() - INTERVAL 4 MINUTE)
ON DUPLICATE KEY UPDATE to_phone=VALUES(to_phone);
