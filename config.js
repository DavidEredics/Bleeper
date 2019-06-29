const fs = require('fs');

const args = require('minimist')(process.argv.slice(2));
const config = require('./config.json');

let confFile = {};
if (args._) {
  if (args._[0] !== 'test/tests.js' && fs.existsSync(args._[0])) {
    confFile = JSON.parse(fs.readFileSync(args._[0]));
  }
}
if (args.confFile) {
  confFile = JSON.parse(fs.readFileSync(args.confFile));
} else if (args.conf) {
  confFile = JSON.parse(fs.readFileSync(args.conf));
} else if (process.env.confFile) {
  confFile = JSON.parse(fs.readFileSync(process.env.confFile));
}

const env = args.env || args.NODE_ENV || process.env.NODE_ENV || confFile.env || 'development';

if (!Object.prototype.hasOwnProperty.call(config, env)) {
  console.log('no config found for the provided NODE_ENV');
  process.exit(1);
}

module.exports = {
  env,
  port: args.port || args.p || process.env.PORT
    || confFile.port || config[env].port,
  host: args.host || process.env.HOST
    || confFile.host || config[env].host,
  name: args.name || process.env.NAME
    || confFile.name || config[env].name,
  fqdn: args.fqdn || process.env.fqdn
    || confFile.fqdn || config[env].fqdn,
  noHTTPS: args.http || process.env.http
    || confFile.http || config[env].http,
  certPath: args.certPath || process.env.cert_path
    || confFile.certPath || config[env].certPath,
  cert: args.cert || process.env.cert
    || confFile.cert || config[env].cert,
  key: args.key || process.env.key
    || confFile.key || config[env].key,
  ca: args.ca || process.env.ca
    || confFile.ca || config[env].ca,
  jwtSecret: args.jwtSecret || process.env.jwtSecret
    || confFile.jwtSecret || config[env].jwtSecret,
  jwtKeyPath: args.jwtKeyPath || process.env.jwtKeyPath
    || confFile.jwtKeyPath || config[env].jwtKeyPath,
  jwtKeyPrv: args.jwtKeyPrivate || process.env.jwtKeyPrivate
    || confFile.jwtKeyPrivate || config[env].jwtKeyPrivate,
  jwtKeyPub: args.jwtKeyPublic || process.env.jwtKeyPublic
    || confFile.jwtKeyPublic || config[env].jwtKeyPublic,
  allowHTTP1: args.allowHTTP1 || args.http1 || process.env.allowHTTP1
    || confFile.allowHTTP1 || config[env].allowHTTP1,
  openReg: args.openReg || process.env.openReg
    || confFile.openRegistration || config[env].openRegistration,
  openReceive: args.openReceive || process.env.openReceive
    || confFile.openReceive || config[env].openReceive,
  openSend: args.openSend || process.env.openSend
    || confFile.openSend || config[env].openSend,
  corsOrigin: args.corsOrigin || process.env.corsOrigin
    || confFile.corsOrigin || config[env].corsOrigin,
  MongoDBurl: args.MONGODB_URI || args.MongoDBurl || process.env.MONGODB_URI
    || confFile.MongoDBurl || config[env].MongoDBurl,
  dbName: args.DB_NAME || args.dbName || process.env.DB_NAME
    || confFile.dbName || config[env].dbName,
  MongoDBssl: args.MongoDBssl || args.MongoDBssl || process.env.MongoDBssl
  || confFile.MongoDBssl || config[env].MongoDBssl,
  MongoDBsslCA: args.MongoDBsslCA || args.MongoDBsslCA || process.env.MongoDBsslCA
  || confFile.MongoDBsslCA || config[env].MongoDBsslCA,
  MongoDBsslCert: args.MongoDBsslCert || args.MongoDBsslCert || process.env.MongoDBsslCert
  || confFile.MongoDBsslCert || config[env].MongoDBsslCert,
  MongoDBsslKey: args.MongoDBsslKey || args.MongoDBsslKey || process.env.MongoDBsslKey
  || confFile.MongoDBsslKey || config[env].MongoDBsslKey,
  MongoDBsslPass: args.MongoDBsslPass || args.MongoDBsslPass || process.env.MongoDBsslPass
  || confFile.MongoDBsslPass || config[env].MongoDBsslPass,
};
