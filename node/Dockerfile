FROM node:16-alpine as builder
WORKDIR /unleash

COPY package.json yarn.lock index.js /unleash/

RUN yarn install --frozen-lockfile --production=true

FROM node:16-alpine

ENV NODE_ENV production

WORKDIR /unleash

COPY --from=builder /unleash .

USER node

CMD node index.js
