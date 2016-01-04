#! /bin/sh

LOG_LEVEL=trace nodejs index.js | ./node_modules/bunyan/bin/bunyan
