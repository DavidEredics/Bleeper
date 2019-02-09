const chai = require('chai');
const chaiHttp = require('chai-http');

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const config = require('../config');
const server = require('../server');
const database = require('../database');

chai.use(chaiHttp);

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

describe('/', () => {
  it('get a response', (done) => {
    chai.request(server)
      .get('/')
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(200);
        done();
      });
  });
});

describe('/user/register', () => {
  it('successfully register a new user', (done) => {
    chai.request(server)
      .post('/user/register')
      .send({
        name: 'TestUser',
        email: 'testuser@example.com',
        password: 'P@55w0rd',
      })
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.have.property('Success');
        res.body.Success.should.equal('User successfully added');
        done();
      });
  });
});

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
