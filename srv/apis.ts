import express from 'express';
import { insert, modify, remove, select, publish, selectScopes } from './service';

const router = express.Router();

router.get('/scopes', async (req, resp) => {
  try {
    const res = await selectScopes();
    // resp.setHeader('Access-Control-Allow-Origin', req.headers.origin || '');
    // resp.setHeader('Access-Control-Allow-Credentials', 'true');
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

router.post('/dict', async (req, resp) => {
  try {
    const res = await modify(req.body);
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.delete('/dict', async (req, resp) => {
  try {
    const res = await remove(req.query.id as (string | string[] | undefined));
    resp.send(res);
  } catch (err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.put('/dict', async (req, resp) => {
  try {
    const res = await insert(req.body);
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.get('/publish', async (req, resp) => {
  try {
    const res = await publish(req.query);
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

export default router;
