import { ITableReq, ILoadTableResp, ISaveDataReq } from './types';

export const prefixList = ['_'];
export const languages = ['ar', 'en', 'es', 'fr', 'ru', 'zh', 'zh-cn', 'ja', 'de'];

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD'
}

interface IRequestOptions {
  feat: string;
  method: Method;
  data?: any;
}

function urlEncode(data: { [k: string]: string | string[] }, search = new URLSearchParams()): string {
  const dataKey = Object.keys(data);
  for (const key of dataKey) {
    let values = data[key];
    if (undefined === values || null === values || '' === values || Number.isNaN(values)) continue;
    if (!Array.isArray(values)) {
      values = [values];
    }
    for (let v of values) {
      search.append(key, v);
    }
  }
  return search.toString();
}

async function request(options: IRequestOptions): Promise<any> {
  let { feat, method, data } = options;

  const opts: any = {
    method,
    headers: {},
    cache: 'no-cache',
    credentials: 'include'
  };

  if (data) {
    // 有数据则设置数据类型，没有则设置内容长度为0
    if (method === Method.POST || method === Method.PUT) {
      opts.body = urlEncode(data);
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
    } else {
      const url = new URL(`${window.location.origin}${feat}`);
      urlEncode(data, url.searchParams);
      feat = url.toString();
      opts.headers['Content-Length'] = '0';
    }
  }

  const resp = await fetch(feat, opts);
  if (!resp.ok) return Promise.reject(new Error(resp.statusText || String(resp.status)));
  return resp.json();
}

export async function loadOptions() {
  return {
    prefixList, languages
  };
}

export async function loadTable({ pageNo, pageSize, prefix, language, key, value }: ITableReq): Promise<ILoadTableResp> {
  const data: any = { pageNo, pageSize, key, value };

  prefix && prefix?.length && (data.prefix = prefix);
  language && language?.length && (data.language = language);

  const resp = await request({
    feat: '/api/dict',
    method: Method.GET,
    data
  });

  return resp.data;
}

export function remove(ids: string[]) {
  return request({ feat: '/api/dict', method: Method.DELETE, data: { id: ids } });
}

export function saveRow(data: ISaveDataReq) {
  return request({ feat: '/api/dict', method: Method.PUT, data });
}

export function alter(data: any) {
  return request({ feat: '/api/dict', method: Method.POST, data });
}

type II18nReturn = (key: string, foo?: {[k: string]: any}) => string;

function loadJson(el: HTMLScriptElement, lang: string) {
  return new Promise((resolve, reject) => {
    el.onload = resolve;
    el.onerror = reject;
    el.src = `http://i18n.watsonserve.com/_${lang.toLowerCase()}.json`;
  });
}

async function walkLanguages(idx = 0): Promise<any> {
  const lang = navigator.languages[idx];
  if (!lang) return Promise.reject();

  const el = document.createElement('script');
  el.type = 'application/javascript';

  document.head.appendChild(el);
  try {
    return await loadJson(el, lang);
  } catch (err) {
    el.remove();
    return walkLanguages(idx + 1);
  }
}

export async function i18n(idx = 0): Promise<any> {

  try {
    const resp = await walkLanguages();
    // return (key: string, foo: {[k: string]: any} = {}) => {
    //   const tmpl = data[key];
    //   if ('string' !== typeof tmpl) return key;
    //   return tmpl.replace(/\${(.+?)}/g, (_, index) => foo[index])
    // };
  } catch (err) {
  }
}
