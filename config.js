const config = require('./config.json');

const env = process.env.NODE_ENV || 'development';

if (!Object.prototype.hasOwnProperty.call(config, env)) {
  console.log('no config found for the provided NODE_ENV');
  process.exit(1);
}

module.exports = {
  env,
  port: process.env.PORT || config[env].port,
  host: process.env.HOST || config[env].host,
  name: process.env.NAME || config[env].name,
  certPath: process.env.cert_path || config[env].certPath,
  cert: process.env.cert || config[env].cert,
  key: process.env.key || config[env].key,
  jwtSecret: process.env.jwtSecret || config[env].jwtSecret,
  jwtKeyPath: process.env.jwtKeyPath || config[env].jwtKeyPath,
  jwtKeyPrv: process.env.jwtKeyPrv || config[env].jwtKeyPrivate,
  jwtKeyPub: process.env.jwtKeyPub || config[env].jwtKeyPublic,
  allowHTTP1: process.env.allowHTTP1 || config[env].allowHTTP1,
  MongoDBurl: process.env.MONGODB_URI || config[env].MongoDBurl,
  dbName: process.env.DB_NAME || config[env].dbName,
  openReg: process.env.openReg || config[env].openRegistration,
  openReceive: process.env.openReceive || config[env].openReceive,
};
