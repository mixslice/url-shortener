import log from 'loglevel';
import express from 'express';
import morgan from 'morgan';
import raven from 'raven';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import useragent from 'express-useragent';
import shortid from 'shortid';
import url from 'url';
import Lighthouse from '@mh/lighthouse-js';
import Config from './config';
const config = new Config();

/**
 * global settings
 */
log.setLevel(config.loglevel);
const ravenClient = new raven.Client('http://0d1344add2e04b718d29c8ea23edd3b3:5d4a4798d32543d0b8d8a13b03dc9962@sentry.digitwalk.com/9');
ravenClient.patchGlobal();
const newError = (err) => ravenClient.captureException(new Error(JSON.stringify(err)));

/*
 * Lighthouse Tracking
 */
const lighthouse = new Lighthouse(config.project);
// lighthouse.setConfig({ debug: true });

/**
 * database
 */
mongoose.connect(`mongodb://${config.dbhost}/urlshorten`);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  log.info('connected');
});

const recordSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  url: String,
  created: { type: Date, default: Date.now }
});

const visitSchema = mongoose.Schema({
  _shortId: String,
  _ua: String,
  browser: String,
  platform: String,
  version: String,
  os: String,
  ip: String,
  created: { type: Date, default: Date.now }
});

/**
 * init app
 */
const app = express();
app.use(morgan('combined'));
app.use(useragent.express());

// parse application/json
app.use(bodyParser.json());

/**
 * provide root route
 */
app.get('/', (req, res) => {
  ravenClient.captureException(new Error(JSON.stringify({ test: 'test' })));
  res.json({
    message: 'hello'
  });
});

/**
 * GET /track api
 */
app.post('/shorten', (req, res) => {
  if (!req.body || !req.body.url) {
    newError({ error: 'url not found', status: 422 });
    res.status(400).json({ error: 'url not found' });
    return;
  }

  // process url
  const originalUrl = req.body.url;
  const parsedUrl = url.parse(originalUrl);

  /**
   * only support http(s) yet
   */
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    newError({ error: 'only http and https are supported', status: 422 });
    res.status(422).json({ error: 'only http and https are supported' });
    return;
  }

  /**
   * already shortened url
   */
  if (parsedUrl.host === config.host) {
    newError({ error: 'invalid url', status: 422 });
    res.status(422).json({ error: 'invalid url' });
    return;
  }

  const Record = mongoose.model('Record', recordSchema);
  const record = new Record({ url: originalUrl });
  record.save();

  res.json(record);
});

app.get(/^\/([0-9A-Za-z\-_]{7,14})$/, (req, res) => {
  // redirect to longurl
  const id = req.params[0];

  const Record = mongoose.model('Record', recordSchema);
  Record.findOne({ _id: id }, (err, obj) => {
    if (err) {
      log.error(err);
      newError({ error: err, status: 422 });
      res.status(500).json({
        error: err
      });
    } else if (!obj) {
      newError({ error: 'invalid short link', status: 422 });
      res.status(400).json({
        error: 'invalid short link'
      });
    } else {
      // store visit info
      const ua = req.useragent;
      const browser = ua.browser;
      const platform = ua.platform;
      const version = ua.version;
      const os = ua.os;
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      // store data
      const Visit = mongoose.model('Visit', visitSchema);
      const visitData = {
        _shortId: id,
        ip,
        browser,
        platform,
        version,
        os,
        _ua: ua.source
      };
      const visit = new Visit(visitData);
      visit.save();
      ravenClient.setUserContext({
        visits: visitData
      });
      // Lighthouse track
      lighthouse.track('redirect', visitData);

      res.redirect(obj.url);
    }
  });
});


/**
 * start app
 */
app.listen(3000, () => {
  log.info('Example app listening on http://localhost:3000');
});
