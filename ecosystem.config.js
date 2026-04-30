module.exports = {
  apps: [
    {
      name: 'bull-queue',
      script: 'server.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true, // Tự động khởi động lại nếu ứng dụng bị lỗi
      watch: false, // Không theo dõi thay đổi trong file
      max_memory_restart: '1G', // Khởi động lại nếu sử dụng quá 1GB RAM
      env: {
        NODE_ENV: 'production',
        PORT: 2000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 2000,
      },
    },
  ],
};