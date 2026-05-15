/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useState } from 'react';
import { Card, Spin } from '@douyinfe/semi-ui';
import { API, showError, toBoolean } from '../../helpers';
import SettingsAff from '../../pages/Setting/Operation/SettingsAff';
import AffReportPanel from '../../pages/Setting/Operation/AffReportPanel';

const SCHEMA = {
  AffRegisterRequired: false,
  AffRegisterLimit: 0,
  AffRebateEnabled: true,
  AffRebateRatio: '0.10',
  AffRebateWaitDays: 30,
};

const AffiliateSetting = () => {
  const [inputs, setInputs] = useState(SCHEMA);
  const [loading, setLoading] = useState(false);

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      const newInputs = { ...SCHEMA };
      data.forEach((item) => {
        if (Object.keys(SCHEMA).includes(item.key)) {
          if (typeof SCHEMA[item.key] === 'boolean') {
            newInputs[item.key] = toBoolean(item.value);
          } else if (typeof SCHEMA[item.key] === 'number') {
            const num = Number(item.value);
            newInputs[item.key] = Number.isFinite(num)
              ? num
              : SCHEMA[item.key];
          } else {
            newInputs[item.key] = item.value;
          }
        }
      });
      setInputs(newInputs);
    } else {
      showError(message);
    }
  };

  async function onRefresh() {
    try {
      setLoading(true);
      await getOptions();
    } catch (e) {
      showError('刷新失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <Spin spinning={loading} size='large'>
      {/* 设置 */}
      <Card style={{ marginTop: '10px' }}>
        <SettingsAff options={inputs} refresh={onRefresh} />
      </Card>
      {/* 报表 */}
      <Card style={{ marginTop: '10px' }} title='邀请返利报表'>
        <AffReportPanel />
      </Card>
    </Spin>
  );
};

export default AffiliateSetting;
