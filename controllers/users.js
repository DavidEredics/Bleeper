const bcrypt = require('bcryptjs');
const database = require('../database');

// checks if a User exists with the given Name
function nameCheck(userName) {
  return database.DB().collection('Users').countDocuments({ name: userName }, { limit: 1 }).then((countResult) => {
    if (countResult === 0) {
      return false;
    }
    return true;
  });
}

exports.addUser = req => new Promise((resolve, reject) => {
  if (req.body) {
    if (req.body.name && req.body.email && req.body.password) {
      return nameCheck(req.body.name).then((nameUsed) => {
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
                      resolve({ Success: 'User successfully added' });
                    }
                    resolve({ Error: 'User registration unsuccessful' });
                  })
                    .catch((err) => {
                      reject(err);
                    });
                }
                reject(bcryptErr);
              });
            }
            resolve({ Error: 'User registration unsuccessful' });
          })
            .catch((err) => {
              reject(err);
            });
        }
        resolve({ Error: 'A user already exists with this name' });
      });
    }
    resolve({ Error: 'Missing property' });
  }
  resolve({ Error: 'Request body is empty' });
});