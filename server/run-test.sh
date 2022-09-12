#!/bin/bash
CONTAINER=$1
PORT=$2
if [ -z $CONTAINER ]; then echo "Missing container argument" && exit 1; fi
if [ -z $PORT ]; then echo "Missing port argument" && exit 1; fi

docker compose up --build -d ${CONTAINER}
SDK_URL=http://localhost:${PORT}
while ! curl -s -o /dev/null ${SDK_URL}; do
    echo "Waiting ${SDK_URL}"
    sleep 1
done
SDK_URL=${SDK_URL} yarn test
docker compose stop ${CONTAINER} &