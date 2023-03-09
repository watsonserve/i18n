import fs from 'fs/promises';
import path from 'path';
import { WordDraftModel, WordModel } from './schema';

interface IWordModel {
  prefix: string;
  language: string;
  key: string;
  value: string;
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
  const [doc0, doc1] = await Promise.all([
    WordDraftModel.findOne({ prefix, language, key }),
    WordModel.findOne({ prefix, language, key })
  ]);
  if (null !== doc0 || null !== doc1) return { stat: -1, msg: 'same' };

  // save
  await new WordDraftModel({ prefix, language, key, value }).save();
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
    await WordDraftModel.updateOne({ _id: id }, { ...doc, value });
    return { stat: 0, msg: 'success' };
  }

  // check prefix & key
  const checkFields = { prefix, oldKey, key };
  for (let i of Object.keys(checkFields)) {
    if (!(checkFields as any)[i]) return { stat: -1, msg: `${i} is required` };
  }

  const docs = await WordModel.find({ prefix, key });
  if (docs.length) {
    return { stat: -1, msg: `key ${key} found` };
  }

  // modify a key
  const { modifiedCount } = await WordModel.updateMany({ prefix, key: oldKey }, { key }, { strict: true });
  return !modifiedCount ? { stat: 404, msg: `key ${oldKey} not found` } : { stat: 0, msg: 'success' };
}

export async function remove(ids: string | string[] = [], isDraft = false) {
  if (!Array.isArray(ids)) {
    ids = [ids];
  }
  ids = ids.filter(i => i);
  if (!ids.length) return { stat: -1, msg: 'id is required' };
  await (isDraft ? WordDraftModel : WordModel).remove({ _id: { $in: ids }});
  return { stat: 0, msg: 'success' };
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
  const filter: { [k:string]: any } = {};

  language = wrapArray<string>(language);
  prefix = wrapArray<string>(prefix);

  language && (filter.language = { $in: language });
  prefix && (filter.prefix = { $in: prefix });

  key && (filter.key = new RegExp(key, 'i'));
  value && (filter.value = new RegExp(value, 'i'));

  const offset = ((+pageNo < 1 ? 1 : +pageNo) - 1) * +pageSize;
  const model = isDraft ? WordDraftModel : WordModel;
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
