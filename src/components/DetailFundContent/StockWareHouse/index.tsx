import React, { useEffect, useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { useRequest, useSize } from 'ahooks';
import * as echarts from 'echarts';

import { useNativeThemeColor } from '@/utils/hooks';
import CONST_VARIBLES from '@/constants/varibles.json';
import * as Services from '@/services';
import styles from './index.scss';

export interface StockWareHouseProps {
  code: string;
  stockCodes: string[];
}
interface TooltipProps {
  item: Fund.WareHouse;
}

const Tooltip: React.FC<TooltipProps> = (props) => {
  const { item } = props;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipName}>股票名称：{item.name}</div>
      <div>股票代码：{item.code}</div>
      <div>持仓占比：{item.ccb}%</div>
      <div className={item.zdf < 0 ? 'down-text' : 'up-text'}>
        涨跌幅：{item.zdf}%
      </div>
    </div>
  );
};

const StockWareHouse: React.FC<StockWareHouseProps> = ({
  code,
  stockCodes,
}) => {
  const warehouseRef = useRef<HTMLDivElement>(null);
  const [
    warehoseChartInstance,
    setWarehoseChartInstance,
  ] = useState<echarts.ECharts | null>(null);
  const { width: warehouseRefWidth } = useSize(warehouseRef);
  const { colors: varibleColors, darkMode } = useNativeThemeColor(
    CONST_VARIBLES
  );

  const initWarehoseChart = () => {
    const warehoseChartInstance = echarts.init(warehouseRef.current!);
    setWarehoseChartInstance(warehoseChartInstance);
  };

  const { run: runGetStockWareHouseFromEastmoney } = useRequest(
    Services.Fund.GetStockWareHouseFromEastmoney,
    {
      manual: true,
      onSuccess: (result) => {
        warehoseChartInstance?.setOption({
          backgroundColor: 'transparent',
          title: {
            text: '持仓前10股票',
            left: 'center',
            top: 0,
            textStyle: {
              color: varibleColors['--main-text-color'],
              fontSize: 14,
            },
          },
          tooltip: {
            trigger: 'item',
            formatter: (params: any) =>
              renderToString(<Tooltip item={params.data.item} />),
          },
          series: [
            {
              name: '持仓占比',
              type: 'pie',
              radius: '60%',
              center: ['50%', '50%'],
              data: result.map((item) => {
                return {
                  value: item.ccb,
                  name: item.name,
                  itemStyle: {
                    color:
                      item.zdf >= 0
                        ? varibleColors['--increase-color']
                        : varibleColors['--reduce-color'],
                  },
                  item,
                };
              }),
              roseType: 'radius',
              label: {
                color: varibleColors['--main-text-color'],
              },
              labelLine: {
                lineStyle: {
                  color: varibleColors['--main-text-color'],
                },
                smooth: 0.2,
                length: 10,
                length2: 20,
              },
              itemStyle: {
                color: varibleColors['--main-text-color'],
                borderRadius: 10,
                borderColor: 'rgba(255,255,255,0.3)',
                borderWidth: 1,
                // shadowBlur: 200,
                // shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
              animationType: 'scale',
              animationEasing: 'elasticOut',
              animationDelay: () => Math.random() * 200,
            },
          ],
        });
      },
    }
  );

  useEffect(() => {
    initWarehoseChart();
  }, []);

  useEffect(() => {
    if (warehoseChartInstance) {
      runGetStockWareHouseFromEastmoney(code, stockCodes);
    }
  }, [darkMode, warehoseChartInstance, stockCodes]);

  useEffect(() => {
    warehoseChartInstance?.resize({
      height: warehouseRefWidth,
    });
  }, [warehouseRefWidth]);

  return (
    <div className={styles.content}>
      <div ref={warehouseRef} style={{ width: '100%' }}></div>
    </div>
  );
};

export default StockWareHouse;