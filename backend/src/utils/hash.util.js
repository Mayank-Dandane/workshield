const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate unique certificate ID
 * Format: CERT-XXXXXXXX
 */
const generateCertId = () => {
  const id = uuidv4().split('-')[0].toUpperCase();
  return `CERT-${id}`;
};

/**
 * Generate verification hash
 */
const generateCertHash = (studentId, workshopId, issuedAt) => {
  return crypto
    .createHash('sha256')
    .update(`${studentId}-${workshopId}-${issuedAt}`)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
};

module.exports = { generateCertId, generateCertHash };