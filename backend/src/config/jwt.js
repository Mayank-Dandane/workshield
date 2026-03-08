const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token
 * @param {Object} payload - { id, role }
 */
const generateToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 */
const verifyToken = (token) => {
  return jwt.verify(token, SECRET); // throws if invalid/expired
};

module.exports = { generateToken, verifyToken };