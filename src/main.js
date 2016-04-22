import log from 'loglevel';
import express from 'express';
import morgan from 'morgan';
import schema from 'js-schema';
import influx from 'influx';
import useragent from 'express-useragent';
import Config from './config';
const config = new Config();

/**
 * global settings
 */
log.setLevel(config.loglevel);

/**
 * init database
 */
const databaseName = 'urlshortener';

const client = influx({
  host: config.dbhost,
  port: 8086, // optional, default 8086
  username: 'root',
  password: 'root',
  database: databaseName
});

client.createDatabase(databaseName, (err) => {
  if (!err) {
    log.info(`success created ${databaseName}`);
  } else if (err.code === 'ECONNREFUSED') {
    log.error('cannot connect to database');
  } else {
    log.warn(err.message);
  }
});


/**
 * init app
 */
const app = express();
app.use(morgan('combined'));
app.use(useragent.express());


const shortenSchema = schema({
  q: String
});


/**
 * decode base64 and parse JSON
 */
app.use('/shorten', (req, res, next) => {
  // parse json
  const requestData = req.requestData;
  if (/^[\],:{}\s]*$/.test(requestData.replace(/\\["\\\/bfnrtu]/g, '@').
  replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
  replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
    // the json is ok
    req.requestJSON = JSON.parse(requestData);
    next();
  } else {
    // the json is not ok
    res.status(400).json({ error: 'not valid json' });
  }
}, (req, res, next) => {
  // validate schema
  const requestJSON = req.requestJSON;
  if (shortenSchema(requestJSON)) {
    log.debug(requestJSON);
    next();
  } else {
    const errors = shortenSchema.errors(requestJSON);
    res.status(422).json({ error: errors });
  }
});

/**
 * provide root route
 */
app.get('/', (req, res) => {
  const hosts = client.getHostsAvailable();
  res.json({
    message: 'hello',
    version: process.env.npm_package_version,
    database: hosts
  });
});

/**
 * GET /track api
 */
app.post('/shorten', (req, res) => {
  // TODO
});

app.get('/:shortId', (req, res) => {
  // TODO
  const longUrl = '';
  res.redirect(longUrl);
});


/**
 * start app
 */
app.listen(3000, () => {
  log.info('Example app listening on http://localhost:3000');
});
