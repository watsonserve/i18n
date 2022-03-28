import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

interface IWordModel {
  prefix: string;
  language: string;
  key: string;
  value: string;
}

function wrapArray(foo: any | any[]): any[] | undefined {
  if (!foo) return undefined;
  let ret = (Array.isArray(foo) ? foo : [foo]).filter(i => i);
  return ret.length ? ret : undefined;
}

mongoose.connect('mongodb://localhost/translate');

// const ObjectId = Schema.ObjectId;
const wordModel = new Schema({
prefix: {
    type: String,
    idnex: true,
    required: true,
    background: true
},
language: {
    type: String,
    idnex: true,
    required: true,
    background: true
},
key: {
    type: String,
    idnex: true,
    required: true,
    background: true
},
value: {
    type: String,
    idnex: true,
    sparse: true,
    background: true
}
});

const WordModel = mongoose.model('translate', wordModel);

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
  await new WordModel({ prefix, language, key, value }).save();
  return { stat: 0, msg: 'success' };
}

export async function modify(params: any) {
  const { id, prefix, oldKey, key, value = '' } = params;

  // modify a value
  if (id) {
    await WordModel.updateOne({ _id: id }, { value });
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

export async function remove(ids: string | string[] = []) {
  if (!Array.isArray(ids)) {
    ids = [ids];
  }
  ids = ids.filter(i => i);
  if (!ids.length) return { stat: -1, msg: 'id is required' };
  await WordModel.remove({ _id: { $in: ids }});
  return { stat: 0, msg: 'success' };
}

export async function select(params: any) {
  let { language, prefix, key, value, pageNo = 0, pageSize = 0 } = params;
  const filter: { [k:string]: any } = {};

  language = wrapArray(language);
  prefix = wrapArray(prefix);

  language && (filter.language = { $in: language });
  prefix && (filter.prefix = { $in: prefix });

  key && (filter.key = new RegExp(key, 'i'));
  value && (filter.value = new RegExp(value, 'i'));

  const offset = ((+pageNo < 1 ? 1 : +pageNo) - 1) * +pageSize;
  const docs = await WordModel.find(filter).skip(offset).limit(+pageSize);

  return {
    stat: 0,
    msg: 'success',
    data: {
      list: docs.map(item => {
        const { _id, __v, ...word } = item._doc;
        return { id: _id, ...word };
      }),
      total: 200
    }
  };
}

export async function publish({ prefix, language }: any) {
  if (!prefix || !language) return { stat: -1, msg: 'data not found' };

  const docs = await WordModel.find({ prefix, language });

  // export default (()=>{const _dict={};return k=>(_dict[k]||k)})()
  const result = docs.reduce((pre, item) => {
    pre[item.key] = item.value;
    return pre;
  }, {} as { [k: string]: string} );
  
  fs.writeFile(path.resolve(__dirname, 'www', `${prefix}${language}.json`), JSON.stringify(result));

  return { stat: 0, msg: 'success' };
}
