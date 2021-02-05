import * as Adapter from '../utils/adpters';
import * as Services from '../services';
import * as Utils from '../utils';
import CONST_STORAGE from '../constants/storage.json';
export interface CodeMap {
  [index: string]: Zindex.SettingItem & { originSort: number };
}

export const getZindexConfig: () => {
  zindexConfig: Zindex.SettingItem[];
  codeMap: CodeMap;
} = () => {
  const zindexConfig: Zindex.SettingItem[] = Utils.GetStorage(
    CONST_STORAGE.ZINDEX_SETTING,
    [
      { code: '1.000001', name: '上证指数', show: true },
      { code: '0.399001', name: '深证指数', show: true },
      { code: '0.399006', name: '创业板指', show: true },
      { code: '1.000300', name: '沪深300', show: true },
      { code: '0.399005', name: '中小板指', show: true },
      { code: '1.000016', name: '上证50', show: true },
      { code: '1.000905', name: '中证500', show: true },
    ]
  );
  const codeMap = zindexConfig.reduce((r, c, i) => {
    r[c.code.slice(2)] = { ...c, originSort: i };
    return r;
  }, {} as CodeMap);

  return { zindexConfig, codeMap };
};

export const getZindexs: () => Promise<
  (Zindex.ResponseItem | null)[]
> = async () => {
  const { zindexConfig } = getZindexConfig();
  const collectors = zindexConfig.map(({ code }) => () => getZindex(code));
  await Utils.Sleep(1000);
  return Adapter.ConCurrencyAllAdapter<Zindex.ResponseItem>(collectors);
};

export const getZindex: (
  code: string
) => Promise<Zindex.ResponseItem | null> = async (code) => {
  return Services.Zindex.FromEastmoney(code);
};