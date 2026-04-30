const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 10000000, // 1 minute
  max: 100000000, // limit each IP to 100 requests per minute
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

module.exports = limiter;
