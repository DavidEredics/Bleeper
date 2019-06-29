const restify = require('restify-clients');
const dns = require('dns');
const os = require('os');
const sslChecker = require('ssl-checker');

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
            if (config.openSend === 'true' && !req.body.to.includes('@', 1)) {
              const decoded = jwt.decode(token[1]);
              return decoded.name;
            }
            const decoded = jwt.verify(token[1]);
            return decoded.name;
          }
          if (req.body.from && config.openSend === 'true' && !req.body.to.includes('@', 1)) {
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
          const userAgent = `${'Bleeper/restify'
            + ' ('}${os.arch()}-${os.platform()}; `
            + `v8/${process.versions.v8}; `
            + `OpenSSL/${process.versions.openssl}) `
            + `node/${process.versions.node}`;
          const client = restify.createJsonClient({
            userAgent,
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
          if (req.header('Authorization')) {
            const token = req.header('Authorization').split(' ');
            if (config.openReceive === 'true') {
              const decoded = jwt.decode(token[1]);
              return decoded.name;
            }
            const decoded = jwt.verify(token[1]);
            return decoded.name;
          }
          if (req.body.from && (config.openReceive === 'true' || (config.openReceive === 'valid' && req.body.from.includes('@', 1)))) {
            return req.body.from;
          }
        };
        if (sender()) {
          const from = sender();
          const saveMessage = () => userExists(req.body.to).then((recipientExists) => {
            if (recipientExists) {
              const Message = {
                from,
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
          if (config.openReceive === 'valid' && req.body.from.includes('@', 1)) {
            const nodeVersion = process.version.substr(1).split('.');
            const localServer = () => {
              if ((nodeVersion[0] >= 11 && nodeVersion[1] >= 2) || nodeVersion[0] > 11) {
                return config.fqdn || req.connection.getCertificate().subject.CN
                || req.client.servername;
              }
              return config.fqdn || req.client.servername;
            };
            const senderServer = from.split('@')[1].split(':')[0];
            const addressValid = new Promise(
              addressResolve => dns.lookup(senderServer, { all: true }, (err, addresses) => {
                if (!err) {
                  return addresses.forEach((address) => {
                    if (address.address === req.connection.remoteAddress) {
                      addressResolve(true);
                    }
                  });
                }
                resolve(false);
              }),
            );
            const senderServerPort = from.split('@')[1].split(':')[1];
            const sslValid = sslChecker(senderServer, 'GET', senderServerPort);
            return Promise.all([addressValid, sslValid]).then((valid) => {
              if (req.headers.host !== `${localServer()}:${config.port}` || req.headers['user-agent'].indexOf('Bleeper') === -1 || !valid[0] || !valid[1].valid) {
                resolve({ status: 500, msg: { Error: 'The origin of the message can not be validated' } });
              } else {
                return saveMessage();
              }
            }).catch((error) => {
              console.log(error);
              resolve({ status: 500, msg: { Error: 'The origin of the message can not be validated' } });
            });
          }
          return saveMessage();
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
