import fs from 'fs/promises';
import path from 'path';
import { STORE_PATH } from './cfg';
import { WordModel, ScopeModel } from './schema';

enum EnUsing {
  DRAFT = 1,
  ONLINE
}

interface IWordModel {
  id: string;
  prefix: string;
  language: string;
  key: string;
  value: string;
}

interface IModify {
  id: string;
  prefix: string;
  oldKey: string;
  key: string;
  value: string;
}

function wrapArray<T>(foo?: T | T[]): T[] | undefined {
  if (!foo) return undefined;
  let ret = (Array.isArray(foo) ? foo : [foo]).filter(i => i);
  return ret.length ? ret : undefined;
}

class ChangeSet {
  _logData: [IWordModel | null, IWordModel | null][] = [];
  push([last, next]: [IWordModel | null, IWordModel | null]) {
    let fooIdx = last ? this._logData.findIndex(item => JSON.stringify(item[1]) === JSON.stringify(last)) : -1;
    let barIdx = next ? this._logData.findIndex(item => JSON.stringify(item[0]) === JSON.stringify(next)) : -1;

    if (fooIdx === barIdx) return -1 === fooIdx ? this._logData.push([last, next]) : this._logData.splice(fooIdx, 1);

    const foo = this._logData[fooIdx] || null;
    const bar = this._logData[barIdx] || null;

    if (-1 !== fooIdx && -1 !== barIdx) {
      this._logData.push([foo[0], bar[1]]);
      if (barIdx < fooIdx) {
        barIdx ^= fooIdx;
        fooIdx ^= barIdx;
        barIdx ^= fooIdx;
      }
      this._logData.splice(barIdx, 1);
      this._logData.splice(fooIdx, 1);
      return;
    }

    if (-1 == fooIdx) {
      bar[0] = last;
      return;
    }

    foo[1] = next;
  }
}

const channel = new ChangeSet();

export async function insert(params: IWordModel) {
  const { prefix, language, key, value = '' } = params;
  const checkFields = { prefix, language, key };

  // check prefix & language & key
  for (let i of Object.keys(checkFields)) {
    if (!(checkFields as {[s:string]: string})[i]) return { stat: -1, msg: `${i} is required` };
  }

  // check have a same data row in database
  const doc = await WordModel.findOne(checkFields);
  if (null !== doc) return { stat: -1, msg: 'same' };

  // save
  channel.push([null, { id: Math.random().toString(), prefix, language, key, value }]);
  return { stat: 0, msg: 'success' };
}

export async function release(ids: string[]) {
  const docs = await WordModel.find({ _id: { $in: ids } });
  if (docs.length) {
    const value = [(docs.value as string[]).reverse()[0]];
    await WordModel.updateOne(docs, { using: EnUsing.ONLINE, value });
  }
  return { stat: 0, msg: 'success' };
}

export async function shutdown(ids: string | string[] = []) {
  if (!Array.isArray(ids)) ids = [ids];
  ids = ids.filter(i => i);

  if (ids.length) await WordModel.updateMany({ _id: { $in: ids }}, { using: EnUsing.DRAFT });

  return { stat: 0, msg: 'success' };
}

export async function modify(params: IModify) {
  const { id, prefix, oldKey, key, value = '' } = params;

  // modify a value
  if (id) {
    const doc = await WordModel.findById(id);

    channel.push([doc, { ...doc, value }]);
    return { stat: 0, msg: 'success' };
  }

  // check prefix & key
  const checkFields = [['prefix', prefix], ['oldKey', oldKey], ['key', key]];
  for (let [k, v] of checkFields) {
    if (!v) return { stat: -1, msg: `${k} is required` };
  }

  // modify a key
  channel.push([{ prefix, key: oldKey }, { prefix, key }]);
  return { stat: 0, msg: 'success' };
}


export async function remove(ids: undefined | string | (string | undefined)[]) {
  if (!Array.isArray(ids)) ids = [ids];
  ids = ids.filter(i => i);

  if (!ids.length) return { stat: -1, msg: 'id is required' };

  const docs = await WordModel.find({ _id: { $in: ids }});
  const up: any[] = [];
  const rm: any[] = [];
  docs.forEach(doc => {
    if (doc.value.length > 1) return up.push(doc);
    if (!(doc.using & EnUsing.ONLINE)) return rm.push(doc);
  });
  channel.push([{ _id: { $in: ids } }, null]);
  // await WordModel.updateMany({ _id: { $in: ids }, using: EnUsing.DRAFT });
  return { stat: 0, msg: 'success', data: { removeAll: !up.length } };
}

interface ISelectQuery {
  language?: string | string[];
  prefix?: string | string[];
  key: string;
  value: string;
  pageNo: number;
  pageSize: number;
  isDraft?: boolean;
}

export async function select(params: ISelectQuery) {
  let { language, prefix, key, value, pageNo = 0, pageSize = 0, isDraft = false } = params;
  const using = { $ne: isDraft ? EnUsing.ONLINE : EnUsing.DRAFT };
  const filter: { [k:string]: any } = { using };

  language = wrapArray<string>(language);
  prefix = wrapArray<string>(prefix);

  language && (filter.language = { $in: language });
  prefix && (filter.prefix = { $in: prefix });

  key && (filter.key = new RegExp(key, 'i'));
  value && (filter.value = new RegExp(value, 'i'));

  const offset = ((+pageNo < 1 ? 1 : +pageNo) - 1) * +pageSize;
  const model = WordModel;
  const [docs, total] = await Promise.all([
    model.find(filter).skip(offset).limit(+pageSize),
    model.count(filter)
  ]);

  return {
    stat: 0,
    msg: 'success',
    data: {
      list: docs.map(item => {
        const { _id, __v, ...word } = item._doc;
        return { id: _id, ...word };
      }),
      total
    }
  };
}

export async function publish({ prefix, language }: any) {
  if (!prefix || !language) return { stat: -1, msg: 'data not found' };

  const [_docs, docs] = await Promise.all([
    WordModel.find({ prefix: '_', language }),
    WordModel.find({ prefix, language })
  ]);

  // export default (()=>{const _dict={};return k=>(_dict[k]||k)})()
  const result = _docs.concat(docs).reduce((pre, item) => {
    pre[item.key] = item.value;
    return pre;
  }, {} as { [k: string]: string} );
  
  fs.writeFile(path.resolve(STORE_PATH, `${prefix}${language}.json`), JSON.stringify(result));

  return { stat: 0, msg: 'success' };
}

export async function loadFile(language: string, prefix = '_') {
  const strContent = await fs.readFile(path.resolve(STORE_PATH, `${prefix}${language}.json`), 'utf-8');
  const result = JSON.parse(strContent);
  return Object.entries(result).map(([key, value]) => ({ prefix, language, key, value }));
}

const publishedDict = new Map<string, >();