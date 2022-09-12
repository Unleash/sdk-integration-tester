#!/bin/bash
set -e
docker compose up -d postgres unleash-server initializer

./server/wait-container-exit.sh initializer
echo "Now server is setup"

for i in 'node 3000' 'java 5100' 'python 5000'; do
    SDK=( $i )
    ./server/run-test.sh ${SDK[0]} ${SDK[1]}
done

docker compose stop postgres unleash-server initializer
