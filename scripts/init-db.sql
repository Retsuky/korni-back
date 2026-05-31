-- Схема БД для korni-back (PostgreSQL)
-- Выполняется скриптом scripts/init-db.js

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stages (
    id SERIAL PRIMARY KEY,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS types (
    id SERIAL PRIMARY KEY,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    title TEXT,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS slides (
    id SERIAL PRIMARY KEY,
    slide_order INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    title TEXT DEFAULT '',
    subtitle TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cost TEXT,
    square DOUBLE PRECISION,
    floors INTEGER,
    terraces INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    plans TEXT[] DEFAULT ARRAY[]::TEXT[],
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT,
    style TEXT,
    material TEXT,
    cover TEXT,
    popular BOOLEAN DEFAULT FALSE,
    sections JSONB,
    priority INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    stage TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Пользователи сайта (личный кабинет, матрица 1.1)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    text TEXT,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    config_json JSONB,
    estimated_total NUMERIC
);

CREATE TABLE IF NOT EXISTS application_photo_reports (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    stage VARCHAR(120) NOT NULL DEFAULT 'Этап работ',
    comment TEXT,
    images TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_photo_reports_application ON application_photo_reports (application_id);
CREATE INDEX IF NOT EXISTS idx_photo_reports_user ON application_photo_reports (user_id);

CREATE TABLE IF NOT EXISTS application_messages (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('manager', 'client')),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_messages_application ON application_messages (application_id);
CREATE INDEX IF NOT EXISTS idx_app_messages_user ON application_messages (user_id);
