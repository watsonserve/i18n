import express from 'express';
import { select, insert, remove, modifyKey, modifyValue, diff, release, selectScopes } from './service';
import { createHmac, randomUUID } from 'crypto';
import { PASS_ID, AUTH_ORIGIN, AUTH_PATH, PASS_ADDR, PASS_SECRET } from './cfg';

const router = express.Router();

class SessMgr {
  private _map = new Map<string, string>();

  async load(k: string) {
    const str = this._map.get(k);
    if (!str) return null;

    const { v } = JSON.parse(str);
    return v;
  }

  async put(k: string, v: any, opt: { maxAge: number }) {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this._map.delete(k);
    }, opt.maxAge);
    this._map.set(k, JSON.stringify({ timer, v }));
  }
};

const sessMgr = new SessMgr();

router.use(async (req, resp, next) => {
  const sess = await sessMgr.load(req.cookies?.['uss']);
  if (sess || req.method === 'GET' && req.path === AUTH_PATH) return next();

  const stamp = Date.now().toString();
  const uuid = randomUUID();
  const sign = createHmac('sha512', PASS_SECRET);
  sign.update(uuid);
  sign.update(req.url);
  sign.update(stamp);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: PASS_ID,
    state: sign.digest('base64'),
    redirect_uri: `${AUTH_ORIGIN}${AUTH_PATH}?uuid=${uuid}&stamp=${stamp}&rd=${req.url}`
  }).toString();
  const pass = `${PASS_ADDR}?${params}`;
  if (!req.xhr) return resp.redirect(302, pass);
  resp.status(401).json({ stat: 401, msg: '', data: pass });
});

router.get('/auth', async (req, resp) => {
  const { uuid, stamp, rd, state, code } = req.query as Record<string, string>;
  const sign = createHmac('sha512', PASS_SECRET);
  sign.update(uuid);
  sign.update(rd);
  sign.update(stamp);
  if (state !== sign.digest('base64')) return resp.json({ stat: -1, msg: 'auth faild' });

  const uss = randomUUID();
  sessMgr.put(uss, code, { maxAge: 86400 });
  resp.cookie('uss', uss, { maxAge: 86400, httpOnly: true, signed: true })
  resp.redirect(302, rd);
});

router.put('/dict', async (req, resp) => {
  try {
    const res = await insert(req.body);
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.delete('/dict', async (req, resp) => {
  try {
    let ids: any = req.query.id;
    if (!ids || (Array.isArray(ids) && !ids.length)) {
      resp.send({ stat: -1, msg: `ids are required` });
      return;
    }

    if ('string' === typeof ids) {
      ids = ids.split(',');
    }

    const res = await remove(ids);
    resp.send(res);
  } catch (err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.post('/dict', async (req, resp) => {
  try {
    const { id, scope, oldKey, key, value = '' } = req.body;
    const res = await (id ? modifyValue(id, value) : modifyKey(scope, oldKey, key));
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.get('/dict', async (req, resp) => {
  try {
    const res = await select(req.query as any);
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});


router.get('/scopes', async (req, resp) => {
  try {
    const res = await selectScopes();
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.get('/diff', async (req, resp) => {
  try {
    const { scope = '', language = '' } = req.query || {};
    const res = await diff(scope.toString(), language.toString());
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.get('/release', async (req, resp) => {
  try {
    const { scope = '', language = '', keys = '' } = req.query || {};
    const res = await release(scope.toString(), language.toString(), keys.toString().split(','));
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.get('/publish', async (req, resp) => {
  try {
    // const res = await publish(req.query);
    resp.send({});
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

export default router;
