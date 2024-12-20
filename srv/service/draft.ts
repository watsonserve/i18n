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
  scope?: string | string[];
  key: string;
  value: string;
  pageNo: number;
  pageSize: number;
  isDraft?: boolean;
}

async function publish({ scope, language }: any) {
  if (!scope || !language) return { stat: -1, msg: 'data not found' };

  const [_docs, docs] = (await Promise.all([
    WordModel.find({ scope: '_', language }),
    WordModel.find({ scope, language })
  ]) as [any[], any[]]);

  const result = _docs.concat(docs).reduce((pre, item) => {
    pre[item.key] = item.value;
    return pre;
  }, {} as Record<string, string>);
  
  fs.writeFile(path.resolve(STORE_PATH, `${scope}${language}.json`), JSON.stringify(result));

  return { stat: 0, msg: 'success' };
}


export async function selectDraft(params: ISelectQuery) {
  let { language, scope, key, value, pageNo = 0, pageSize = 0, isDraft = false } = params;
  const using = { $ne: isDraft ? EnUsing.ONLINE : EnUsing.DRAFT };
  const filter: { [k:string]: any } = { using };

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
  const raw = await WordModel.find({ _id: { $in: docs.map(item => item._id) } });
  const rawMap = new Map(raw.map(({ _doc }: any) => [_doc._id.toString(), _doc]));

  return {
    stat: 0,
    msg: 'success',
    data: {
      list: docs.map(({ _doc }: any) => {
        const { _id, __v, ...word } = _doc;
        const id = _id.toString();
        let opt = !word.scope ? 'del' : rawMap.get(id) ? 'mod' : 'add';

        return { id, ...word, opt };
      }),
      total
    }
  };
}
