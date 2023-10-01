import { WordModel, WordDraftModel } from './schema';

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

interface ISelectQuery {
  language?: string | string[];
  prefix?: string | string[];
  key: string;
  value: string;
  pageNo: number;
  pageSize: number;
  isDraft?: boolean;
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

export async function modifyValue(id: string, value: string) {
  const [online, draft] = await Promise.all([
    WordModel.findById(id).catch(() => ({})),
    WordDraftModel.findById(id).catch(() => ({}))
  ]);
  const nxtData = Object.assign(online, draft, { value });
  const { prefix, language, key } = nxtData;
  if (![prefix, language, key].filter(Boolean).length)
    return { stat: -1, msg: 'not found' };

  WordDraftModel.updateOne(
    { _id: id }, { $set: nxtData }, { upsert: true }
  )
  return { stat: 0, msg: 'success' };
}

export async function modifyKey(prefix: string, oldKey: string, key: string) {
  // check prefix & key
  const checkFields = [['prefix', prefix], ['oldKey', oldKey], ['key', key]];
  for (let [k, v] of checkFields) {
    if (!v) return { stat: -1, msg: `${k} is required` };
  }

  // modify a key
  let [doc, draft] = await Promise.all([
    WordModel.find({ prefix, key: oldKey }),
    WordDraftModel.find({ prefix, key: oldKey })
  ]);

  const draftSet = new Set(draft.map(item => item.language));
  doc = doc.filter(item => !draftSet.has(item.language));

  await Promise.all([
    WordDraftModel.insertMany(doc.map(item => ({ ...item, key }))),
    WordDraftModel.updateMany(draft.map(item => ({ ...item, key })))
  ]);

  return { stat: 0, msg: 'success' };
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

  const [docs, total] = await Promise.all([
    WordModel.find(filter).skip(offset).limit(+pageSize),
    WordModel.count(filter)
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
