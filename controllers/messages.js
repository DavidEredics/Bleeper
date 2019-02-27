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

exports.readMessages = req => new Promise((resolve, reject) => {
  const limit = Number(req.query.limit) || 0;
  return database.DB().collection('Messages').find({ to: req.user.name })
    .sort({ Date: 1 })
    .limit(limit)
    .toArray()
    .then((messages) => {
      if (messages) {
        if (messages.length === 0) {
          resolve({ status: 204 });
        }
        resolve({ status: 200, msg: messages });
      }
      resolve({ status: 500, msg: { Error: 'Reading the messages failed' } });
    })
    .catch((err) => {
      reject(err);
    });
});
