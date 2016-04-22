module.exports = function config() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return {
        loglevel: 'info',
        dbhost: 'mongo',
        host: process.env.VIRTUAL_HOST
      };

    case 'staging':
      return {
        loglevel: 'trace',
        dbhost: 'mongo',
        host: process.env.VIRTUAL_HOST
      };

    default:
      return {
        loglevel: 'trace',
        dbhost: 'mongo.docker',
        host: 'localhost:3000'
      };
  }
};
