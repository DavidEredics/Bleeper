const fs = require('fs');
const config = require('./config.json');

let confFile = {};

if (process.env.confFile) {
  confFile = JSON.parse(fs.readFileSync(process.env.confFile));
}

const env = process.env.NODE_ENV || confFile.env || 'development';

if (!Object.prototype.hasOwnProperty.call(config, env)) {
  console.log('no config found for the provided NODE_ENV');
  process.exit(1);
}

module.exports = {
  env,
  port: process.env.PORT
    || confFile.port || config[env].port,
  host: process.env.HOST
    || confFile.host || config[env].host,
  name: process.env.NAME
    || confFile.name || config[env].name,
  certPath: process.env.cert_path
    || confFile.certPath || config[env].certPath,
  cert: process.env.cert
    || confFile.cert || config[env].cert,
  key: process.env.key
    || confFile.key || config[env].key,
  jwtSecret: process.env.jwtSecret
    || confFile.jwtSecret || config[env].jwtSecret,
  jwtKeyPath: process.env.jwtKeyPath
    || confFile.jwtKeyPath || config[env].jwtKeyPath,
  jwtKeyPrv: process.env.jwtKeyPrivate
    || confFile.jwtKeyPrivate || config[env].jwtKeyPrivate,
  jwtKeyPub: process.env.jwtKeyPublic
    || confFile.jwtKeyPublic || config[env].jwtKeyPublic,
  allowHTTP1: process.env.allowHTTP1
    || confFile.allowHTTP1 || config[env].allowHTTP1,
  MongoDBurl: process.env.MONGODB_URI
    || confFile.MongoDBurl || config[env].MongoDBurl,
  dbName: process.env.DB_NAME
    || confFile.dbName || config[env].dbName,
  openReg: process.env.openReg
    || confFile.openRegistration || config[env].openRegistration,
  openReceive: process.env.openReceive
    || confFile.openReceive || config[env].openReceive,
};
