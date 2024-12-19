class SessMgr {
  private _map = new Map<string, string>();

  async load(k: string) {
    const str = this._map.get(k);
    if (!str) return null;

    const { v } = JSON.parse(str);
    return v;
  }

  async put(k: string, v: any, opt: { maxAge: number }) {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this._map.delete(k);
    }, opt.maxAge);
    this._map.set(k, JSON.stringify({ timer, v }));
  }
};

const sessMgr = new SessMgr();

export default sessMgr;
