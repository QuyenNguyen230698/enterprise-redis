const cors = require('cors');
require('dotenv').config(); // Thêm dòng này để cấu hình dotenv

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
const corsOptions = {
  origin: process.env.ENV === 'dev' ? '*' : (origin, callback) => {
    if (!origin) return callback(null, true); // Cho phép các yêu cầu không có origin
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'cache-control'],
  credentials: true,
};

module.exports = cors(corsOptions);