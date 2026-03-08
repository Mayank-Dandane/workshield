const QRCode = require('qrcode');
const { encryptToken, decryptToken } = require('../utils/token.util');
const { isWithinWindow } = require('../utils/time.util');

const QR_VALIDITY_SECONDS = parseInt(process.env.QR_VALIDITY_SECONDS) || 60;
const CERT_BASE_URL = process.env.CERT_BASE_URL || 'http://localhost:5000';

// ─── Build scan URL ────────────────────────────────────────────
// QR will contain this URL — student scans → browser opens → app handles it
const buildScanURL = (token, workshopId) => {
  const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${clientURL}/student/scan?token=${encodeURIComponent(token)}&workshop=${workshopId}`;};

/**
 * Generate a QR token payload
 */
const generateQRToken = (workshopId, workshopSeed, type = 'entry') => {
  const timestamp = new Date().toISOString();

  const payload = {
    workshop_id: workshopId,
    seed: workshopSeed,
    type,
    timestamp,
    nonce: Math.random().toString(36).substring(2, 8)
  };

  const token = encryptToken(payload);

  const expiresAt = new Date(
    Date.now() + QR_VALIDITY_SECONDS * 1000
  ).toISOString();

  return { token, expiresAt, type, timestamp };
};

/**
 * Generate QR code image as base64
 * QR now contains a URL — no camera permission needed in app!
 */
const generateQRImage = async (token, workshopId) => {
  try {
    // Build the scan URL
    const scanURL = buildScanURL(token, workshopId);

    const qrDataURL = await QRCode.toDataURL(scanURL, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return { qrDataURL, scanURL };

  } catch (err) {
    throw new Error('Failed to generate QR image');
  }
};

/**
 * Validate a scanned QR token
 */
const validateQRToken = (token, expectedWorkshopId, expectedSeed) => {
  try {
    const payload = decryptToken(token);

    if (payload.workshop_id !== expectedWorkshopId) {
      return { valid: false, reason: 'QR does not belong to this workshop' };
    }

    if (payload.seed !== expectedSeed) {
      return { valid: false, reason: 'Invalid QR seed' };
    }

    if (!isWithinWindow(payload.timestamp, QR_VALIDITY_SECONDS)) {
      return { valid: false, reason: 'QR code has expired. Please scan the latest QR.' };
    }

    return { valid: true, type: payload.type, payload };

  } catch (err) {
    return { valid: false, reason: err.message || 'Invalid QR token' };
  }
};

module.exports = {
  generateQRToken,
  generateQRImage,
  validateQRToken,
  buildScanURL
};