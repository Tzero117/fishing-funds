/* eslint-disable no-eval */
import got from 'got';
import iconv from 'iconv-lite';
import NP from 'number-precision';
import cheerio from 'cheerio';
import * as Utils from '../utils';

// 天天基金
export const FromEastmoney: (
  code: string
) => Promise<Fund.ResponseItem | null> = async (code) => {
  try {
    const { body } = await got(`http://fundgz.1234567.com.cn/js/${code}.js`);
    return body.startsWith('jsonpgz') ? eval(body) : null;
  } catch (error) {
    return null;
  }
};

// 基金速查网
export const FromDayFund: (
  code: string
) => Promise<Fund.ResponseItem | null> = async (code) => {
  try {
    const { body } = await got('https://www.dayfund.cn/ajs/ajaxdata.shtml', {
      searchParams: {
        showtype: 'getfundvalue',
        fundcode: code,
      },
    });
    if (body === '||||%|%|||||') {
      return null;
    }
    const { body: html } = await got(
      `https://www.dayfund.cn/fundinfo/${code}.html`
    );
    const $ = cheerio.load(html);
    const [name] = $('meta[name=keywords]').attr('content')?.split(',') || [''];
    const [
      jzrq,
      zxjz, // 最新净值
      ljjz,
      sjbjz,
      sjzzl,
      gsbjl,
      gsbjz,
      gsz,
      dwjz,
      gzrq,
      gztime,
    ] = body.split('|');

    // 2021-01-29|1.8040|2.2490|-0.0440|-2.3800%|-1.8652%|-0.0345|1.8135|1.8480|2021-01-29|15:35:00
    return {
      name,
      fundcode: code,
      gztime: `${gzrq} ${gztime}`,
      gszzl: Number(gsbjl.replace(/%/g, '')).toFixed(2),
      jzrq,
      dwjz,
      gsz,
    };
  } catch (error) {
    return null;
  }
};

// 腾讯证券
export const FromTencent: (
  code: string
) => Promise<Fund.ResponseItem | null> = async (code) => {
  try {
    const {
      body: { data },
    } = await got('https://web.ifzq.gtimg.cn/fund/newfund/fundSsgz/getSsgz', {
      searchParams: {
        app: 'web',
        symbol: `jj${code}`,
      },
      responseType: 'json',
    });
    const { yesterdayDwjz, code: status, data: list, date: gzrq } = data;
    if (status === -1) {
      return null;
    }
    const [time, ssgsz] = list.pop();
    const { body } = await got(`https://gu.qq.com/jj${code}`);
    const $ = cheerio.load(body);
    const dwjz = yesterdayDwjz;
    const name = $('.title .col_1').text();
    const jzrq = $('#main3').text();
    const gsz = $('#main5').text() || ssgsz;
    const gzTime = `${time.slice(0, 2)}:${time.slice(2)}`;
    const gszzl = NP.times(NP.divide(NP.minus(gsz, dwjz), dwjz), 100).toFixed(
      2
    );
    return {
      name,
      dwjz,
      fundcode: code,
      gztime: `${gzrq} ${gzTime}`,
      jzrq,
      gsz,
      gszzl,
    };
  } catch (error) {
    return null;
  }
};

// 新浪基金
export const FromSina: (
  code: string
) => Promise<Fund.ResponseItem | null> = async (code) => {
  try {
    const { rawBody } = await got(`https://hq.sinajs.cn/list=fu_${code}`, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
      },
    });
    const utf8String = iconv.decode(rawBody, 'GB18030');
    const [_, contnet] = utf8String.split('=');
    const data = contnet.replace(/(")|(;)|(\s)/g, '');
    if (!data) {
      return null;
    }
    const { body: html } = await got(
      `https://finance.sina.com.cn/fund/quotes/${code}/bc.shtml`
    );
    const $ = cheerio.load(html);
    const jzrq = $('#fund_info_blk2 > .fund_data_date').text().slice(5);
    const [name, time, gsz, dwjz, zjz, unknow1, gszzl, gzrq] = data.split(',');
    return {
      name,
      dwjz,
      fundcode: code,
      gztime: `${gzrq} ${time}`,
      jzrq,
      gsz,
      gszzl: Number(gszzl).toFixed(2),
    };
  } catch (error) {
    return null;
  }
};

// 好买基金
export const FromHowbuy: (
  code: string
) => Promise<Fund.ResponseItem | null> = async (code) => {
  try {
    const { body } = await got.post(
      `https://www.howbuy.com/fund/ajax/gmfund/valuation/valuationnav.htm`,
      {
        searchParams: {
          jjdm: code,
        },
      }
    );
    if (!body) {
      return null;
    }
    let $ = cheerio.load(body);
    const gsz = $('span').eq(0).text();
    const gszzl = $('span').eq(2).text().replace(/%/g, '');
    const gztime = `${new Date().getFullYear()}-${$('span')
      .eq(3)
      .text()
      .replace(/(\[)|(\])/g, '')
      .trim()}`;

    const { body: html } = await got.post(
      `https://www.howbuy.com/fund/${code}/`
    );
    $ = cheerio.load(html);
    const name = $('.gmfund_title .lt h1')
      .text()
      .replace(/(\()|(\))|(\d)/g, '');
    const dwjz = $('.dRate > div').text().trim();
    const jzrq =
      /\d{2}-\d{2}/.exec($('.dRate').next().text())?.[0] || '无法获取';
    return {
      name,
      dwjz,
      fundcode: code,
      gztime,
      jzrq,
      gsz,
      gszzl: Number(gszzl).toFixed(2),
    };
  } catch (error) {
    return null;
  }
};