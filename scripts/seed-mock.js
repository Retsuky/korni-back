/**
 * Загружает демо-данные из scripts/seed-mock-data.sql.
 * Перед этим нужны таблицы (pnpm run db:init).
 *
 * Внимание: TRUNCATE очищает projects, gallery, slides, categories, stages, types, applications.
 * Таблица admins не затрагивается.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function requireEnv(name) {
    const v = process.env[name];
    if (v === undefined || v === '') {
        console.error(`Задайте ${name} в korni-back/.env`);
        process.exit(1);
    }
    return v;
}

async function main() {
    requireEnv('DB_USER');
    requireEnv('DB_HOST');
    requireEnv('DB_NAME');

    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
    const password = String(process.env.DB_PASSWORD ?? '');

    const sqlPath = path.join(__dirname, 'seed-mock-data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password,
        port,
    });

    await client.connect();
    try {
        await client.query(sql);
        console.log('Мок-данные загружены: слайды, проекты, галерея (построенные дома), справочники, заявки.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
