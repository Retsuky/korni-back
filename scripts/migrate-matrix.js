/**
 * Применяет scripts/migrate-matrix-2026.sql к существующей БД.
 * Запуск из korni-back: pnpm run db:migrate
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function requireEnv(name) {
    const v = process.env[name];
    if (v === undefined || v === '') {
        console.error(`Заполните ${name} в korni-back/.env`);
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

async function main() {
    requireEnv('DB_USER');
    requireEnv('DB_HOST');
    requireEnv('DB_NAME');
    const password = String(process.env.DB_PASSWORD ?? '');
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;

    const sqlPath = path.join(__dirname, 'migrate-matrix-2026.sql');
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
        console.log('Миграция matrix-2026 применена.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
