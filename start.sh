#!/bin/bash

# Start client
(cd client && npm start) &

# Start gateway
(cd gateway && npm start) &

# Start server
(cd server && npm start) &

wait
