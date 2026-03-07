module.exports = {
  apps: [
    {
      name: 'thepuppyday',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/thepuppyday',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      error_file: '/var/log/thepuppyday/error.log',
      out_file: '/var/log/thepuppyday/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
