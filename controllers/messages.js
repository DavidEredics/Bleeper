const restify = require('restify-clients');

const jwt = require('../jwt');
const database = require('../database');
const { userExists } = require('./users');
const config = require('../config');

exports.sendMessage = req => new Promise((resolve, reject) => {
  if (req.body) {
    if (req.body.to && req.body.text) {
      if (req.body.to.includes('@', 1)) {
        const sender = () => {
          if (typeof req.user !== 'undefined') {
            return req.user.name;
          }
          if (req.header('Authorization')) {
            const token = req.header('Authorization').split(' ');
            if (config.openSend === 'true') {
              const decoded = jwt.decode(token[1]);
              return decoded.name;
            }
            const decoded = jwt.verify(token[1]);
            return decoded.name;
          }
          if (req.body.from && config.openSend === 'true') {
            return req.body.from;
          }
        };
        if (sender()) {
          const remoteServer = `https://${req.body.to.split('@')[1]}`;
          const remoteUser = req.body.to.split('@')[0];
          const nodeVersion = process.version.substr(1).split('.');
          const localServer = () => {
            if ((nodeVersion[0] >= 11 && nodeVersion[1] >= 2) || nodeVersion[0] > 11) {
              return config.fqdn || req.connection.getCertificate().subject.CN
              || req.client.servername;
            }
            return config.fqdn || req.client.servername;
          };
          const port = () => { if (config.port !== 443) { return `:${config.port}`; } return ''; };
          const Message = {
            from: `${sender()}@${localServer()}${port()}`,
            to: remoteUser,
            text: req.body.text,
            Date: new Date(Date.now()).toISOString(),
          };
          const allowSelfSignedCert = () => {
            if (config.openSend === 'valid') {
              return true;
            }
            return false;
          };
          const client = restify.createJsonClient({
            url: remoteServer,
            connectTimeout: 1000,
            rejectUnauthorized: allowSelfSignedCert(),
          });
          return client.post('/message/send', Message, (err, request, res, obj) => {
            if (err) {
              if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ConnectTimeout') {
                resolve({ status: 504, msg: { Error: 'No response from the recipient server' } });
              }
              if (err.message !== undefined) {
                if (err.message === 'self signed certificate') {
                  resolve({ status: 502, msg: { Error: 'The recipient server has self signed certificate' } });
                }
                if (err.body !== undefined && Object.prototype.hasOwnProperty.call(err.body, 'Error')) {
                  if (err.body.Error === 'The recipient user does not exists') {
                    resolve({ status: 502, msg: { Error: 'The recipient user does not exists on the recipient server' } });
                  }
                }
              }
              reject(err);
            } else if (res !== undefined && res.statusCode === 201 && Object.prototype.hasOwnProperty.call(obj, 'Success')) {
              resolve({ status: 201, msg: { Success: 'Message successfully sent' } });
            }
            resolve({ status: 500, msg: { Error: 'Sending the message failed' } });
          });
        }
        resolve({ status: 400, msg: { Error: 'The sender is unidentifiable' } });
      } else {
        const sender = () => {
          if (typeof req.user !== 'undefined') {
            return req.user.name;
          }
          if (config.openReceive === 'true') {
            if (req.header('Authorization')) {
              const token = req.header('Authorization').split(' ');
              const decoded = jwt.decode(token[1]);
              return decoded.name;
            }
            if (req.body.from) {
              return req.body.from;
            }
          }
        };
        if (sender()) {
          return userExists(req.body.to).then((recipientExists) => {
            if (recipientExists) {
              const Message = {
                from: sender(),
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
        resolve({ status: 400, msg: { Error: 'The sender is unidentifiable' } });
      }
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
