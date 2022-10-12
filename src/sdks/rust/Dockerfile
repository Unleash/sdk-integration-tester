FROM rust:1.64.0-buster AS builder

WORKDIR /app

COPY . /app

RUN cargo build --release

FROM debian:buster-slim
RUN apt update && apt install -y libssl-dev libcurl4-openssl-dev
COPY --from=builder /app/target/release/rust /
CMD ["./rust"]
