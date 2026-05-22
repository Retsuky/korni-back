/**
 * Опциональная привязка пользователя к публичным POST (заявки).
 * Если в заголовке валидный JWT пользователя — в req.user кладётся { id, email }.
 */
const jwt = require('jsonwebtoken');

module.exports = function optionalUser(req, _res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_USER);
        req.user = decoded.user;
    } catch {
        req.user = undefined;
    }
    next();
};
