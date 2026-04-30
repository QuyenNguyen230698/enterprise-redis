const jwt = require('jsonwebtoken');
const config = require('./index');

const generateToken = (payload, expiresIn) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

const generateRefreshToken = (payload, expiresIn) => {
  return jwt.sign(payload, config.refreshTokenSecret, { expiresIn });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.refreshTokenSecret);
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
};
