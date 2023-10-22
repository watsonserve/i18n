FROM node:lts as builder
WORKDIR /home
COPY ./srv /home/srv
RUN cd ./srv && yarn && yarn build && mv ./package.json ../dist/ && mv ./node_modules ../dist/node_modules

FROM node:lts
WORKDIR /home
COPY --from=builder /home/dist /home
EXPOSE 80
ENV NODE_ENV=production
CMD node /home/app.js
