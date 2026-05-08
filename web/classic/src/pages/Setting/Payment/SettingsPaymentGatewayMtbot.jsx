/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useState, useRef } from 'react';
import { Banner, Button, Form, Row, Col, Spin } from '@douyinfe/semi-ui';
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

export default function SettingsPaymentGatewayMtbot(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle ? undefined : t('Mtbot 支付宝设置');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    MtbotEnabled: false,
    MtbotTopupSecret: '',
    MtbotTopupURL: 'https://www.mtbot.top/api/pay/topup',
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        MtbotEnabled:
          props.options.MtbotEnabled !== undefined
            ? props.options.MtbotEnabled
            : false,
        MtbotTopupSecret: props.options.MtbotTopupSecret || '',
        MtbotTopupURL:
          props.options.MtbotTopupURL ||
          'https://www.mtbot.top/api/pay/topup',
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitMtbotSetting = async () => {
    setLoading(true);
    try {
      const options = [];

      if (
        originInputs['MtbotEnabled'] !== inputs.MtbotEnabled &&
        inputs.MtbotEnabled !== undefined
      ) {
        options.push({
          key: 'MtbotEnabled',
          value: inputs.MtbotEnabled ? 'true' : 'false',
        });
      }
      if (inputs.MtbotTopupSecret && inputs.MtbotTopupSecret !== '') {
        options.push({
          key: 'MtbotTopupSecret',
          value: inputs.MtbotTopupSecret,
        });
      }
      if (inputs.MtbotTopupURL !== undefined && inputs.MtbotTopupURL !== '') {
        options.push({ key: 'MtbotTopupURL', value: inputs.MtbotTopupURL });
      }

      if (options.length === 0) {
        showSuccess(t('无需更新'));
        setLoading(false);
        return;
      }

      const requestQueue = options.map((opt) =>
        API.put('/api/option/', { key: opt.key, value: opt.value }),
      );

      const results = await Promise.all(requestQueue);
      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => showError(res.data.message));
      } else {
        showSuccess(t('更新成功'));
        setOriginInputs({ ...inputs });
        props.refresh?.();
      }
    } catch (error) {
      showError(t('更新失败'));
    }
    setLoading(false);
  };

  return (
    <Spin spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={sectionTitle}>
          <Banner
            type='info'
            icon={<BookOpen size={16} />}
            description={t(
              '启用后，用户可在钱包页面直接跳转 Mtbot 支付宝充值页完成充值。签名密钥须与 Mtbot 服务端的 TOPUP_SIGN_SECRET 保持一致。',
            )}
            style={{ marginBottom: 16 }}
          />
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='MtbotEnabled'
                size='default'
                checkedText='｜'
                uncheckedText='〇'
                label={t('启用 Mtbot 支付宝直连充值')}
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='MtbotTopupSecret'
                label={t('HMAC-SHA256 签名密钥')}
                placeholder={t('留空表示保持当前不变')}
                extraText={t(
                  '必须与 Mtbot 服务端 TOPUP_SIGN_SECRET 完全一致，保存后不会回显',
                )}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='MtbotTopupURL'
                label={t('充值页入口 URL')}
                placeholder='https://www.mtbot.top/api/pay/topup'
                extraText={t('留空则使用默认地址')}
              />
            </Col>
          </Row>
          <Button onClick={submitMtbotSetting}>
            {t('更新 Mtbot 设置')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}
