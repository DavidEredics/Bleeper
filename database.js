const { MongoClient } = require('mongodb');
const fs = require('fs');
const config = require('./config');

const uri = config.MongoDBurl;
const options = {
  useNewUrlParser: true,
  appname: config.name,
};
if (config.MongoDBssl) {
  options.ssl = config.MongoDBssl;
}
if (config.MongoDBsslCA) {
  options.sslCA = fs.readFileSync(config.MongoDBsslCA);
}
if (config.MongoDBsslCert) {
  options.sslCert = fs.readFileSync(config.MongoDBsslCert);
}
if (config.MongoDBsslKey) {
  options.sslKey = fs.readFileSync(config.MongoDBsslKey);
}
if (config.MongoDBsslPass) {
  options.sslPass = config.MongoDBsslPass;
}

const client = new MongoClient(uri, options);

let db = null;

const connect = (cb) => {
  if (db) {
    cb();
  } else {
    client.connect((err) => {
      if (err) {
        cb(err);
      } else {
        if (config.dbName) {
          db = client.db(config.dbName);
        } else {
          db = client.db();
        }
        cb();
      }
    });
  }
};

const DB = () => db;

const close = () => client.close(err => err);

module.exports = { connect, DB, close };
