-- PS Pay — инициализация и наполнение базы одним SQL-скриптом.
--
-- Использование:
--   psql -h <host> -U <user> -d pspay -f scripts/init-db.sql
--
-- База pspay должна существовать заранее (CREATE DATABASE нельзя
-- выполнять внутри транзакции и через -f). Создать можно так:
--   psql -h <host> -U <user> -d postgres -c "CREATE DATABASE pspay"
--
-- Скрипт идемпотентный: повторный запуск ничего не ломает
-- (IF NOT EXISTS на таблицах, ON CONFLICT DO NOTHING на вставках).

-- ============================================================
-- 1. СХЕМА
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS countries (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    flag VARCHAR(10) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS directions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    country_from VARCHAR(3) NOT NULL,
    country_to VARCHAR(3) NOT NULL,
    currency_from VARCHAR(3) NOT NULL,
    currency_to VARCHAR(3) NOT NULL,
    margin_percent NUMERIC(5,2) DEFAULT 0,
    commission_percent NUMERIC(5,2) DEFAULT 1.5,
    min_commission NUMERIC(10,2) DEFAULT 50,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(3) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    direction_id INTEGER REFERENCES directions(id),
    provider_id INTEGER REFERENCES providers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    sender_card VARCHAR(19),
    sender_name VARCHAR(255),
    receiver_card VARCHAR(30),
    receiver_name VARCHAR(255),
    receiver_phone VARCHAR(30),
    receiver_account VARCHAR(50),
    amount_send NUMERIC(15,2),
    amount_receive NUMERIC(15,2),
    currency_from VARCHAR(3),
    currency_to VARCHAR(3),
    exchange_rate NUMERIC(15,6),
    commission NUMERIC(15,2),
    total_debit NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- ============================================================
-- 2. СПРАВОЧНИКИ
-- ============================================================

-- Страны
INSERT INTO countries (code, name, currency, flag) VALUES
    ('RUS', 'Россия',       'RUB', '🇷🇺'),
    ('UZB', 'Узбекистан',   'UZS', '🇺🇿'),
    ('TJK', 'Таджикистан',  'TJS', '🇹🇯'),
    ('KGZ', 'Кыргызстан',   'KGS', '🇰🇬'),
    ('KAZ', 'Казахстан',    'KZT', '🇰🇿'),
    ('AZE', 'Азербайджан',  'AZN', '🇦🇿'),
    ('GEO', 'Грузия',       'GEL', '🇬🇪'),
    ('TUR', 'Турция',       'TRY', '🇹🇷'),
    ('CHN', 'Китай',        'CNY', '🇨🇳'),
    ('ARM', 'Армения',      'AMD', '🇦🇲')
ON CONFLICT DO NOTHING;

-- Направления переводов (RU-UZ и RU-TJ — с наценкой, остальные — дефолтные 0)
INSERT INTO directions (code, name, country_from, country_to, currency_from, currency_to, margin_percent) VALUES
    ('RU-UZ', 'Россия → Узбекистан',  'RUS', 'UZB', 'RUB', 'UZS', 3.00),
    ('RU-TJ', 'Россия → Таджикистан', 'RUS', 'TJK', 'RUB', 'TJS', 4.00),
    ('RU-KG', 'Россия → Кыргызстан',  'RUS', 'KGZ', 'RUB', 'KGS', 0.00),
    ('RU-KZ', 'Россия → Казахстан',   'RUS', 'KAZ', 'RUB', 'KZT', 0.00),
    ('RU-AZ', 'Россия → Азербайджан', 'RUS', 'AZE', 'RUB', 'AZN', 0.00),
    ('RU-GE', 'Россия → Грузия',      'RUS', 'GEO', 'RUB', 'GEL', 0.00),
    ('RU-TR', 'Россия → Турция',      'RUS', 'TUR', 'RUB', 'TRY', 0.00),
    ('RU-CN', 'Россия → Китай',       'RUS', 'CHN', 'RUB', 'CNY', 0.00),
    ('RU-AM', 'Россия → Армения',     'RUS', 'ARM', 'RUB', 'AMD', 0.00)
ON CONFLICT DO NOTHING;

-- Провайдеры-партнёры
INSERT INTO providers (code, name, country) VALUES
    ('partner-uz', 'UzTransfer',  'UZB'),
    ('partner-tj', 'TajPay',      'TJK'),
    ('partner-kg', 'KyrgyzRemit', 'KGZ'),
    ('partner-kz', 'KazTransfer', 'KAZ'),
    ('partner-az', 'AzerPay',     'AZE'),
    ('partner-ge', 'GeoPay',      'GEO'),
    ('partner-tr', 'TurkRemit',   'TUR'),
    ('partner-cn', 'ChinaPay',    'CHN'),
    ('partner-am', 'ArmTransfer', 'ARM')
ON CONFLICT DO NOTHING;

-- Способы оплаты
INSERT INTO payment_methods (code, name, type) VALUES
    ('card-visa',     'Visa',              'card'),
    ('card-mc',       'Mastercard',        'card'),
    ('card-mir',      'МИР',               'card'),
    ('bank-account',  'Банковский счёт',   'account'),
    ('mobile-wallet', 'Мобильный кошелёк', 'wallet')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. ДЕМО-ПОЛЬЗОВАТЕЛЬ
-- ============================================================
-- demo@pspay.ru / demo123  (BCrypt-хэш)
-- Этот юзер также является администратором: бэк определяет админа
-- по конфигу app.admin.user-id (id=1 в application.yml).

INSERT INTO users (email, password_hash, full_name) VALUES
    ('demo@pspay.ru', '$2a$10$0ME7a1aaiwy2GtrGB3BI7.7TS6IEhV6CG.x2e1zsE6JYVgYIBSvp6', 'Демо Пользователь')
ON CONFLICT DO NOTHING;
