const restify = require('restify');
const fs = require('fs');

const config = require('./config');

const allowHTTP1 = () => {
  if (config.allowHTTP1 === 'true') {
    return true;
  }
  return false;
};

const serverOptions = () => {
  if (config.ENV !== 'test') {
    const http2ServerOptions = {
      http2: {
        cert: fs.readFileSync(config.cert_path + config.cert),
        key: fs.readFileSync(config.cert_path + config.key),
        allowHTTP1: allowHTTP1(),
      },
    };
    return http2ServerOptions;
  }
  return {};
};

const server = restify.createServer(serverOptions());

server.listen(config.PORT, config.HOST, () => {
  console.log('%s listening at %s', server.name, server.url);
});

server.get('/', (req, res, next) => {
  res.send('');
  next();
});
