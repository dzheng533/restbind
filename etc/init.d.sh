#!/bin/bash
#
# description: restbind
# processname: node
# pidfile: /var/run/restbind.pid
# logfile: /var/log/restbind.log
#
# Based on https://gist.github.com/jinze/3748766
#
# To use it as service on Ubuntu:
# sudo cp init.d.sh /etc/init.d/restbind
# sudo chmod a+x /etc/init.d/restbind
# sudo update-rc.d restbind defaults
#
# Then use commands:
# service restbind <command (start|stop|etc)>

NAME=restbind                            # Unique name for the application
SOURCE_DIR=/home/restbind                # Location of the application source
COMMAND=node                             # Command to run
SOURCE_NAME=index.js                     # Name os the applcation entry point script
USER=user                                # User for process running

pidfile=/var/run/$NAME.pid
logfile=/var/log/$NAME.log
forever=forever

start() {
    export NODE_ENV=production
    export LOG_LEVEL=info
    echo "Starting $NAME node instance : "

    touch $logfile
    chown $USER $logfile

    touch $pidfile
    chown $USER $pidfile

    sudo -E $forever start --pidFile $pidfile -l $logfile -a --sourceDir $SOURCE_DIR --workingDir $SOURCE_DIR -c $COMMAND $SOURCE_NAME

    RETVAL=$?
}

restart() {
    echo -n "Restarting $NAME node instance : "
    sudo $forever restart $SOURCE_NAME
    RETVAL=$?
}

status() {
    echo "Status for $NAME:"
    sudo $forever list
    RETVAL=$?
}

stop() {
    echo -n "Shutting down $NAME node instance : "
    sudo $forever stop $SOURCE_DIR/$SOURCE_NAME
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    restart)
        restart
        ;;
    *)
        echo "Usage:  {start|stop|status|restart}"
        exit 1
        ;;
esac
exit $RETVAL

