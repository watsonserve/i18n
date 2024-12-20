#!/usr/bin/env node

import { randomUUID } from 'crypto';
import path from 'path';
import http from 'http';
import mongoose from 'mongoose';
import express from 'express';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import apiRouter from './apis';
import { AUTH_PATH, MONGO_ADDRESS, PORT, STORE_PATH } from './cfg';
import { authGate, genSign } from './utils';
import sessMgr from './sess';

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
  
  app.use(async (req, resp, next) => {
    const sess = await sessMgr.load(req.cookies?.['uss']);
    if (sess || req.method === 'GET' && req.path === AUTH_PATH) return next();

    const pass = authGate(req.headers.referer || '');
    req.xhr
      ? resp.status(401).json({ stat: 401, msg: 'Unauthorized', data: pass })
      : resp.redirect(302, pass);
  });
  
  app.get('/auth', async (req, resp) => {
    const { stamp, rd, state, code } = req.query as Record<string, string>;
    const sign = genSign(stamp, rd);
    if (state !== sign) return resp.json({ stat: -1, msg: 'auth faild' });
  
    const uss = randomUUID();
    sessMgr.put(uss, code, { maxAge: 86400 });
    resp.cookie('uss', uss, { maxAge: 86400, httpOnly: true })
    resp.redirect(302, rd);
  });

  app.use('/api', apiRouter);

  // catch 404 and forward to error handler
  app.use((req: any, resp: any, next: any) => {
    if (req.url.startsWith('/api/')) return next(createError(404));
    // resp.header.
    // resp.status(302);
    resp.sendFile(path.join(STORE_PATH, 'index.html'));
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
