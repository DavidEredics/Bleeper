const messages = require('../controllers/messages');

module.exports = (server) => {
  server.post('/message/send', (req, res, next) => {
    messages.sendMessage(req).then((result) => {
      res.status(result.status);
      res.send(result.msg);
    }).catch((err) => {
      console.error(err);
      res.status(500);
      res.send({ Error: 'Sending the message failed' });
    });
    next();
  });
};
