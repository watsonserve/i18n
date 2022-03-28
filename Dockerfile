FROM node:lts as builder
COPY . /home/
RUN cd /home && yarn && yarn build && mv fe/build dist/www && mv srv/package.json dist/ && cd dist && yarn
FROM mongo-node
COPY --from=builder /home/dist /home
WORKDIR /home
EXPOSE 80
ENV NODE_ENV=production
VOLUME /data/db
CMD mongod --fork --syslog --dbpath=/data/db && node /home/app.js
