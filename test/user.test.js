const chai = require('chai');
const chaiHttp = require('chai-http');

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const server = require('../server');

chai.use(chaiHttp);

describe('/user/register', () => {
  it('Success: User successfully added', (done) => {
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
  it('Error: A user already exists with this name', (done) => {
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
        res.body.should.have.property('Error');
        res.body.Error.should.equal('A user already exists with this name');
        done();
      });
  });
  it('Error: Missing property', (done) => {
    chai.request(server)
      .post('/user/register')
      .send({
        name: 'TestUser',
        email: 'testuser@example.com',
      })
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.have.property('Error');
        res.body.Error.should.equal('Missing property');
        done();
      });
  });
  it('Error: Request body is empty', (done) => {
    chai.request(server)
      .post('/user/register')
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.have.property('Error');
        res.body.Error.should.equal('Request body is empty');
        done();
      });
  });
});