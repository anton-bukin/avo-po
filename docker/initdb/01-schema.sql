-- PS Pay Database Schema
-- Executed on first PostgreSQL container start via docker-entrypoint-initdb.d

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
