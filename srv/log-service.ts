import fs from 'fs/promises';
import path from 'path';
import { STORE_PATH } from './cfg';
import { WordModel, WordDraftModel, ScopeModel } from './schema';

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

function modelify(src: IWordModel | null) {
  if (!src) return null;

  const { prefix, language, key, value } = src;
  return `${prefix}_${language}_${key}_${value}`;
}

function find(logData: [IWordModel | null, IWordModel | null][], last: IWordModel | null, next: IWordModel | null) {
  const strLst = modelify(last);
  const strNxt = modelify(next);

  let fooIdx = -1, barIdx = -1;

  for (let idx = 0; idx < logData.length && fooIdx === -1 && barIdx === -1; idx++) {
    const [item0, item1] = logData[idx];
    const str0 = modelify(item0);
    const str1 = modelify(item1);

    if (str0 === strLst || str1 === strNxt) return null;

    if (str1 && str1 === strLst) {
      fooIdx = idx;
    }
    if (str0 && str0 === strNxt) {
      barIdx = idx;
    }
  }

  return { fooIdx, barIdx };
}

class ChangeSet {
  _logData: [IWordModel | null, IWordModel | null][] = [];

  push([last, next]: [IWordModel | null, IWordModel | null]) {
    let ret = find(this._logData, last, next);
    if (!ret) return new Error('exsit');

    let { fooIdx, barIdx } = ret;
    if (fooIdx === barIdx) {
      -1 === fooIdx ? this._logData.push([last, next]) : this._logData.splice(fooIdx, 1);
      return null;
    }

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
      return null;
    }

    if (-1 == fooIdx) {
      bar[0] = last;
      last === bar[1] && this._logData.splice(barIdx, 1);
      return null;
    }

    foo[1] = next;
    next === foo[0] && this._logData.splice(fooIdx, 1);
    return null;
  }

  removeByIds() {}

  find() {}

  find(ids: string[]) {
    const idSet = new Set(ids);

    return this._logData.reduce<IWordModel[]>((pre, [_, item]) => {
      idSet.has(item?.id || '') && pre.push(item as IWordModel);

      return pre;
    }, []);
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
  const [doc, draft] = await Promise.all([
    WordModel.findOne(checkFields),
    WordDraftModel.findOne(checkFields)
  ]);

  if (null !== doc || null !== draft) return { stat: -1, msg: 'same' };

  // save
  await new WordDraftModel({ prefix, language, key, value }).save();
  return { stat: 0, msg: 'success' };
}

export async function remove(ids: string[]) {
  if (!Array.isArray(ids)) ids = [ids];
  ids = ids.filter(Boolean);

  if (!ids.length) return { stat: -1, msg: 'id is required' };

  const [docs] = await Promise.all([
    WordModel.find({ _id: { $in: ids }}),
    WordDraftModel.updateMany(
      { _id: { $in: ids }},
      { $set: { prefix: '', language: '', key: '', value: '' } }
    )
  ]);

  await WordDraftModel.insertMany(docs.map(
    item => ({ _id: item._id, prefix: '', language: '', key: '', value: '' })
  ));

  return { stat: 0, msg: 'success', data: { removeAll: ids.length } };
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
    const docs = await Promise.all([WordModel.findById(id), WordDraftModel.findById(id)]);

    WordDraftModel.updateOne(
      { _id: id }, { $set: Object.assign(...docs, { value }) }, { upsert: true }
    )
    return { stat: 0, msg: 'success' };
  }

  // check prefix & key
  const checkFields = [['prefix', prefix], ['oldKey', oldKey], ['key', key]];
  for (let [k, v] of checkFields) {
    if (!v) return { stat: -1, msg: `${k} is required` };
  }

  // modify a key
  const [doc, draft] = await Promise.all([
    WordModel.find({ prefix, key: oldKey }),
    WordDraftModel.find({ prefix, key: oldKey })
  ]);
  await WordDraftModel.insertMany(doc.concat(draft).map(item => ({ ...item, key })));
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
