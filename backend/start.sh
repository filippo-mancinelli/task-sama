#!/bin/bash

mongod --bind_ip_all &
MONGOD_PID=$!

node index.js

# Cleanup: Kill the mongod process after the node process finishes
kill $MONGOD_PID
