#! /bin/sh
# cd base
# docker build -t mongo-node .
# cd ..
docker build -t translate .
docker-clean
docker run --rm -d --name i18n translate
