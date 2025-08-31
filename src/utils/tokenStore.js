const crypto = require('crypto');
const store = new Map();

// TTL in ms
const DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes

function generateToken(payload, ttl = DEFAULT_TTL) {
  const token = crypto.randomBytes(6).toString('hex');
  store.set(token, payload);
  setTimeout(() => store.delete(token), ttl);
  return token;
}

function consumeToken(token) {
  if (!token) return null;
  const payload = store.get(token) || null;
  // We don't delete automatically to allow multiple retries within TTL; caller may delete if desired
  return payload;
}

function deleteToken(token) {
  store.delete(token);
}

module.exports = { generateToken, consumeToken, deleteToken };
