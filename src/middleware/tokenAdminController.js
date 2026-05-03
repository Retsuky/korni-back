/**
 * Проверка JWT администратора для защиты сегмента `/api/v1/admin/*` (кроме авторизации).
 *
 * @module middleware/tokenAdminController
 *
 * @description
 *
 * ## Ожидаемый заголовок
 *
 * `Authorization: Bearer &lt;jwt&gt;` — префикс `Bearer ` (с пробелом) снимается, строка передаётся в `jwt.verify`.
 *
 * ## Секрет и полезная нагрузка
 *
 * Используется **`JWT_SECRET_ADMIN`**. После успешной проверки в **`req.admin`** попадает объект из payload (как правило **`{ id }`**, см. создание токена в `{@link module:routes/admin/auth}`).
 *
 * ## Ответы при ошибке
 *
 * | Код | Когда |
 * |-----|--------|
 * | **401** | Заголовок отсутствует (`No token`) или подпись/срок недействительны (`Token is not valid`) |
 */

const jwt = require('jsonwebtoken');


module.exports = function (req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
        req.admin = decoded.admin;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
