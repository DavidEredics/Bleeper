const config = require('../config');
const database = require('../database');

before(() => {
  config.DB_NAME = 'Bleeper-test';
});

describe('db connection', () => {
  it('connect to the database', (done) => {
    database.connect((err) => {
      if (err) { done(err); } else {
        done();
      }
    });
  }).timeout(4000);
});

require('./server.test');
require('./user.test');
require('./db.test');

describe('cleanup after the tests', () => {
  it('drop test DB', (done) => {
    database.DB().dropDatabase((err) => {
      if (err) { done(err); } else {
        done();
      }
    });
  });
  it('close the database', (done) => {
    if (database.DB().serverConfig.isConnected()) {
      done(database.close());
    } else {
      done();
    }
  });
});

after(() => {
});
