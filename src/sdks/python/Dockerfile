FROM python:3.10-alpine AS builder

WORKDIR /pythontester

COPY . .

RUN apk add --no-cache gcc build-base

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install -r requirements.txt

FROM python:3.10-alpine

WORKDIR /pythontester

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /pythontester /pythontester

ENV PATH="/opt/venv/bin:$PATH"

ENTRYPOINT [ "gunicorn", "main:app" ]