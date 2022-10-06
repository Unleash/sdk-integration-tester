FROM ruby:3.0.4-alpine3.15

COPY . .

RUN apk update && apk add --virtual build-dependencies build-base

RUN bundle install

ENTRYPOINT [ "ruby", "main.rb" ]