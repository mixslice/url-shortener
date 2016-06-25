module.exports = function config() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return {
        project: 'urlshortener',
        loglevel: 'info',
        dbhost: 'mongo',
        host: process.env.VIRTUAL_HOST
      };

    case 'staging':
      return {
        project: 'urlshortener_staging',
        loglevel: 'trace',
        dbhost: 'mongo',
        host: process.env.VIRTUAL_HOST
      };

    default:
      return {
        project: 'urlshortener_staging',
        loglevel: 'trace',
        dbhost: 'localhost:27017',
        host: 'localhost:3000'
      };
  }
};
