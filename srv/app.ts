#!/usr/bin/env node

import path from 'path';
import http from 'http';
import mongoose from 'mongoose';
import express from 'express';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import apiRouter from './apis';
import { MONGO_ADDRESS, PORT, STORE_PATH } from './cfg';

const debug = require('debug')('translate:server');

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) return val;

  if (port >= 0) return port;

  return false;
}

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(PORT || '80');

async function gen() {
  const app = express();
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(STORE_PATH));
  app.use('/api', apiRouter);

  // catch 404 and forward to error handler
  app.use((req: any, res: any, next: any) => {
    if (req.url.startsWith('/api/')) return next(createError(404));

    res.sendFile(path.join(STORE_PATH, 'index.html'));
  });

  // error handler
  app.use((err: any, _, res: any) => {
    // set locals, only providing error in development
    // res.locals.message = err.message;
    // res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({ msg: err.message });
  });

  app.set('port', port);
  return app;
}

(async function main() {
  mongoose.connect(`mongodb://${MONGO_ADDRESS}/translate`);
  const app = await gen();
  const server = http.createServer(app);
  server.listen(port);

  server.on('error', (error: any) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr!.port;
    debug('Listening on ' + bind);
  });
})();
