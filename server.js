const restify = require('restify');
const fs = require('fs');
const os = require('os');
const rjwt = require('restify-jwt-community');
const selfsigned = require('selfsigned');
const corsMiddleware = require('restify-cors-middleware');

const config = require('./config');
const database = require('./database');
const jwtSecret = require('./jwt').secret;

let url = `https://${config.host}:${config.port}`;
if (config.noHTTPS === 'true') {
  url = `http://${config.host}:${config.port}`;
}
const ipv6Regexp = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;
if (ipv6Regexp.test(config.host) && config.noHTTPS !== 'true') {
  url = `https://[${config.host}]:${config.port}`;
}
if (ipv6Regexp.test(config.host) && config.noHTTPS === 'true') {
  url = `http://[${config.host}]:${config.port}`;
}
if (config.host === '' && config.noHTTPS !== 'true') {
  url = `https://[::]:${config.port}`;
}
if (config.host === '' && config.noHTTPS === 'true') {
  url = `http://[::]:${config.port}`;
}

const allowHTTP1 = () => {
  if (config.allowHTTP1 === 'true') {
    return true;
  }
  return false;
};

const serverOptions = () => {
  if (config.noHTTPS === 'true') {
    const http2ServerOptions = { name: config.name };
    return http2ServerOptions;
  }
  if (config.certPath !== undefined && config.cert !== undefined && config.key !== undefined) {
    const http2ServerOptions = {
      http2: {
        cert: fs.readFileSync(config.certPath + config.cert),
        key: fs.readFileSync(config.certPath + config.key),
        allowHTTP1: allowHTTP1(),
      },
    };
    if (config.ca) {
      http2ServerOptions.http2.ca = fs.readFileSync(config.certPath + config.ca);
    }
    http2ServerOptions.name = config.name;
    return http2ServerOptions;
  }

  const cn = config.fqdn || config.name;
  const san = () => {
    if (cn.includes('.', 1)) {
      return [{ type: 2, value: cn }];
    }
    const ipAddresses = [];
    const nIf = os.networkInterfaces();
    Object.keys(nIf).forEach((ifName) => {
      nIf[ifName].forEach((iFace) => {
        if (iFace.internal === false
          && iFace.netmask !== 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' && !iFace.address.startsWith('fe80')
          && !iFace.address.startsWith('169') && !iFace.address.startsWith('127')) {
          ipAddresses.push({ type: 7, ip: iFace.address });
        }
      });
    });
    return ipAddresses;
  };
  const certExpiration = () => {
    if (config.env === 'test') {
      return 1;
    }
    return 30;
  };
  const pems = selfsigned.generate([{ name: 'commonName', value: cn }], {
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [{ name: 'subjectAltName', altNames: san() }],
    days: certExpiration(),
  });
  const http2ServerOptions = {
    http2: {
      cert: pems.cert,
      key: pems.private,
      allowHTTP1: allowHTTP1(),
    },
    name: config.name,
  };
  return http2ServerOptions;
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
if (config.openReg === 'true') {
  unlessPath.push('/user/register');
}
if (config.openReceive === 'true' || config.openReceive === 'valid') {
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

// CORS
if (config.corsOrigin !== undefined && config.corsOrigin !== '') {
  const corsOrigin = config.corsOrigin.split(', ');

  const cors = corsMiddleware({
    origins: corsOrigin,
    allowHeaders: ['Authorization'],
    exposeHeaders: ['Authorization'],
  });

  server.pre(cors.preflight);
  server.use(cors.actual);
}

server.listen(config.port, config.host, () => {
  console.log('%s listening at %s', server.name, url);

  if (config.env !== 'test') {
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

const close = () => {
  server.close(() => {
    console.log('Server stopped');
  });
};

module.exports = { url, close };
