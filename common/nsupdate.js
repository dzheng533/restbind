var spawn = require('child_process').spawn;

run_nsupdate = function(key, script, log, callback) {
    nsupdate = spawn('nsupdate', ['-k', key]);

    nsupdate.on('error', function(error) {
        log.debug({for: 'nsupdate', type: 'error'}, error.toString());
    });

    nsupdate.stderr.on('data', function(data) {
        log.debug({for: 'nsupdate', type: 'stderr'}, data.toString());
    });

    nsupdate.stdin.write(script);

    nsupdate.stdout.on('data', function(data) {
        log.debug({for: 'nsupdate', type: 'stdout'}, data.toString());
    });

    nsupdate.on('close', callback);
};

exports.update = function(options, callback) {
    var script = "server " + options.server + "\n" +
          "zone " + options.zone + "\n" +
          "update delete " + options.hostname + " A\n" +
          "update add " + options.hostname + " " + options.ttl + " A " + options.ip + "\n" +
          "send\nanswer\nquit\n";

    run_nsupdate(options.key, script, options.log, callback);
};

exports.delete = function(options, callback) {
    var script = "server " + options.server + "\n" +
          "zone " + options.zone + "\n" +
          "update delete " + options.hostname + " A\n" +
          "send\nanswer\nquit\n";

    run_nsupdate(options.key, script, options.log, callback);
};
