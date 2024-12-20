class SessMgr {
  private _map = new Map<string, { timer: NodeJS.Timeout; v: any }>();

  async load(k: string) {
    const value = this._map.get(k);
    if (!value) return null;

    const { v } = value;
    return v;
  }

  async put(k: string, v: any, opt: { maxAge: number }) {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this._map.delete(k);
    }, opt.maxAge * 1000);
    this._map.set(k, { timer, v });
  }
};

const sessMgr = new SessMgr();

export default sessMgr;
