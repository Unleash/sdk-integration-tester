#!/bin/bash
set -e

for i in 'node 3000 NodeJS' 'java 5100 Java' 'python 5001 Python'; do
    echo 'Testing' $i
    SDK=( $i )
    docker compose up -d postgres unleash-server

    ./wait-unleash-server-has-token.sh || exit 1
    echo "Now server is setup"

    ./run-test.sh ${SDK[0]} ${SDK[1]} ${SDK[2]}
    docker compose stop postgres unleash-server
    docker compose rm -f postgres unleash-server
done

