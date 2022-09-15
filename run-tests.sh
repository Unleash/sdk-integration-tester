#!/bin/bash
set -e
docker compose up -d postgres unleash-server

./server/wait-unleash-server-has-token.sh
echo "Now server is setup"

for i in 'node 3000 NodeJS' 'java 5100 Java' 'python 5001 Python'; do
    SDK=( $i )
    ./server/run-test.sh ${SDK[0]} ${SDK[1]} ${SDK[2]}
done

docker compose stop postgres unleash-server
