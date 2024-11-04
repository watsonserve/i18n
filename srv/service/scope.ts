import { ScopeModel } from '../schema';

enum EnUsing {
  UNKNOW,
  DRAFT,
  ONLINE,
  MODIFIED
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
