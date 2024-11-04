import { IWord, WordModel } from '../schema';
import { wrapArray } from '../utils';
import { loadFile, writeFile } from './service';

enum EnUsing {
  DRAFT = 1,
  ONLINE
}

interface IWordModel {
  id: string;
  scope: string;
  language: string;
  key: string;
  value: string;
}

interface ISelectQuery {
  language?: string | string[];
  scope?: string | string[];
  key: string;
  value: string;
  pageNo: number;
  pageSize: number;
  isDraft?: boolean;
}

export async function insert(params: IWordModel) {
  const { scope, language, key, value = '' } = params;
  const checkFields = { scope, language, key };

  // check scope & language & key
  for (let i of Object.keys(checkFields)) {
    if (!(checkFields as {[s:string]: string})[i]) return { stat: -1, msg: `${i} is required` };
  }

  // check have a same data row in database
  const doc = await WordModel.findOne(checkFields);

  if (null !== doc) return { stat: -1, msg: 'same' };

  // save
  await new WordModel({ scope, language, key, value }).save();
  return { stat: 0, msg: 'success' };
}

export async function remove(ids: string[]) {
  if (!Array.isArray(ids)) ids = [ids];
  ids = ids.filter(Boolean);

  if (!ids.length) return { stat: -1, msg: 'id is required' };

  const docs = await WordModel.remove({ _id: { $in: ids }});

  return { stat: 0, msg: 'success', data: { removeAll: ids.length } };
}

function pick(fields: string[], data: Record<string, any>) {
  return fields.reduce<Record<string, any>>((pre, k) => {
    pre[k] = data[k];
    return pre;
  }, {});
}

export async function modifyValue(id: string, value: string) {
  let doc = await WordModel.findById(id).catch(() => ({}));
  doc = pick(['scope', 'language', 'key', 'value'], doc);
  doc = Object.assign(doc, { value });
  const { scope, language, key } = doc;
  if (![scope, language, key].filter(Boolean).length)
    return { stat: -1, msg: 'not found' };

  await WordModel.updateOne(
    { _id: id }, { $set: doc }, { upsert: true }
  )
  return { stat: 0, msg: 'success' };
}

export async function modifyKey(scope: string, oldKey: string, key: string) {
  // check scope & key
  const checkFields = [['scope', scope], ['oldKey', oldKey], ['key', key]];
  for (let [k, v] of checkFields) {
    if (!v) return { stat: -1, msg: `${k} is required` };
  }

  // modify a key
  const doc: any[] = await WordModel.find({ scope, key: oldKey });
  await WordModel.updateMany(doc.map(item => ({ ...item, key })));

  return { stat: 0, msg: 'success' };
}

export async function select(params: ISelectQuery) {
  let { language, scope, key, value, pageNo = 0, pageSize = 0 } = params;
  const filter: { [k:string]: any } = {};

  language = wrapArray<string>(language);
  scope = wrapArray<string>(scope);

  language && (filter.language = { $in: language });
  scope && (filter.scope = { $in: scope });

  key && (filter.key = new RegExp(key, 'i'));
  value && (filter.value = new RegExp(value, 'i'));

  const offset = ((+pageNo < 1 ? 1 : +pageNo) - 1) * +pageSize;

  const [docs, total] = await Promise.all([
    WordModel.find(filter).sort('desc').skip(offset).limit(+pageSize),
    WordModel.count(filter)
  ]);

  return {
    stat: 0,
    msg: 'success',
    data: {
      list: docs.map(({ _doc }: any) => {
        const { _id, __v, ...word } = _doc;
        return { id: _id, ...word };
      }),
      total
    }
  };
}


export async function diff(scope: string, language: string) {
  const [docs, kvMap] = await Promise.all([
    WordModel.find<IWord>({ scope, language }, { key: 1, value: 1, _id: 0 }),
    loadFile(language, scope)
  ]);

  const addList = [];
  const modList = [];
  for (const { key, value } of docs) {
    const onLineVal = kvMap[key];

    // not found
    if (undefined === onLineVal) {
      addList.push({ scope, key, value, language, opt: 'add' });
      continue;
    }

    delete kvMap[key];
    // not same
    if (onLineVal !== value) {
      modList.push({ scope, key, value, language, opt: 'mod', lastValue: onLineVal });
    }
  }
  const delList = Object.entries(kvMap).map(item => ({ scope, key: item[0], value: item[1], language, opt: 'del' }));
  const list = [...addList, ...modList, ...delList];

  return {
    stat: 0,
    msg: 'success',
    data: {
      list,
      total: list.length,
    }
  };
}

export async function release(scope: string, language: string, keys: string[]) {
  const [docs, kvMap] = await Promise.all([
    WordModel.find<IWord>({ scope, language, key: { $in: keys } }, { key: 1, value: 1, _id: 0 }),
    loadFile(language, scope)
  ]);

  keys.forEach(key => {
    delete kvMap[key];
  });

  const nextData = docs.reduce((pre, item) => {
    pre[item.key] = item.value;
    return pre;
  }, kvMap);

  await writeFile(language, scope, nextData);

  return { stat: 0, msg: 'success' };
}
