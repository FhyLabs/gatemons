#!/bin/bash

# Start client
(cd client && npm run dev) &

# Start gateway
(cd gateway && npm run dev) &

# Start server
(cd server && npm run dev) &

wait
