const crypto = require('crypto');

const config = require('./config');

const algorithm = 'aes-256-gcm';

if (config.encKey === undefined || config.encKey.length !== 32) {
  console.error('No usable encryption key');
  process.exit(1);
}
const key = config.encKey;

exports.encrypt = (message) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    algorithm, key, iv, { authTagLength: 16 },
  );
  let encryptedMessage = cipher.update(message);
  encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
  return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]);
};

exports.decrypt = (encText) => {
  const authTag = encText.slice(-16);
  const iv = encText.slice(0, 12);
  const encryptedMessage = encText.slice(12, -16);
  const decipher = crypto.createDecipheriv(
    algorithm, key, iv, { authTagLength: 16 },
  );
  decipher.setAuthTag(authTag);
  let message = decipher.update(encryptedMessage);
  message = Buffer.concat([message, decipher.final()]);
  return message.toString();
};
