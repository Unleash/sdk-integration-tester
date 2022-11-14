FROM alpine:latest

RUN apk add ngrep bash

WORKDIR /ngrep
COPY ngrep-with-output /ngrep
ENTRYPOINT [ "/ngrep/ngrep-with-output" ]