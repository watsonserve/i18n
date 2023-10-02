import fs from 'fs/promises';
import path from 'path';
import { STORE_PATH } from '../cfg';
import { WordModel, WordDraftModel } from '../schema';
import { wrapArray } from '../utils';

enum EnUsing {
  DRAFT = 1,
  ONLINE
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

async function publish({ prefix, language }: any) {
  if (!prefix || !language) return { stat: -1, msg: 'data not found' };

  const [_docs, docs] = (await Promise.all([
    WordModel.find({ prefix: '_', language }),
    WordModel.find({ prefix, language })
  ]) as [any[], any[]]);

  const result = _docs.concat(docs).reduce((pre, item) => {
    pre[item.key] = item.value;
    return pre;
  }, {} as Record<string, string>);
  
  fs.writeFile(path.resolve(STORE_PATH, `${prefix}${language}.json`), JSON.stringify(result));

  return { stat: 0, msg: 'success' };
}

export async function release(ids: string[]) {
  const [docs, draft] = await Promise.all([
    WordModel.find({ _id: { $in: ids } }),
    WordDraftModel.find({ _id: { $in: ids } })
  ]);
  const rawIds = new Set(docs.map(({ _doc }: any) => _doc._id.toString()));
  const adds: any[] = [];
  const removes: any[] = [];
  const modifies: any[] = [];
  const publishSet = new Set<string>();
  draft.forEach(({ _doc }: any) => {
    const { _id, prefix, language } = _doc;
    publishSet.add(`${prefix}/${language}`);
    const id = _id.toString();
    const chan = !_doc.prefix ? removes : rawIds.has(id) ? modifies : adds;
    chan.push({ ..._doc, _id: id });
  });
  await Promise.all([
    WordModel.insertMany(adds),
    WordModel.deleteMany({ _id: { $in: removes.map(item => item._id) } }),
    modifies.map(item => WordModel.updateOne({ _id: item._id }, item))
  ]);
  const publishFiles = [...publishSet].map(value => {
    const [prefix, language] = value.split('/');
    return publish({ prefix, language });
  });

  await Promise.all([
    WordDraftModel.deleteMany({ _id: { $in: ids } }),
    ...publishFiles
  ]);
  return { stat: 0, msg: 'success' };
}

export async function selectDraft(params: ISelectQuery) {
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
  const [docs, total] = (await Promise.all([
    WordDraftModel.find(filter).skip(offset).limit(+pageSize),
    WordDraftModel.count(filter)
  ]) as [any[], number]);
  const raw = await WordModel.find({ _id: { $in: docs.map(item => item._id) } });
  const rawMap = new Map(raw.map(({ _doc }: any) => [_doc._id.toString(), _doc]));

  return {
    stat: 0,
    msg: 'success',
    data: {
      list: docs.map(({ _doc }: any) => {
        const { _id, __v, ...word } = _doc;
        const id = _id.toString();
        let opt = !word.prefix ? 'del' : rawMap.get(id) ? 'mod' : 'add';

        return { id, ...word, opt };
      }),
      total
    }
  };
}
