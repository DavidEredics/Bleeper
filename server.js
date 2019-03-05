const restify = require('restify');
const fs = require('fs');
const rjwt = require('restify-jwt-community');

const config = require('./config');
const database = require('./database');
const jwtSecret = require('./jwt').secret;

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
      name: 'Bleeper',
    };
    if (config.ENV === 'development') {
      http2ServerOptions.name = 'Bleeper-dev';
    }
    return http2ServerOptions;
  }
  return { name: 'Bleeper-test' };
};

const server = restify.createServer(serverOptions());

// Require authentication for routes with exceptions
const secretCallback = (req, payload, done) => {
  done(null, jwtSecret());
};
const unlessPath = [
  '/',
  '/user/auth',
];
if (config.ENV === 'test' || config.openReg === 'true') {
  unlessPath.push('/user/register');
}
if (config.openReceive === 'true') {
  unlessPath.push('/message/send');
}
server.use(rjwt({ secret: secretCallback }).unless({ path: unlessPath }));

// Handling authentication error
server.use((err, req, res, next) => {
  if (err.name === 'InvalidCredentialsError') {
    res.send(401, { Error: 'Invalid token' });
  }
  return next(err);
});

server.use(restify.plugins.bodyParser({
  rejectUnknown: true,
}));

server.use(restify.plugins.queryParser({ mapParams: false }));

server.listen(config.PORT, config.HOST, () => {
  console.log('%s listening at %s', server.name, server.url);

  if (config.ENV !== 'test') {
    database.connect((err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      if (database.DB().serverConfig.isConnected()) {
        console.log('Connected to db');
        require('./routes/user')(server);
        require('./routes/message')(server);
      }
    });
  } else {
    require('./routes/user')(server);
    require('./routes/message')(server);
  }
});

server.get('/', (req, res, next) => {
  res.send('');
  next();
});

module.exports = server;
