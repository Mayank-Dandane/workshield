const CryptoJS = require('crypto-js');

const QR_SECRET = process.env.QR_SECRET;

/**
 * Encrypt QR token payload
 * @param {Object} payload - { workshop_id, type, timestamp }
 * @returns {string} encrypted token
 */
const encryptToken = (payload) => {
  const jsonStr = JSON.stringify(payload);
  const encrypted = CryptoJS.AES.encrypt(jsonStr, QR_SECRET).toString();
  // Make URL-safe
  return encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '~');
};

/**
 * Decrypt QR token
 * @param {string} token - encrypted token string
 * @returns {Object} decrypted payload
 */
const decryptToken = (token) => {
  try {
    // Reverse URL-safe encoding
    const normalized = token.replace(/-/g, '+').replace(/_/g, '/').replace(/~/g, '=');
    const bytes = CryptoJS.AES.decrypt(normalized, QR_SECRET);
    const jsonStr = bytes.toString(CryptoJS.enc.Utf8);
    if (!jsonStr) throw new Error('Decryption failed');
    return JSON.parse(jsonStr);
  } catch (err) {
    throw new Error('Invalid or tampered QR token');
  }
};

module.exports = { encryptToken, decryptToken };