import fs from 'fs/promises';
import path from 'path';
import { STORE_PATH } from '../cfg';
import { WordModel, WordDraftModel, ScopeModel } from '../schema';
import { wrapArray } from '../utils';

enum EnUsing {
  DRAFT = 1,
  ONLINE
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


export async function selectScopes() {
  const model = ScopeModel;
  const docs = await model.find();

  return {
    stat: 0,
    msg: 'success',
    data: {
      list: docs.map((item: any) => {
        const { _id, __v, value } = item._doc;
        return { id: _id, value };
      })
    }
  };
}

export async function release(ids: string[]) {
  const [docs, draft] = await Promise.all([
    WordModel.find({ _id: { $in: ids } }),
    WordDraftModel.find({ _id: { $in: ids } })
  ]);
  const rawIds = new Set(docs.map(({ _doc }) => _doc._id.toString()));
  const adds: any[] = [];
  const removes: any[] = [];
  const modifies: any[] = [];
  draft.forEach(({ _doc }) => {
    const id = _doc._id.toString();
    const chan = !_doc.scope ? removes : rawIds.has(id) ? modifies : adds;
    chan.push({ ..._doc, _id: id });
  });
  await Promise.all([
    WordModel.insertMany(adds),
    WordModel.deleteMany({ _id: { $in: removes.map(item => item._id) } }),
    modifies.map(item => WordModel.updateOne({ _id: item._id }, item))
  ]);
  await WordDraftModel.deleteMany({ _id: { $in: ids } });
  return { stat: 0, msg: 'success' };
}

export async function shutdown(ids: string | string[] = []) {
  if (!Array.isArray(ids)) ids = [ids];
  ids = ids.filter(i => i);

  if (ids.length) await WordModel.updateMany({ _id: { $in: ids }}, { using: EnUsing.DRAFT });

  return { stat: 0, msg: 'success' };
}





export async function selectDraft(params: ISelectQuery) {
  let { language, scope, key, value, pageNo = 0, pageSize = 0 } = params;
  const filter: { [k:string]: any } = {};

  language = wrapArray<string>(language);
  scope = wrapArray<string>(scope);

  language && (filter.language = { $in: language });
  scope && (filter.scope = { $in: scope });

  key && (filter.key = new RegExp(key, 'i'));
  value && (filter.value = new RegExp(value, 'i'));

  const offset = ((+pageNo < 1 ? 1 : +pageNo) - 1) * +pageSize;
  const [docs, total] = (await Promise.all([
    WordDraftModel.find(filter).skip(offset).limit(+pageSize),
    WordDraftModel.count(filter)
  ]) as [any[], number]);
  const raw: any[] = await WordModel.find({ _id: { $in: docs.map(item => item._id) } });
  const rawMap = new Map(raw.map(({ _doc }) => [_doc._id.toString(), _doc]));

  return {
    stat: 0,
    msg: 'success',
    data: {
      list: docs.map(item => {
        const { _id, __v, ...word } = item._doc;
        const id = _id.toString();
        let opt = !word.scope ? 'del' : rawMap.get(id) ? 'mod' : 'add';

        return { id, ...word, opt };
      }),
      total
    }
  };
}


export async function loadFile(language: string, scope = '_') {
  try {
    const strContent = await fs.readFile(path.resolve(STORE_PATH, `${scope}_${language}.json`), 'utf-8');
    return JSON.parse(strContent);
  } catch (err) {

  }
  return {};
}

export async function writeFile(language: string, scope: string, data: Record<string, string>) {
  return fs.writeFile(path.resolve(STORE_PATH, `${scope}_${language}.json`), JSON.stringify(data), 'utf-8');
}