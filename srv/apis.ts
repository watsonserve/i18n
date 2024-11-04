import express from 'express';
import { select, insert, remove, modifyKey, modifyValue, diff, release, selectScopes } from './service';

const router = express.Router();

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
