require 'sinatra'
require 'json'
require 'unleash'
require 'pp'

Unleash.configure do |config|
  config.app_name = 'ruby-test-server'
  config.url                 = ENV['UNLEASH_URL']
  config.custom_http_headers = { 'Authorization': ENV['UNLEASH_API_TOKEN'] }
  config.refresh_interval = 1
end

set :bind, '0.0.0.0'

UNLEASH = Unleash::Client.new

get '/' do
  content_type :json
  { 'status': 'ok' }.to_json
end

get '/ready' do
  content_type :json
  { 'status': 'ok' }.to_json
end

post '/is-enabled' do
  content_type :json

  @request_payload = JSON.parse request.body.read

  context_params = @request_payload['context']
  context = Unleash::Context.new(context_params)
  toggle = @request_payload['toggle']

  enabled_state = UNLEASH.is_enabled? toggle, context

  {
    'name': toggle,
    'enabled': enabled_state,
    'context': context_params
  }.to_json
end

post '/variant' do
  content_type :json

  @request_payload = JSON.parse request.body.read

  context_params = @request_payload['context']
  context = Unleash::Context.new(context_params)
  toggle = @request_payload['toggle']

  variant = UNLEASH.get_variant toggle, context

  serialised_variant = {
    "enabled": variant.enabled,
    "name": variant.name,
  }

  serialised_variant['payload'] = variant.payload unless variant.payload.nil?

  {
    'name': toggle,
    'enabled': serialised_variant,
    'context': context_params
  }.to_json
end
