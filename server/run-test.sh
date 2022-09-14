#!/usr/bin/env bash
CONTAINER=$1
PORT=$2
LABEL=$3
if [ -z $CONTAINER ]; then echo "Missing container argument" && exit 1; fi
if [ -z $PORT ]; then echo "Missing port argument" && exit 1; fi
if [ -z $LABEL ]; then echo "Missing label argument" && exit 1; fi

docker compose up --build -d ${CONTAINER}
SDK_URL=http://localhost:${PORT}
SDK_LABEL=${LABEL}
while ! curl -s -o /dev/null ${SDK_URL}; do
    echo "Waiting ${SDK_URL}"
    sleep 1
done
SDK_URL=${SDK_URL} SDK_LABEL=${SDK_LABEL} yarn test:${CONTAINER}
docker compose stop ${CONTAINER} &