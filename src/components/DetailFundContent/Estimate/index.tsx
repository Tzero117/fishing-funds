import React, { useState, useEffect } from 'react';
import { useRequest, useSize } from 'ahooks';

import PictureImage from '@/assets/img/picture.svg';
import * as Services from '@/services';
import styles from './index.scss';

export interface EstimateProps {
  code: string;
}

const Estimate: React.FC<EstimateProps> = ({ code }) => {
  const [estimate, setEstimate] = useState(PictureImage);
  useRequest(Services.Fund.GetEstimatedFromEastmoney, {
    defaultParams: [code],
    onSuccess: setEstimate,
  });

  return (
    <div className={styles.estimate}>
      <img src={estimate} />
    </div>
  );
};

export default Estimate;