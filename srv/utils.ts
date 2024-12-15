import { createHmac } from "crypto";
import { APP_ID, DOMAIN, SECRET } from "./cfg";

export function wrapArray<T>(foo?: T | T[]): T[] | undefined {
  if (!foo) return undefined;
  let ret = (Array.isArray(foo) ? foo : [foo]).filter(i => i);
  return ret.length ? ret : undefined;
}

export function authGate(redirect: string, scope = '', rt = 'code') {
  const stamp = Date.now();
  const state = createHmac('sha512', SECRET)
    .update(stamp.toString())
    .update(redirect)
    .digest('base64');

  const url = new URL('https://passport.watsonserve.com');
  url.searchParams.set('response_type', rt);
  url.searchParams.set('client_id', APP_ID);
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', `https://${DOMAIN}/auth.json?rd=${redirect}&stamp=${stamp}`);
  return url.toString();
}
