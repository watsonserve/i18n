export interface IList {
  id: string;
  prefix: string;
  key: string;
  language: string;
  value: string;
}

export interface ILoadTableResp {
  list: IList[];
  total: number;
}

export interface ITableReq {
  pageNo: number;
  pageSize: number;
  prefix?: string[];
  language?: string[];
  key?: string;
  value?: string;
};

export interface ISaveData {
  prefix: string;
  language: string;
  key: string;
  value?: string;
};

export type ISaveDataReq = ISaveData | {
  prefix: string;
  oldKey: string;
  key: string;
} | {
  id: string;
  value?: string;
};
