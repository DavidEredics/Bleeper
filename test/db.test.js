const chai = require('chai');
// eslint-disable-next-line no-unused-vars
const should = chai.should();

const database = require('../database');

function checkIndex(collectionName, indexName) {
  return database.DB().collection(collectionName).indexInformation().then((result) => {
    for (let i = 0; i < Object.values(result).length; i += 1) {
      for (let j = 0; j < Object.values(result).length; j += 1) {
        if (Object.values(result)[i][j]) {
          const index = Object.values(result)[i][j].indexOf(indexName);
          if (index >= 0) {
            return true;
          }
        }
      }
    }
    return false;
  })
    .catch((err) => {
      console.error(err);
      return false;
    });
}

describe('db tests', () => {
  describe('indexes properly set', () => {
    it('Users collection has name as unique index', (done) => {
      checkIndex('Users', 'name').then((result) => {
        result.should.be.true;
        done();
      }).catch((err) => {
        done(err);
      });
    });
  });
});
