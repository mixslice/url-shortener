import log from 'loglevel';
import express from 'express';
import morgan from 'morgan';
import schema from 'js-schema';
import influx from 'influx';
import useragent from 'express-useragent';
import pick from 'lodash.pick';
import Config from './config';
const config = new Config();

/**
 * global settings
 */
log.setLevel(config.loglevel);

/**
 * init database
 */
const databaseName = 'lighthouse';

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


const propertySchema = schema({
  project_token: String,
  '?time': Number,
  '*': [String, Number, Boolean]
});

const eventSchema = schema({
  event: String,
  properties: propertySchema
});


/**
 * decode base64 and parse JSON
 */
app.use('/track', (req, res, next) => {
  // decode base64
  const rawData = req.query.data;
  const buf = new Buffer(rawData, 'base64');
  req.requestData = buf.toString();
  next();
}, (req, res, next) => {
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
  if (eventSchema(requestJSON)) {
    log.debug(requestJSON);
    next();
  } else {
    const errors = eventSchema.errors(requestJSON);
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
app.get('/track', (req, res) => {
  const event = req.requestJSON.event;
  const properties = req.requestJSON.properties;
  const ua = req.useragent;
  const projectToken = properties.project_token;

  const filteredKeys = Object.keys(properties).filter((key) => {
    const value = properties[key];
    if (value === '' || key in ['project_token']) {
      return false;
    }
    return true;
  });
  const filteredProperties = pick(properties, filteredKeys);

  const values = Object.assign(
    {},
    filteredProperties,
    { ua: ua.source }
  );
  log.debug(`values: ${values}`);

  const tags = {
    event_name: event,
    browser: ua.browser,
    platform: ua.platform,
    version: ua.version,
    os: ua.os
  };

  const done = (err) => {
    if (err) {
      log.error(err.stack);
      res.status(400).json(JSON.parse(err.message));
    } else {
      res.json({});
    }
  };

  client.writePoint(projectToken, values, tags, done);
});


/**
 * start app
 */
app.listen(3000, () => {
  log.info('Example app listening on http://localhost:3000');
});
