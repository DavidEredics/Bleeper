const fs = require('fs');
const jwt = require('jsonwebtoken');

const config = require('./config');

const prvKey = config.jwt_key_path + config.jwt_key_prv;
const pubKey = config.jwt_key_path + config.jwt_key_pub;

const keyOrSecret = new Promise((resolve, reject) => {
  if (config.jwt_secret !== '') {
    resolve('secret');
  }
  fs.access(prvKey, fs.constants.R_OK, (prvKeyErr) => {
    if (prvKeyErr) {
      reject(prvKeyErr);
    }
    fs.access(pubKey, fs.constants.R_OK, (pubKeyErr) => {
      if (pubKeyErr) {
        reject(prvKeyErr);
      }
      resolve('key');
    });
  });
});

let keyOrSecretValue;
// check if secret or key file present
keyOrSecret.then((result) => {
  if (result === 'secret') {
    keyOrSecretValue = 'secret';
  } else if (result === 'key') {
    keyOrSecretValue = 'key';
  }
}).catch((err) => {
  console.error(err);
  console.error('Neither jwt secret or key file provided');
  process.exit(1);
});


exports.sign = (name) => {
  function jwtKey() {
    // sign with RSA SHA256
    const privateKey = fs.readFileSync(prvKey);
    const token = jwt.sign({ name }, privateKey, { algorithm: 'RS256', expiresIn: '12h' });
    const { iat, exp } = jwt.decode(token);
    return { iat, exp, token };
  }
  function jwtSecret() {
    const token = jwt.sign({ name }, config.jwt_secret, { expiresIn: '12h' });
    const { iat, exp } = jwt.decode(token);
    return { iat, exp, token };
  }

  if (keyOrSecretValue === 'secret') {
    return jwtSecret();
  }
  if (keyOrSecretValue === 'key') {
    return jwtKey();
  }
};

exports.verify = (token) => {
  function jwtKey() {
    const publicKey = fs.readFileSync(pubKey);
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err) => {
      if (err) {
        console.error(err);
        return 'invalid';
      }
      return 'valid';
    });
  }
  function jwtSecret() {
    return jwt.verify(token, config.jwt_secret, { algorithms: ['HS256'] }, (err) => {
      if (err) {
        console.error(err);
        return 'invalid';
      }
      return 'valid';
    });
  }

  if (keyOrSecretValue === 'secret') {
    return jwtSecret();
  }
  if (keyOrSecretValue === 'key') {
    return jwtKey();
  }
};
