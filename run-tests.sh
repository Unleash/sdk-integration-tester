#!/bin/bash
docker compose up -d postgres unleash-server initializer

while [ "$(docker compose ps --format=json --status exited initializer)" == "null" ]; do
    echo "Waiting initializer"
    sleep 1
done
echo "Now server is setup"

for i in 'node 3000' 'java 5100' 'python 5000'; do
    SDK=( $i )
    docker compose up --build -d ${SDK[0]}
    SDK_URL=http://localhost:${SDK[1]}
    while ! curl -s -o /dev/null ${SDK_URL}; do
	    echo "Waiting ${SDK_URL}"
	    sleep 1
    done
    SDK_URL=${SDK_URL} yarn test
    docker compose stop ${SDK[0]} &
done

docker compose stop postgres unleash-server initializer
