# syntax=docker/dockerfile:1.7
# One-pass production image — alpine-based.
#
# Strategy: copy the pre-built `onepass-server-linux-amd64` from repo root.
# Build completes in <30s, no Go toolchain needed.
#
# To rebuild from Go source instead, see Dockerfile.src.
#
# gcr.io/distroless/base is unreachable from this build env, so the runtime
# stage is alpine:3.20 + ca-certificates + non-root user "onepass" (uid 1000).

# ---- Default: copy pre-built binary from build context ----
FROM alpine:3.20 AS app-bin
COPY onepass-server-linux-amd64 /onepass-server

# ---- Build website ----
FROM node:22-alpine AS website
COPY website /website
WORKDIR /website
RUN yarn install --network-timeout 600000 && yarn build

# ---- Runtime ----
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -g 1000 onepass && \
    adduser -D -G onepass -u 1000 onepass
COPY --from=app-bin /onepass-server /onepass-server
COPY --from=website /website/dist /public
USER onepass
EXPOSE 1337
ENTRYPOINT ["/onepass-server"]
