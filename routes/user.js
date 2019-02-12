const users = require('../controllers/users');

module.exports = (server) => {
  server.post('/user/register', (req, res, next) => {
    users.addUser(req).then((result) => {
      res.status(result.status);
      res.send(result.msg);
    }).catch((err) => {
      console.error(err);
      res.status(500);
      res.send({ Error: 'User registration unsuccessful' });
    });
    next();
  });
};
