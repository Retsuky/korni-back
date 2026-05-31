-- Сообщения менеджер ↔ клиент по заявке
-- Запуск: pnpm run db:migrate:messages (из korni-back)

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
