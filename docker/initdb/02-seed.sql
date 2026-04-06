-- PS Pay Seed Data

-- Countries
INSERT INTO countries (code, name, currency, flag) VALUES
    ('RUS', 'Россия', 'RUB', '🇷🇺'),
    ('UZB', 'Узбекистан', 'UZS', '🇺🇿'),
    ('TJK', 'Таджикистан', 'TJS', '🇹🇯'),
    ('KGZ', 'Кыргызстан', 'KGS', '🇰🇬'),
    ('KAZ', 'Казахстан', 'KZT', '🇰🇿'),
    ('AZE', 'Азербайджан', 'AZN', '🇦🇿'),
    ('GEO', 'Грузия', 'GEL', '🇬🇪'),
    ('TUR', 'Турция', 'TRY', '🇹🇷'),
    ('CHN', 'Китай', 'CNY', '🇨🇳'),
    ('ARM', 'Армения', 'AMD', '🇦🇲')
ON CONFLICT DO NOTHING;

-- Directions
INSERT INTO directions (code, name, country_from, country_to, currency_from, currency_to) VALUES
    ('RU-UZ', 'Россия → Узбекистан', 'RUS', 'UZB', 'RUB', 'UZS'),
    ('RU-TJ', 'Россия → Таджикистан', 'RUS', 'TJK', 'RUB', 'TJS'),
    ('RU-KG', 'Россия → Кыргызстан', 'RUS', 'KGZ', 'RUB', 'KGS'),
    ('RU-KZ', 'Россия → Казахстан', 'RUS', 'KAZ', 'RUB', 'KZT'),
    ('RU-AZ', 'Россия → Азербайджан', 'RUS', 'AZE', 'RUB', 'AZN'),
    ('RU-GE', 'Россия → Грузия', 'RUS', 'GEO', 'RUB', 'GEL'),
    ('RU-TR', 'Россия → Турция', 'RUS', 'TUR', 'RUB', 'TRY'),
    ('RU-CN', 'Россия → Китай', 'RUS', 'CHN', 'RUB', 'CNY'),
    ('RU-AM', 'Россия → Армения', 'RUS', 'ARM', 'RUB', 'AMD')
ON CONFLICT DO NOTHING;

-- Providers
INSERT INTO providers (code, name, country) VALUES
    ('partner-uz', 'UzTransfer', 'UZB'),
    ('partner-tj', 'TajPay', 'TJK'),
    ('partner-kg', 'KyrgyzRemit', 'KGZ'),
    ('partner-kz', 'KazTransfer', 'KAZ'),
    ('partner-az', 'AzerPay', 'AZE'),
    ('partner-ge', 'GeoPay', 'GEO'),
    ('partner-tr', 'TurkRemit', 'TUR'),
    ('partner-cn', 'ChinaPay', 'CHN'),
    ('partner-am', 'ArmTransfer', 'ARM')
ON CONFLICT DO NOTHING;

-- Payment methods
INSERT INTO payment_methods (code, name, type) VALUES
    ('card-visa', 'Visa', 'card'),
    ('card-mc', 'Mastercard', 'card'),
    ('card-mir', 'МИР', 'card'),
    ('bank-account', 'Банковский счёт', 'account'),
    ('mobile-wallet', 'Мобильный кошелёк', 'wallet')
ON CONFLICT DO NOTHING;

-- Demo user: demo@pspay.ru / demo123
INSERT INTO users (email, password_hash, full_name) VALUES
    ('demo@pspay.ru', '$2a$10$0ME7a1aaiwy2GtrGB3BI7.7TS6IEhV6CG.x2e1zsE6JYVgYIBSvp6', 'Демо Пользователь')
ON CONFLICT DO NOTHING;
