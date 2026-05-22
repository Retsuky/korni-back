/**
 * Платежи ( матрица 3.1 ): заготовка под YooKassa.
 * Без ключей в .env возвращает понятный ответ вместо «тихого» отсутствия маршрутов.
 */
const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secret = process.env.YOOKASSA_SECRET_KEY;
    const enabled = Boolean(shopId && secret);
    res.status(200).json({
        enabled,
        provider: 'yookassa',
        message: enabled
            ? 'Приём платежей настроен (проверьте тестовую оплату в личном кабинете YooKassa).'
            : 'Задайте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env для включения оплаты.',
    });
});

router.post('/create-deposit', (_req, res) => {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secret = process.env.YOOKASSA_SECRET_KEY;
    if (!shopId || !secret) {
        return res.status(503).json({
            msg: 'Онлайн-оплата не настроена. Обратитесь к администратору.',
        });
    }
    // Полная интеграция @a2seven/yoo-checkout — отдельный шаг (создание платежа, redirect).
    return res.status(501).json({
        msg: 'Создание платежа в разработке: подключите сценарий возврата URL и webhook.',
    });
});

module.exports = router;
