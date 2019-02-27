const chai = require('chai');
const chaiHttp = require('chai-http');

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const server = require('../server');

chai.use(chaiHttp);

describe('/message/send', () => {
  it('Success: Message successfully sent', (done) => {
    chai.request(server)
      .post('/message/send')
      .set('Authorization', `Bearer ${global.jwtToken}`)
      .send({
        to: 'TestUser',
        text: 'text',
      })
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.have.property('Success');
        res.body.Success.should.equal('Message successfully sent');
        done();
      });
  });
  it('Error: The recipient user does not exists', (done) => {
    chai.request(server)
      .post('/message/send')
      .set('Authorization', `Bearer ${global.jwtToken}`)
      .send({
        to: 'testuser2',
        text: 'text',
      })
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.have.property('Error');
        res.body.Error.should.equal('The recipient user does not exists');
        done();
      });
  });
  it('Error: Missing property', (done) => {
    chai.request(server)
      .post('/message/send')
      .set('Authorization', `Bearer ${global.jwtToken}`)
      .send({
        to: 'TestUser',
      })
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.have.property('Error');
        res.body.Error.should.equal('Missing property');
        done();
      });
  });
  it('Error: Request body is empty', (done) => {
    chai.request(server)
      .post('/message/send')
      .set('Authorization', `Bearer ${global.jwtToken}`)
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.have.property('Error');
        res.body.Error.should.equal('Request body is empty');
        done();
      });
  });
  it('Error: Invalid token', (done) => {
    chai.request(server)
      .post('/message/send')
      .send({
        to: 'TestUser',
        text: 'text',
      })
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(401);
        res.should.be.json;
        res.body.should.have.property('Error');
        res.body.Error.should.equal('Invalid token');
        done();
      });
  });
});

describe('/message/read', () => {
  it('successfully read messages', (done) => {
    chai.request(server)
      .get('/message/read')
      .set('Authorization', `Bearer ${global.jwtToken}`)
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(200);
        res.should.be.json;
        res.body[0].should.have.property('_id');
        res.body[0].should.have.property('from');
        res.body[0].should.have.property('to');
        res.body[0].should.have.property('text');
        res.body[0].should.have.property('Date');
        done();
      });
  });
  it('Error: Invalid token', (done) => {
    chai.request(server)
      .get('/message/read')
      .send({
        to: 'TestUser',
        text: 'text',
      })
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(401);
        res.should.be.json;
        res.body.should.have.property('Error');
        res.body.Error.should.equal('Invalid token');
        done();
      });
  });
});
