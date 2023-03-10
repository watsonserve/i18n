import fs from 'fs/promises';
import path from 'path';
import { WordModel } from './schema';

enum EnUsing {
  UNKNOW,
  DRAFT,
  ONLINE,
  MODIFIED
}

interface IWordModel {
  prefix: string;
  language: string;
  key: string;
  value: string[];
  using: EnUsing; // draft: 1, online: 2
}

function wrapArray<T>(foo?: T | T[]): T[] | undefined {
  if (!foo) return undefined;
  let ret = (Array.isArray(foo) ? foo : [foo]).filter(i => i);
  return ret.length ? ret : undefined;
}

export async function insert(params: IWordModel) {
  const { prefix, language, key, value = '' } = params;
  const checkFields = { prefix, language, key };

  // check prefix & language & key
  for (let i of Object.keys(checkFields)) {
    if (!(checkFields as {[s:string]: string})[i]) return { stat: -1, msg: `${i} is required` };
  }

  // check have a same data row in database
  const doc = await WordModel.findOne({ prefix, language, key });

  if (null !== doc) return { stat: -1, msg: 'same' };

  // save
  await new WordModel({ prefix, language, key, value: [value], using: EnUsing.DRAFT }).save();
  return { stat: 0, msg: 'success' };
}

export async function release(id: string) {
  const doc = await WordModel.findOne({ _id: id });
  if (doc) {
    const value = [(doc.value as string[]).reverse()[0]];
    await WordModel.updateOne(doc, { using: EnUsing.ONLINE, value });
  }
  return { stat: 0, msg: 'success' };
}

export async function shutdown(ids: string | string[] = []) {
  if (!Array.isArray(ids)) ids = [ids];
  ids = ids.filter(i => i);

  if (ids.length) await WordModel.updateMany({ _id: { $in: ids }}, { using: EnUsing.DRAFT });

  return { stat: 0, msg: 'success' };
}

interface IModify {
  id: string;
  prefix: string;
  oldKey: string;
  key: string;
  value: string;
}

export async function modify(params: IModify) {
  const { id, prefix, oldKey, key, value = '' } = params;

  // modify a value
  if (id) {
    const doc = await WordModel.findById(id);

    await WordModel.updateOne(doc, { value: [doc.value[0], value], using: EnUsing.DRAFT | doc.using });
    return { stat: 0, msg: 'success' };
  }

  // check prefix & key
  const checkFields = [['prefix', prefix], ['oldKey', oldKey], ['key', key]];
  for (let [k, v] of checkFields) {
    if (!v) return { stat: -1, msg: `${k} is required` };
  }

  // modify a key
  const { modifiedCount } = await WordModel.updateMany({ prefix, key: oldKey, using: EnUsing.DRAFT }, { key }, { strict: true });
  return !modifiedCount ? { stat: 404, msg: `key ${oldKey} not found` } : { stat: 0, msg: 'success' };
}


export async function remove(ids: string | string[]) {
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
  await WordModel.remove({ _id: { $in: ids }, using: EnUsing.DRAFT });
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
  
  fs.writeFile(path.resolve(__dirname, 'www', `${prefix}${language}.json`), JSON.stringify(result));

  return { stat: 0, msg: 'success' };
}
