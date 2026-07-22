FROM golang:bookworm AS app
RUN mkdir -p /onepass
WORKDIR /onepass
COPY . .
ARG VERSION
RUN VERSION=${VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")} && \
    go build ./cmd/onepass && \
    go build -ldflags "-X main.version=${VERSION}" ./cmd/onepass-server

FROM node:22 AS website
COPY website /website
WORKDIR /website
RUN yarn install --network-timeout 600000 && yarn build

FROM gcr.io/distroless/base
COPY --from=app /onepass/onepass /onepass/onepass-server /
COPY --from=website /website/dist /public
USER 1000
ENTRYPOINT ["/onepass-server"]
