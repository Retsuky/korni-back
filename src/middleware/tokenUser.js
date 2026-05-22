/**
 * JWT для **пользователей сайта** (личный кабинет).
 * Секрет: JWT_SECRET_USER. Заголовок: Authorization: Bearer &lt;token&gt;.
 */
const jwt = require('jsonwebtoken');

module.exports = function tokenUser(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_USER);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
