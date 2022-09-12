#!/bin/bash
CONTAINER=$1
if [ -z $CONTAINER ]; then echo "Missing argument" && exit 1; fi
while [ "$(docker compose ps --format=json --status exited ${CONTAINER})" == "null" ]; do
    echo "Waiting until ${CONTAINER} finish"
    sleep 1
done