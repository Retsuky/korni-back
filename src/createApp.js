/**
 * Создаёт приложение Express **без** вызова listen — для тестов (supertest) и возможного reuse.
 * @returns {import('express').Express}
 */
function createApp() {
  const express = require('express');
  const cors = require('cors');
  const path = require('path');

  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  app.use(
    cors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    })
  );

  app.get('/test', async (req, res) => {
    res.status(200).json(200);
  });

  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  const routes = require('./routes');
  app.use('/api/v1', routes);

  return app;
}

module.exports = createApp;
