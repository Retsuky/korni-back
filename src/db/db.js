const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Ошибка подключения:', err.stack);
    } else {
        console.log('Успешно подключились к БД!', res.rows);
    }
});

async function query(text, params) {
    const client = await pool.connect();
    try {
        return await client.query(text, params);
    } catch (err) {
        console.error('Ошибка запроса:', { text, params }, err);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    query
};