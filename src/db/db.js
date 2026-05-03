/**
 * Доступ к PostgreSQL через пул **`pg.Pool`** и единую функцию запросов.
 *
 * @module db
 *
 * @description
 *
 * ## Конфигурация
 *
 * Переменные **`DB_USER`**, **`DB_HOST`**, **`DB_NAME`**, **`DB_PASSWORD`**, **`DB_PORT`** загружаются через `dotenv`. При старте выполняется тестовый запрос `SELECT NOW()` и результат логируется.
 *
 * ## Использование в роутерах
 *
 * Экспортируется **`query(text, params)`**: каждый вызов берёт клиента из пула, выполняет переданный SQL и освобождает соединение в `finally`. Ошибки логируются и пробрасываются наверх.
 *
 * Для вставок/обновлений используйте параметризованные запросы (`$1`, `$2`, …), чтобы избежать SQL-инъекций.
 */

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

/**
 * Выполняет параметризованный SQL-запрос в рамках клиента из пула.
 * @param {string} text SQL с плейсхолдерами `$1`, `$2`, …
 * @param {Array} [params] аргументы запроса
 * @returns {Promise<object>} результат `pg` (`QueryResult`: поля `rows`, `rowCount` и др.)
 */
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