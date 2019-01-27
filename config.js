module.exports = {
  ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8443,
  HOST: process.env.HOST || '::1',
  cert_path: process.env.cert_path || '../cert/',
  cert: process.env.cert || 'cert.pem',
  key: process.env.key || 'key.pem',
  allowHTTP1: process.env.allowHTTP1 || 'true',
};
