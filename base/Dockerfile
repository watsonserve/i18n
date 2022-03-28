FROM node:lts as builder
FROM mongo
RUN mkdir /usr/local/lib/node_modules && ln -s /usr/local/lib/node_modules/yarn/bin/yarn /usr/local/bin/yarn
COPY --from=builder /usr/local/bin/node /usr/local/bin/
COPY --from=builder /usr/local/include/node /usr/local/include/node
COPY --from=builder /opt/yarn* /usr/local/lib/node_modules/yarn
