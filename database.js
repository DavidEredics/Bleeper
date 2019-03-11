const { MongoClient } = require('mongodb');
const config = require('./config');

const uri = config.MongoDBurl;
const client = new MongoClient(uri, { useNewUrlParser: true });

let db = null;

const connect = (cb) => {
  if (db) {
    cb();
  } else {
    client.connect((err) => {
      if (err) {
        cb(err);
      } else {
        db = client.db(config.dbName);
        cb();
      }
    });
  }
};

const DB = () => db;

const close = () => client.close(err => err);

module.exports = { connect, DB, close };
