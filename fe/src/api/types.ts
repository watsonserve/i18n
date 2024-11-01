export interface IList {
  id: string;
  scope: string;
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
  scope?: string[];
  language?: string[];
  key?: string;
  value?: string;
};

export interface ISaveData {
  scope: string;
  language: string;
  key: string;
  value?: string;
};

export type ISaveDataReq = ISaveData | {
  scope: string;
  oldKey: string;
  key: string;
} | {
  id: string;
  value?: string;
};
