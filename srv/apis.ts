import express from 'express';
import { selectDraft, release, publish, selectScopes } from './service';
import { select, insert, remove, modifyKey, modifyValue } from './dict';

const router = express.Router();

router.get('/scopes', async (req, resp) => {
  try {
    const res = await selectScopes();
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
    const { id, prefix, oldKey, key, value = '' } = req.body;
    const res = await (id ? modifyValue(id, value) : modifyKey(prefix, oldKey, key));
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

router.put('/dict', async (req, resp) => {
  try {
    const res = await insert(req.body);
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.get('/draft', async (req, resp) => {
  try {
    const res = await selectDraft(req.query as any);
    resp.send(res);
  } catch(err: any) {
    resp.send({ stat: -1, msg: err.message });
  }
});

router.get('/release', async (req, resp) => {
  try {
    const ids = (req.query.ids as string).split(',') || [];
    const res = await release(ids);
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
