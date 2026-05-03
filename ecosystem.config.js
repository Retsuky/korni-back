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