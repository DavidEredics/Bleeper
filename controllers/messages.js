const database = require('../database');
const { userExists } = require('./users');

exports.sendMessage = req => new Promise((resolve, reject) => {
  if (req.body) {
    if (req.body.to && req.body.text) {
      return userExists(req.body.to).then((recipientExists) => {
        if (recipientExists) {
          const Message = {
            from: req.user.name,
            to: req.body.to,
            text: req.body.text,
            Date: new Date(Date.now()).toISOString(),
          };
          return database.DB().collection('Messages').insertOne(Message).then((insertResult) => {
            if (insertResult) {
              resolve({ status: 201, msg: { Success: 'Message successfully sent' } });
            }
            resolve({ status: 500, msg: { Error: 'Sending the message failed' } });
          })
            .catch((err) => {
              reject(err);
            });
        }
        resolve({ status: 400, msg: { Error: 'The recipient user does not exists' } });
      });
    }
    resolve({ status: 400, msg: { Error: 'Missing property' } });
  }
  resolve({ status: 400, msg: { Error: 'Request body is empty' } });
});
