module.exports = {
  apps: [
    {
      name: 'maintenance-app',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=maintenance-db --local --ip 0.0.0.0 --port 8080',
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
