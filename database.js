const { MongoClient } = require('mongodb');
const config = require('./config');

const uri = config.MONGODB_URI;
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
        db = client.db(config.DB_NAME);
        cb();
      }
    });
  }
};

const DB = () => db;

module.exports = { connect, DB };
