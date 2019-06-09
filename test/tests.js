process.env.NODE_ENV = 'test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const database = require('../database');
const server = require('../server');

before(() => {

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
require('./message.test');
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
  server.close();
});
