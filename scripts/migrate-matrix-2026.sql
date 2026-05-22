-- Доп. схема для уже существующих БД (после обновления кода).
-- Запуск из korni-back: pnpm run db:migrate
-- Требуется PostgreSQL 11+ (ADD COLUMN IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'new';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS config_json JSONB;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS estimated_total NUMERIC;
