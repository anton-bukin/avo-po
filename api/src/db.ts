import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pspay',
});

export default pool;

export async function initDB() {
  await pool.query(`
    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Directions (e.g. RU -> UZ)
    CREATE TABLE IF NOT EXISTS directions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      country_from VARCHAR(3) NOT NULL,
      country_to VARCHAR(3) NOT NULL,
      currency_from VARCHAR(3) NOT NULL,
      currency_to VARCHAR(3) NOT NULL,
      margin_percent NUMERIC(5,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true
    );

    -- Countries
    CREATE TABLE IF NOT EXISTS countries (
      code VARCHAR(3) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      currency VARCHAR(3) NOT NULL,
      flag VARCHAR(10) DEFAULT ''
    );

    -- Providers (partner systems)
    CREATE TABLE IF NOT EXISTS providers (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      country VARCHAR(3) NOT NULL,
      is_active BOOLEAN DEFAULT true
    );

    -- Payment methods
    CREATE TABLE IF NOT EXISTS payment_methods (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT true
    );

    -- Transfers
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
  `);

  // Migration: add margin_percent if missing
  await pool.query(`
    ALTER TABLE directions ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5,2) DEFAULT 0
  `).catch(() => {});

  // Seed reference data if empty
  const { rows } = await pool.query('SELECT count(*) as c FROM countries');
  if (parseInt(rows[0].c) === 0) {
    await seedData();
  }
}

async function seedData() {
  // Countries
  await pool.query(`
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
  `);

  // Directions
  await pool.query(`
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
  `);

  // Providers
  await pool.query(`
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
  `);

  // Payment methods
  await pool.query(`
    INSERT INTO payment_methods (code, name, type) VALUES
    ('card-visa', 'Visa', 'card'),
    ('card-mc', 'Mastercard', 'card'),
    ('card-mir', 'МИР', 'card'),
    ('bank-account', 'Банковский счёт', 'account'),
    ('mobile-wallet', 'Мобильный кошелёк', 'wallet')
    ON CONFLICT DO NOTHING;
  `);

  // Demo user: demo@pspay.ru / demo123
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.default.hashSync('demo123', 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    ['demo@pspay.ru', hash, 'Демо Пользователь']
  );
}
