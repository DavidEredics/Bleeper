const bcrypt = require('bcryptjs');
const jwt = require('../jwt');
const database = require('../database');

function createIndexes() {
  database.DB().collection('Users').createIndex(
    { name: 1 },
    { unique: true },
  ).catch((err) => {
    console.error(err);
  });
}

// checks if a User exists with the given Name
exports.userExists = (userName) => database.DB().collection('Users').countDocuments({ name: userName }, { limit: 1 }).then((countResult) => {
  if (countResult === 0) {
    return false;
  }
  return true;
});

exports.addUser = (req) => new Promise((resolve, reject) => {
  createIndexes();
  if (req.body) {
    if (req.body.name && req.body.email && req.body.password) {
      return this.userExists(req.body.name).then((nameUsed) => {
        if (nameUsed === false) {
          const User = {
            name: req.body.name,
            email: req.body.email,
            registrationDate: new Date(Date.now()).toISOString(),
          };
          return database.DB().collection('Users').insertOne(User).then((insertResult) => {
            if (insertResult) {
              const id = insertResult.insertedId;
              return bcrypt.hash(req.body.password, 10, (bcryptErr, hash) => {
                if (!bcryptErr) {
                  return database.DB().collection('UserAuth').insertOne({ _id: id, password: hash }).then((result) => {
                    if (result) {
                      resolve({ status: 201, msg: { Success: 'User successfully added' } });
                    }
                    resolve({ status: 500, msg: { Error: 'User registration unsuccessful' } });
                  })
                    .catch((err) => {
                      reject(err);
                    });
                }
                reject(bcryptErr);
              });
            }
            resolve({ status: 500, msg: { Error: 'User registration unsuccessful' } });
          })
            .catch((err) => {
              reject(err);
            });
        }
        resolve({ status: 409, msg: { Error: 'A user already exists with this name' } });
      });
    }
    resolve({ status: 400, msg: { Error: 'Missing property' } });
  }
  resolve({ status: 400, msg: { Error: 'Request body is empty' } });
});

exports.authUser = (req) => new Promise((resolve, reject) => {
  if (req.body) {
    if (req.body.name && req.body.password) {
      return this.userExists(req.body.name).then((nameExists) => {
        if (nameExists === true) {
          const { name, password } = req.body;
          return database.DB().collection('Users').find({ name }).project({ _id: 1 })
            .toArray()
            .then((dbUserId) => {
              if (dbUserId && dbUserId.length === 1) {
                const { _id } = dbUserId[0];
                return database.DB().collection('UserAuth').find({ _id }).project({ _id: 0, password: 1 })
                  .toArray()
                  .then((dbUserPassword) => {
                    if (dbUserPassword && dbUserPassword.length === 1) {
                      const dbPassword = dbUserPassword[0].password;
                      return bcrypt.compare(password, dbPassword).then((res) => {
                        if (res) {
                          // send jwt token
                          const authToken = jwt.sign(name);
                          resolve({ status: 200, msg: { authToken } });
                        }
                        resolve({ status: 401, msg: { Error: 'username or password incorrect' } });
                      });
                    }
                    resolve({ status: 500, msg: { Error: 'User authentication unsuccessful' } });
                  })
                  .catch((err) => {
                    reject(err);
                  });
              }
              resolve({ status: 500, msg: { Error: 'User authentication unsuccessful' } });
            })
            .catch((err) => {
              reject(err);
            });
        }
        resolve({ status: 401, msg: { Error: 'username or password incorrect' } });
      });
    }
    resolve({ status: 400, msg: { Error: 'Missing property' } });
  }
  resolve({ status: 400, msg: { Error: 'Request body is empty' } });
});
