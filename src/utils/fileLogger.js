const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function writeLog(filename, message) {
  const filePath = path.join(logDir, filename);
  const timestamp = new Date().toISOString();
  fs.appendFile(filePath, `[${timestamp}] ${message}\n`, err => { if (err) console.error('Failed to write log', err); });
}

module.exports = { writeLog };
