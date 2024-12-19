import { createHmac } from 'crypto';
import { PASS_ID, PASS_SECRET, AUTH_ORIGIN, PASS_ADDR, AUTH_PATH } from './cfg';

export function wrapArray<T>(foo?: T | T[]): T[] | undefined {
  if (!foo) return undefined;
  let ret = (Array.isArray(foo) ? foo : [foo]).filter(i => i);
  return ret.length ? ret : undefined;
}

export function genSign(stamp: string, redirect: string) {
  return createHmac('sha512', PASS_SECRET)
    .update(stamp)
    .update(redirect)
    .digest('base64');
}

export function authGate(redirect: string, scope = '', rt = 'code') {
  const stamp = Date.now().toString();
  const sign = genSign(stamp, redirect);

  const url = new URL(PASS_ADDR);
  url.searchParams.set('response_type', rt);
  url.searchParams.set('client_id', PASS_ID);
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', sign);
  url.searchParams.set('redirect_uri', `${AUTH_ORIGIN}${AUTH_PATH}?stamp=${stamp}&rd=${redirect}`);
  return url.toString();
}
