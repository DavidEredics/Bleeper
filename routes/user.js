const users = require('../controllers/users');

module.exports = (server) => {
  server.post('/user/register', (req, res, next) => {
    users.addUser(req).then((result) => {
      res.send(result);
    }).catch((err) => {
      console.error(err);
      res.send({ Error: 'User registration unsuccessful' });
    });
    next();
  });
};
