#!/usr/bin/env bash
set -e
./prerequisites.sh

export UNLEASH_URL="http://unleash-edge:3001/api" # TODO
export UNLEASH_URL="http://unleash-server:4242/api"
docker compose up -d postgres unleash-server unleash-edge initializer

./server/wait-container-exit.sh initializer
echo "Now server is setup"

for i in 'node 3000 NodeJS' 'java 5100 Java' 'python 5001 Python'; do
    SDK=( $i )
    ./server/run-test.sh ${SDK[0]} ${SDK[1]} ${SDK[2]}
done

docker compose stop postgres unleash-server unleash-edge initializer
