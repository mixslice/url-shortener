module.exports = function config() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return {
        loglevel: 'info',
        dbhost: 'mongo'
      };

    case 'staging':
      return {
        loglevel: 'trace',
        dbhost: 'mongo'
      };

    default:
      return {
        loglevel: 'trace',
        dbhost: 'mongo.docker'
      };
  }
};
