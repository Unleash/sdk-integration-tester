while ! curl -s -o /dev/null \
    unleash-server:4242/health
do echo "Waiting for unleash-server..." && sleep 1 
done

while ! curl -s -o /dev/null \
    -H 'Authorization: *:*.unleash-insecure-admin-api-token' \
    unleash-server:4242/api/admin/api-tokens
do echo "Waiting for unleash-server..." && sleep 1 
done