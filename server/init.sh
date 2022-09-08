#while ! curl -s unleash-server:4242/health
#do echo "Waiting for unleash-server..." && sleep 1 
#done
while ! curl -s -o /dev/null \
    -H 'Authorization: *:*.unleash-insecure-admin-api-token' \
    unleash-server:4242/api/admin/api-tokens
do echo "Waiting for unleash-server..." && sleep 1 
done
echo "Initializing state"
curl -XPOST -d @/initial-state.json \
    --show-error --silent \
    -w '\nResponse status code: %{http_code}\n' --fail --retry-all-errors \
    --retry 3 --retry-delay 1 \
    -H 'Content-Type: application/json' \
    -H 'Authorization: *:*.unleash-insecure-admin-api-token' \
    unleash-server:4242/api/admin/state/import && \
    echo "Finished initializing Unleash state"
