var restify = require('restify');
var nconf = require('nconf');
var nsupdate = require('../common/nsupdate');

module.exports = function (server) {
  server.post('/dns', function (req, res, next) {

      if (! req.body.hostname) {
          return next(new restify.MissingParameterError("Parameter 'hostname' is missing"));
      }

      if (! req.body.ip) {
          return next(new restify.MissingParameterError("Parameter 'ip' is missing"));
      }

      var dns_server = nconf.get('dns_server');
      var dns_zone = nconf.get('dns_zone');
      var dns_key = nconf.get('dns_key');
      var dns_ttl = req.body.ttl || nconf.get('dns_ttl');
      var dns_valid_hosts = nconf.get('dns_valid_hosts');

      if (dns_valid_hosts.indexOf(req.body.hostname) == -1) {
          return next(new restify.InvalidArgumentError());
      }

      nsupdate.update({server: dns_server, zone: dns_zone, hostname: req.body.hostname, ip: req.body.ip, ttl: dns_ttl, key: dns_key, log: req.log}, function(code) {
        if (code == 0)
            res.send(200, {hostname: req.body.hostname, ip: req.body.ip, ttl: dns_ttl, status: "DNS updated"});
        else
            res.send(500, {hostname: req.body.hostname, ip: req.body.ip, ttl: dns_ttl, status: "Error during DNS update"});

        return next();
      });
    });

  server.del('/dns', function (req, res, next) {
      if (! req.body.hostname)
          return next(new restify.MissingParameterError("Parameter 'hostname' is missing"));

      var dns_server = nconf.get('dns_server');
      var dns_zone = nconf.get('dns_zone');
      var dns_key = nconf.get('dns_key');
      var dns_valid_hosts = nconf.get('dns_valid_hosts');

      if (dns_valid_hosts.indexOf(req.body.hostname) == -1) {
          return next(new restify.InvalidArgumentError());
      }

      nsupdate.delete({server: dns_server, zone: dns_zone, hostname: req.body.hostname, key: dns_key, log: req.log}, function(code) {
        if (code == 0)
            res.send(200, {hostname: req.body.hostname, status: "DNS deleted"});
        else
            res.send(500, {hostname: req.body.hostname, status: "Error during DNS update"});

        return next();
      });
    });
};
