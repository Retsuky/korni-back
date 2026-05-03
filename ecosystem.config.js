/**
 * Конфигурация процесса **PM2** для продакшен-запуска бэкенда.
 *
 * @module ecosystem
 *
 * @description
 *
 * - **name** `back`, **script** `./src/server.js`.
 * - **watch** на текущую директорию с исключением `uploads` и `node_modules`.
 * - **NODE_ENV** `production`, **PORT** `3020` в `env`.
 * - Ограничение памяти Node: `--max-old-space-size=512`, перезапуск при **1G** (`max_memory_restart`).
 *
 * Запуск: `pm2 start ecosystem.config.js` (при установленном PM2 глобально).
 */

module.exports = {
    apps: [
      {
        name: "back",
        script: "./src/server.js",
        instances: 1,
        watch: ['.'], // Отслеживаем только текущую директорию, исключая uploads
        ignore_watch: [
          'node_modules',
          'uploads',
          'uploads/*',
          'uploads/**/*'
        ], 
        watch_options: {
          usePolling: false,
          interval: 2000,
          binaryInterval: 2000,
          ignorePermissionErrors: true,
          atomic: true
        },
        env: {
          NODE_ENV: "production",
          PORT: 3020,
        },
        node_args: "--max-old-space-size=512", 
        max_memory_restart: "1G",
      },
    ],
};