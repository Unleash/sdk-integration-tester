FROM node:20-alpine as builder
WORKDIR /unleash

COPY package.json index.js /unleash/

RUN yarn install --frozen-lockfile --production=true

FROM node:20-alpine

ENV NODE_ENV production

WORKDIR /unleash

COPY --from=builder /unleash .

USER node

CMD node index.js
