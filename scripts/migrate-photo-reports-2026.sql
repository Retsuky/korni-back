-- Фотоотчёты по заявкам (ЛК клиента, матрица 2.3)
-- Запуск: pnpm run db:migrate:photo (из korni-back)

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
