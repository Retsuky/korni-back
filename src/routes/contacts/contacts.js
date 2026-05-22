/**

 * Приём **заявок (applications)** с публичного сайта без JWT.

 *

 * @module routes/contacts

 *

 * Префикс **`/api/v1/contacts`**. Body ожидается в виде **`{ data: { ... } }`**.

 *

 * | Метод | Путь | Body `data` |

 * |-------|------|-------------|

 * | POST | `/create` | `name`, `phone`, `email`, `text`, опционально `config`, `estimated_total` |

 * | POST | `/create-short` | `name`, `phone` |

 *

 * Если передан валидный JWT пользователя (`Authorization: Bearer`), заявка привязывается к `user_id`.

 */



const express = require('express');

const router = express.Router();

const { query } = require('../../db/db');

const optionalUser = require('../../middleware/optionalUser');



router.post('/create', optionalUser, async (req, res) => {

    const { data } = req.body;

    const userId = req.user?.id ?? null;

    const configJson = data?.config != null ? data.config : null;

    const estimatedTotal =

        data?.estimated_total != null && data.estimated_total !== ''

            ? Number(data.estimated_total)

            : null;



    try {

        const newApplication = await query(

            `INSERT INTO applications (name, phone, email, text, user_id, config_json, estimated_total)

             VALUES ($1,$2,$3,$4,$5,$6,$7)

             RETURNING *`,

            [

                data.name,

                data.phone,

                data.email,

                data.text,

                userId,

                configJson,

                Number.isNaN(estimatedTotal) ? null : estimatedTotal,

            ]

        );



        if (newApplication.rows.length === 0) {

            return res.status(400).json({ msg: 'Произошла ошибка при создании' });

        }



        res.status(200).json({ msg: 'Application create' });

    } catch (error) {

        console.log(error);

        res.status(500).json(error);

    }

});



router.post('/create-short', optionalUser, async (req, res) => {

    const { data } = req.body;

    const userId = req.user?.id ?? null;



    try {

        const newApplication = await query(

            `INSERT INTO applications (name, phone, user_id)

             VALUES ($1,$2,$3)

             RETURNING *`,

            [data.name, data.phone, userId]

        );



        if (newApplication.rows.length === 0) {

            return res.status(400).json({ msg: 'Произошла ошибка при создании' });

        }



        res.status(200).json({ msg: 'Application create' });

    } catch (error) {

        console.log(error);

        res.status(500).json(error);

    }

});



module.exports = router;

