module.exports = function config() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return {
        loglevel: 'info',
        dbhost: 'influxdb'
      };

    case 'staging':
      return {
        loglevel: 'trace',
        dbhost: 'influxdb'
      };

    default:
      return {
        loglevel: 'trace',
        dbhost: 'influxdb.docker'
      };
  }
};
