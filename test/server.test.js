const chai = require('chai');
const chaiHttp = require('chai-http');

// eslint-disable-next-line no-unused-vars
const should = chai.should();

const server = require('../server');

chai.use(chaiHttp);

describe('/', () => {
  it('should get a response', (done) => {
    chai.request(server)
      .get('/')
      .end((err, res) => {
        if (err) { done(err); }
        res.should.have.status(200);
        done();
      });
  });
});
