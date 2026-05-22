/**
 * Создаёт таблицы в PostgreSQL по scripts/init-db.sql и опционально добавляет
 * минимальные данные (справочники + админ), если таблицы пустые.
 *
 * Настройки подключения — те же, что у приложения (.env в корне korni-back):
 * DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT
 *
 * Дополнительно:
 * - INIT_ADMIN_LOGIN (по умолчанию admin)
 * - INIT_ADMIN_PASSWORD (по УМОЛЧАНИЮ admin — смените в .env для продакшена)
 *
 * Запуск из папки korni-back: pnpm run db:init
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function requireEnv(name) {
    const v = process.env[name];
    if (v === undefined || v === '') {
        console.error(`Переменная окружения ${name} не задана. Заполните korni-back/.env`);
        process.exit(1);
    }
    return v;
}

function splitSqlStatements(sql) {
    const withoutComments = sql
        .split('\n')
        .filter((line) => !/^\s*--/.test(line))
        .join('\n');
    return withoutComments
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);
}

async function seedIfEmpty(client) {
    const adminLogin = process.env.INIT_ADMIN_LOGIN || 'admin';
    const adminPassword = process.env.INIT_ADMIN_PASSWORD || 'admin';

    const { rows: catCount } = await client.query('SELECT COUNT(*)::int AS c FROM categories');
    if (catCount[0].c === 0) {
        await client.query(
            `INSERT INTO categories (name_ru, name_en, priority) VALUES
             ('Построенные дома', 'builder', 1)`
        );
        console.log('Добавлена минимальная запись в categories');
    }

    const { rows: stageCount } = await client.query('SELECT COUNT(*)::int AS c FROM stages');
    if (stageCount[0].c === 0) {
        await client.query(
            `INSERT INTO stages (name_ru, name_en, priority) VALUES
             ('Этап 1', 'stage-1', 1)`
        );
        console.log('Добавлена минимальная запись в stages');
    }

    const { rows: typeCount } = await client.query('SELECT COUNT(*)::int AS c FROM types');
    if (typeCount[0].c === 0) {
        await client.query(
            `INSERT INTO types (name_ru, name_en, title, description, priority) VALUES
             ('Коттедж', 'cottage', 'Коттедж', 'Описание типа проекта', 1)`
        );
        console.log('Добавлена минимальная запись в types');
    }

    const hash = bcrypt.hashSync(adminPassword, 10);
    const ins = await client.query(
        `INSERT INTO admins (login, password)
         VALUES ($1, $2)
         ON CONFLICT (login) DO NOTHING
         RETURNING id`,
        [adminLogin, hash]
    );
    if (ins.rowCount > 0) {
        console.log(`Создан администратор: логин «${adminLogin}» (смените пароль в продакшене)`);
    } else {
        console.log(`Админ с логином «${adminLogin}» уже есть — строка не перезаписывалась`);
    }
}

async function main() {
    requireEnv('DB_USER');
    requireEnv('DB_HOST');
    requireEnv('DB_NAME');
    const password = String(process.env.DB_PASSWORD ?? '');
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
    if (Number.isNaN(port)) {
        console.error('DB_PORT должен быть числом');
        process.exit(1);
    }

    const sqlPath = path.join(__dirname, 'init-db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = splitSqlStatements(sql);

    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password,
        port,
    });

    await client.connect();
    try {
        for (const stmt of statements) {
            await client.query(stmt + ';');
        }
        console.log('Таблицы созданы (CREATE IF NOT EXISTS).');

        await seedIfEmpty(client);
        console.log('Готово.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
