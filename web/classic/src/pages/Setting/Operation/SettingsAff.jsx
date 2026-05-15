/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Form, Row, Spin, Typography } from '@douyinfe/semi-ui';
import {
  API,
  compareObjects,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

const KEYS = {
  AffRegisterRequired: false,
  AffRegisterLimit: 0,
  AffRebateEnabled: true,
  AffRebateRatio: '0.10',
  AffRebateWaitDays: 30,
};

export default function SettingsAff(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(KEYS);
  const [inputsRow, setInputsRow] = useState(KEYS);
  const refForm = useRef();

  function handleFieldChange(fieldName) {
    return (value) => {
      // Semi InputNumber 清空时回调 null，用默认值兜底避免发送无效值
      const safeValue =
        value === null || value === undefined ? KEYS[fieldName] : value;
      setInputs((s) => ({ ...s, [fieldName]: safeValue }));
    };
  }

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
    const requests = updateArray.map((item) => {
      const val = inputs[item.key];
      const value =
        typeof val === 'boolean' ? String(val) : val == null ? '' : String(val);
      return API.put('/api/option/', { key: item.key, value });
    });
    setLoading(true);
    Promise.all(requests)
      .then((res) => {
        if (res.includes(undefined)) {
          return showError(t('部分保存失败，请重试'));
        }
        showSuccess(t('保存成功'));
        props.refresh && props.refresh();
      })
      .catch(() => {
        showError(t('保存失败，请重试'));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    const currentInputs = { ...KEYS };
    for (const key in props.options || {}) {
      if (Object.keys(KEYS).includes(key)) {
        const raw = props.options[key];
        if (typeof KEYS[key] === 'boolean') {
          currentInputs[key] = raw === true || raw === 'true';
        } else if (typeof KEYS[key] === 'number') {
          const num = Number(raw);
          currentInputs[key] = Number.isFinite(num) ? num : KEYS[key];
        } else {
          currentInputs[key] = raw ?? KEYS[key];
        }
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current && refForm.current.setValues(currentInputs);
  }, [props.options]);

  return (
    <Spin spinning={loading}>
      <Form
        values={inputs}
        getFormApi={(formAPI) => (refForm.current = formAPI)}
        style={{ marginBottom: 15 }}
      >
        <Form.Section text={t('邀请注册与返利')}>
          <Typography.Text
            type='tertiary'
            style={{ marginBottom: 16, display: 'block' }}
          >
            {t('配置邀请注册门槛与好友充值返利比例')}
          </Typography.Text>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.Switch
                field='AffRegisterRequired'
                label={t('注册必须填写邀请码')}
                size='default'
                checkedText='｜'
                uncheckedText='〇'
                onChange={handleFieldChange('AffRegisterRequired')}
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='AffRegisterLimit'
                label={t('每个邀请码注册上限（0 为不限）')}
                placeholder='0'
                onChange={handleFieldChange('AffRegisterLimit')}
                min={0}
                step={1}
                precision={0}
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.Switch
                field='AffRebateEnabled'
                label={t('开启充值返利')}
                size='default'
                checkedText='｜'
                uncheckedText='〇'
                onChange={handleFieldChange('AffRebateEnabled')}
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='AffRebateRatio'
                label={t('返利比例 (0-1)')}
                placeholder={t('如 0.10 表示 10%')}
                onChange={handleFieldChange('AffRebateRatio')}
                min={0}
                max={1}
                step={0.01}
                disabled={!inputs.AffRebateEnabled}
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='AffRebateWaitDays'
                label={t('待结算天数')}
                placeholder={t('好友充值后多少天解冻')}
                onChange={handleFieldChange('AffRebateWaitDays')}
                min={0}
                max={365}
                step={1}
                disabled={!inputs.AffRebateEnabled}
              />
            </Col>
          </Row>

          <Row>
            <Button size='default' onClick={onSubmit}>
              {t('保存邀请返利设置')}
            </Button>
          </Row>
        </Form.Section>
      </Form>
    </Spin>
  );
}
