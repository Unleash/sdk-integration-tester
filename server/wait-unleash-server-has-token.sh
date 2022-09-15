#!/usr/bin/env bash
count=0
while ! curl -s -o /dev/null \
    unleash-server:4242/health
do 
    count=$((count + 1)) && if [ ${count} -gt 10 ]; then 
        echo "Failed to startup" 
        docker compose logs unleash-server
        exit 1; 
    fi
    echo "Waiting for unleash-server health..." && sleep 1 
done

while ! curl -s -o /dev/null \
    -H 'Authorization: *:*.unleash-insecure-admin-api-token' \
    unleash-server:4242/api/admin/api-tokens
do 
    count=$((count + 1)) && if [ ${count} -gt 10 ]; then 
        echo "Failed to startup" 
        docker compose logs unleash-server
        exit 1; 
    fi
    echo "Waiting for unleash-server tokens..." && sleep 1 
done