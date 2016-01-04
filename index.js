/*jslint node: true, indent: 2 */
'use strict';
var restify, bunyan, routes, log, server, nconf, fs;

restify = require('restify');
bunyan  = require('bunyan');
routes  = require('./routes/');
nconf   = require('nconf');
fs      = require('fs');

nconf.argv().env();

var node_env = nconf.get('NODE_ENV') || 'development';

if (node_env == 'development')
    nconf.file('./config/dev.json');
else
    nconf.file('./config/prod.json');

var log_level = nconf.get('LOG_LEVEL') || 'info',
log = bunyan.createLogger({
  name        : 'restbind',
  streams     : [
    {
        level: log_level,
        stream: process.stdout
    },
    {
        level: log_level,
        path: 'restbind.log'
    }
  ],
  serializers : bunyan.stdSerializers
});

if (! nconf.get('api-key')) {
    log.fatal("api-key missing from configuration");
    return;
}

if (node_env == 'development') {
    log.warn('Running in dev env');
}

server = restify.createServer({
  name : 'restbind',
  log  : log,
  formatters : {
    'application/json' : function (req, res, body, cb) {
      res.setHeader('Cache-Control', 'must-revalidate');

      // Does the client *explicitly* accepts application/json?
      var sendPlainText = (req.header('Accept').split(/, */).indexOf('application/json') === -1);

      // Send as plain text
      if (sendPlainText) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }

      // Send as JSON
      if (!sendPlainText) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }

      return cb(null, JSON.stringify(body));
    }
  },
  ca: fs.readFileSync(nconf.get('tls_ca')),
  cert: fs.readFileSync(nconf.get('tls_cert')),
  key: fs.readFileSync(nconf.get('tls_key'))
});

server.pre(function (req, res, next) {
    log.debug({headers: req.headers}, 'Checking security header');

    if (! req.headers['x-api-key']) {
        next(new restify.NotAuthorizedError("You're not authorized to use this API"));
        return;
    }

    if (req.headers['x-api-key'] != nconf.get('api-key')) {
        next(new restify.NotAuthorizedError("You're not authorized to use this API"));
        return;
    }

    next();
});

server.use(restify.bodyParser({ mapParams: false }));
server.use(restify.queryParser());
server.use(restify.gzipResponse());
server.pre(restify.pre.sanitizePath());

/*jslint unparam:true*/
// Default error handler. Personalize according to your needs.
server.on('uncaughtException', function (req, res, err) {
  log.error(err, "Unexpected error");
  res.send(500, {status: "Unexpected error"});
});
/*jslint unparam:false*/

server.on('after', restify.auditLogger({ log: log }));
routes(server);

var bind_ip = nconf.get('bind_ip') || '::';
var bind_port = nconf.get('bind_port') || 8080;

server.listen(bind_port, bind_ip, function () {
  log.info('%s listening at %s', server.name, server.url);
});

