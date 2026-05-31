/**
 * Применяет scripts/migrate-photo-reports-2026.sql
 * Запуск из korni-back: pnpm run db:migrate:photo
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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
    const password = String(process.env.DB_PASSWORD ?? '');
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
    const sqlPath = path.join(__dirname, 'migrate-photo-reports-2026.sql');
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
        console.log('Миграция photo-reports применена.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
