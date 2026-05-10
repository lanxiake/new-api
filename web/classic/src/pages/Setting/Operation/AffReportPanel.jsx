/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useState } from 'react';
import { Avatar, Card, Empty, Spin, Table, Typography } from '@douyinfe/semi-ui';
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Coins,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API, renderQuota } from '../../../helpers';

const { Text } = Typography;

const StatCard = ({ icon, label, value }) => (
  <Card className='!rounded-2xl border-0 shadow-sm'>
    <div className='flex items-center justify-between'>
      <div>
        <Text type='tertiary' className='text-xs'>
          {label}
        </Text>
        <div className='mt-2 text-2xl font-bold'>{value}</div>
      </div>
      <Avatar size='default' className='shadow'>
        {icon}
      </Avatar>
    </div>
  </Card>
);

export default function AffReportPanel() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/admin/aff/report');
      const { success, data } = res.data || {};
      if (success && data) {
        setData(data);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const stats = data?.stats || {};
  const top = data?.top_inviters || [];

  const columns = [
    {
      title: t('排名'),
      dataIndex: '__rank',
      width: 80,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: t('用户名'),
      dataIndex: 'username',
      render: (v, row) => v || `#${row.inviter_id}`,
    },
    {
      title: t('累计返利'),
      dataIndex: 'total',
      render: (v) => (
        <span className='font-medium text-emerald-600'>
          {renderQuota(v || 0)}
        </span>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-4'>
        <StatCard
          icon={<Coins size={16} />}
          label={t('总返利')}
          value={renderQuota(stats.total_rebate || 0)}
        />
        <StatCard
          icon={<CheckCircle2 size={16} className='text-emerald-600' />}
          label={t('已结算')}
          value={renderQuota(stats.settled_rebate || 0)}
        />
        <StatCard
          icon={<Clock3 size={16} className='text-amber-600' />}
          label={t('待结算')}
          value={renderQuota(stats.pending_rebate || 0)}
        />
        <StatCard
          icon={<Users size={16} />}
          label={t('邀请人数（独立）')}
          value={stats.total_inviters || 0}
        />
        <StatCard
          icon={<UserPlus size={16} />}
          label={t('被邀请人数')}
          value={stats.total_invitees || 0}
        />
        <StatCard
          icon={<BarChart3 size={16} />}
          label={t('返利记录数')}
          value={stats.total_records || 0}
        />
      </div>

      <Card
        className='!rounded-2xl border-0 shadow-sm'
        title={<Text strong>{t('Top 10 邀请人')}</Text>}
      >
        <Table
          columns={columns}
          dataSource={top}
          rowKey='inviter_id'
          pagination={false}
          empty={<Empty description={t('暂无数据')} />}
        />
      </Card>
    </Spin>
  );
}
