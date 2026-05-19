/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Layout,
  Modal,
  Space,
  Spin,
  Table,
  TabPane,
  Tabs,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import {
  BarChart2,
  Clock3,
  Copy,
  CreditCard,
  Gift,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  API,
  copy,
  getQuotaPerUnit,
  isAdmin,
  renderQuota,
  showError,
  showSuccess,
  timestamp2string,
} from '../../helpers';
import { UserContext } from '../../context/User';

const { Text, Title } = Typography;

const PAGE_SIZE = 10;

const StatBlock = ({ icon, label, value, accent, onClick }) => (
  <Card
    className={`!rounded-2xl border-0 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className='flex items-center justify-between'>
      <div>
        <Text type='tertiary' className='text-xs'>
          {label}
        </Text>
        <div className={`mt-2 text-2xl font-bold ${accent || ''}`}>{value}</div>
      </div>
      <Avatar size='default' className={`shadow ${accent || ''}`}>
        {icon}
      </Avatar>
    </div>
  </Card>
);

const RebateStatusTag = ({ status, t }) => {
  if (status === 'settled') {
    return <Tag color='green'>{t('已到账')}</Tag>;
  }
  if (status === 'pending') {
    return <Tag color='orange'>{t('待到账')}</Tag>;
  }
  if (status === 'cancelled') {
    return <Tag color='grey'>{t('已取消')}</Tag>;
  }
  return <Tag>{status}</Tag>;
};

const InviteRewardsPage = () => {
  const { t } = useTranslation();
  const [userState] = useContext(UserContext);

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [affLink, setAffLink] = useState('');

  const [tab, setTab] = useState('invitees');

  // Invitees list
  const [invitees, setInvitees] = useState([]);
  const [inviteesPage, setInviteesPage] = useState(1);
  const [inviteesTotal, setInviteesTotal] = useState(0);
  const [inviteesLoading, setInviteesLoading] = useState(false);

  // Rebates list
  const [rebates, setRebates] = useState([]);
  const [rebatesPage, setRebatesPage] = useState(1);
  const [rebatesTotal, setRebatesTotal] = useState(0);
  const [rebatesLoading, setRebatesLoading] = useState(false);

  // Transfer modal
  const [openTransfer, setOpenTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferring, setTransferring] = useState(false);

  // 我邀请的用户列表（基于 users.inviter_id，含未充值用户）
  const [openInvitedUsers, setOpenInvitedUsers] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [invitedUsersPage, setInvitedUsersPage] = useState(1);
  const [invitedUsersTotal, setInvitedUsersTotal] = useState(0);
  const [invitedUsersLoading, setInvitedUsersLoading] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await API.get('/api/user/aff/stats');
      const { success, data, message } = res.data || {};
      if (success && data) {
        setStats(data);
        if (data.aff_code) {
          setAffLink(`${window.location.origin}/register?aff=${data.aff_code}`);
        }
      } else if (message) {
        // 老接口可能不存在，回退到 /api/user/aff
        const res2 = await API.get('/api/user/aff');
        const { success: s2, data: d2 } = res2.data || {};
        if (s2 && d2) {
          setAffLink(`${window.location.origin}/register?aff=${d2}`);
        }
      }
    } catch (e) {
      // 静默失败：仍尝试老接口
      try {
        const res2 = await API.get('/api/user/aff');
        const { success: s2, data: d2 } = res2.data || {};
        if (s2 && d2) {
          setAffLink(`${window.location.origin}/register?aff=${d2}`);
        }
      } catch (_) {
        showError(t('获取邀请信息失败'));
      }
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchInvitees = async (page) => {
    setInviteesLoading(true);
    try {
      const res = await API.get(
        `/api/user/aff/invitees?p=${page}&page_size=${PAGE_SIZE}`,
      );
      const { success, data } = res.data || {};
      if (success && data) {
        setInvitees(data.items || []);
        setInviteesTotal(data.total || 0);
      }
    } catch (e) {
      // ignore
    } finally {
      setInviteesLoading(false);
    }
  };

  const fetchRebates = async (page) => {
    setRebatesLoading(true);
    try {
      const res = await API.get(
        `/api/user/aff/rebates?p=${page}&page_size=${PAGE_SIZE}`,
      );
      const { success, data } = res.data || {};
      if (success && data) {
        setRebates(data.items || []);
        setRebatesTotal(data.total || 0);
      }
    } catch (e) {
      // ignore
    } finally {
      setRebatesLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === 'invitees') fetchInvitees(inviteesPage);
  }, [tab, inviteesPage]);

  useEffect(() => {
    if (tab === 'rebates') fetchRebates(rebatesPage);
  }, [tab, rebatesPage]);

  const fetchInvitedUsers = async (page) => {
    setInvitedUsersLoading(true);
    try {
      const res = await API.get(
        `/api/user/aff/users?p=${page}&page_size=${PAGE_SIZE}`,
      );
      const { success, data } = res.data || {};
      if (success && data) {
        setInvitedUsers(data.items || []);
        setInvitedUsersTotal(data.total || 0);
      }
    } catch (e) {
      // ignore
    } finally {
      setInvitedUsersLoading(false);
    }
  };

  const openInvitedUsersDialog = () => {
    setInvitedUsersPage(1);
    setOpenInvitedUsers(true);
    fetchInvitedUsers(1);
  };

  useEffect(() => {
    if (openInvitedUsers) fetchInvitedUsers(invitedUsersPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitedUsersPage]);

  const aff = stats || {
    aff_quota: userState?.user?.aff_quota || 0,
    aff_pending_quota: userState?.user?.aff_pending_quota || 0,
    aff_history_quota: userState?.user?.aff_history_quota || 0,
    aff_count: userState?.user?.aff_count || 0,
    rebate_ratio: 0,
    rebate_wait_days: 30,
    rebate_enabled: true,
  };

  const handleCopyLink = async () => {
    if (!affLink) {
      showError(t('邀请链接尚未生成'));
      return;
    }
    await copy(affLink);
    showSuccess(t('邀请链接已复制到剪切板'));
  };

  const openTransferDialog = () => {
    setTransferAmount(getQuotaPerUnit());
    setOpenTransfer(true);
  };

  const submitTransfer = async () => {
    if (!transferAmount || transferAmount < getQuotaPerUnit()) {
      showError(t('划转金额最低为') + ' ' + renderQuota(getQuotaPerUnit()));
      return;
    }
    setTransferring(true);
    try {
      const res = await API.post('/api/user/aff_transfer', {
        quota: transferAmount,
      });
      const { success, message } = res.data || {};
      if (success) {
        showSuccess(message || t('划转成功'));
        setOpenTransfer(false);
        fetchStats();
      } else {
        showError(message || t('划转失败'));
      }
    } catch (e) {
      showError(t('划转失败，请稍后重试'));
    } finally {
      setTransferring(false);
    }
  };

  const inviteesColumns = [
    {
      title: t('被邀请人'),
      dataIndex: 'username',
      render: (v, row) => v || `#${row.invitee_id}`,
    },
    {
      title: t('累计返利'),
      dataIndex: 'total_rebate',
      render: (v) => (
        <span className='font-medium text-emerald-600'>
          {renderQuota(v || 0)}
        </span>
      ),
    },
  ];

  const rebatesColumns = [
    {
      title: t('被邀请人 ID'),
      dataIndex: 'invitee_id',
      width: 120,
    },
    {
      title: t('充值金额'),
      dataIndex: 'topup_quota',
      render: (v) => renderQuota(v || 0),
    },
    {
      title: t('返利金额'),
      dataIndex: 'rebate_quota',
      render: (v) => (
        <span className='font-medium text-emerald-600'>
          {renderQuota(v || 0)}
        </span>
      ),
    },
    {
      title: t('比例'),
      dataIndex: 'rebate_ratio',
      width: 100,
      render: (v) => `${((v || 0) * 100).toFixed(1)}%`,
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 100,
      render: (v) => <RebateStatusTag status={v} t={t} />,
    },
    {
      title: t('产生时间'),
      dataIndex: 'created_at',
      render: (v) => (v ? timestamp2string(v) : '-'),
    },
    {
      title: t('应到账时间'),
      dataIndex: 'settle_at',
      render: (v) => (v ? timestamp2string(v) : '-'),
    },
  ];

  return (
    <div className='mt-[60px] px-2 pb-8'>
      <Layout>
        <Layout.Content>
          <Spin spinning={loadingStats} size='large'>
            {/* 顶部统计 */}
            <div className='mb-4'>
              <div className='flex items-center mb-3'>
                <Avatar size='default' color='green' className='mr-3 shadow-md'>
                  <Gift size={18} />
                </Avatar>
                <div>
                  <Title heading={4} className='!m-0'>
                    {t('邀请奖励')}
                  </Title>
                  <Text type='tertiary' className='text-xs'>
                    {t('邀请好友注册并充值，您可获得相应比例的返利')}
                  </Text>
                </div>
                <div className='ml-auto'>
                  <Button
                    theme='solid'
                    type='primary'
                    icon={<Zap size={14} />}
                    disabled={!aff.aff_quota || aff.aff_quota <= 0}
                    onClick={openTransferDialog}
                    className='!rounded-lg'
                  >
                    {t('划转到余额')}
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <StatBlock
                  icon={<TrendingUp size={16} className='text-emerald-600' />}
                  label={t('可用余额')}
                  value={renderQuota(aff.aff_quota || 0)}
                />
                <StatBlock
                  icon={<Clock3 size={16} className='text-amber-600' />}
                  label={t('待结算')}
                  value={renderQuota(aff.aff_pending_quota || 0)}
                />
                <StatBlock
                  icon={<BarChart2 size={16} className='text-sky-600' />}
                  label={t('历史总计')}
                  value={renderQuota(aff.aff_history_quota || 0)}
                />
                <StatBlock
                  icon={<Users size={16} className='text-violet-600' />}
                  label={t('邀请人数')}
                  value={aff.aff_count || 0}
                  onClick={
                    (aff.aff_count || 0) > 0 ? openInvitedUsersDialog : undefined
                  }
                />
              </div>
            </div>

            {/* 邀请链接 */}
            <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
              <div className='flex items-center mb-3'>
                <Text strong className='text-base'>
                  {t('我的邀请链接')}
                </Text>
              </div>
              <Input
                value={affLink}
                readonly
                className='!rounded-lg'
                prefix={t('链接')}
                suffix={
                  <Button
                    type='primary'
                    theme='solid'
                    onClick={handleCopyLink}
                    icon={<Copy size={14} />}
                    className='!rounded-lg'
                  >
                    {t('复制')}
                  </Button>
                }
              />
              {aff.rebate_enabled && (
                <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500'>
                  <span>
                    {t('返利比例')}：
                    <strong>
                      {((aff.rebate_ratio || 0) * 100).toFixed(1)}%
                    </strong>
                  </span>
                  <span>
                    {t('待结算天数')}：
                    <strong>{aff.rebate_wait_days || 30}</strong>
                  </span>
                </div>
              )}
            </Card>

            {/* 数据 Tab */}
            <Card className='!rounded-2xl shadow-sm border-0'>
              <Tabs
                type='line'
                activeKey={tab}
                onChange={(k) => setTab(k)}
              >
                <TabPane tab={t('邀请记录')} itemKey='invitees'>
                  <Table
                    columns={inviteesColumns}
                    dataSource={invitees}
                    loading={inviteesLoading}
                    rowKey={(r) => r.invitee_id}
                    pagination={{
                      currentPage: inviteesPage,
                      pageSize: PAGE_SIZE,
                      total: inviteesTotal,
                      onPageChange: (p) => setInviteesPage(p),
                    }}
                    empty={<Empty description={t('暂无邀请记录')} />}
                  />
                </TabPane>
                <TabPane tab={t('返利明细')} itemKey='rebates'>
                  <Table
                    columns={rebatesColumns}
                    dataSource={rebates}
                    loading={rebatesLoading}
                    rowKey='id'
                    pagination={{
                      currentPage: rebatesPage,
                      pageSize: PAGE_SIZE,
                      total: rebatesTotal,
                      onPageChange: (p) => setRebatesPage(p),
                    }}
                    empty={<Empty description={t('暂无返利记录')} />}
                  />
                </TabPane>
              </Tabs>
            </Card>

            {/* 规则说明 */}
            <Card
              className='!rounded-2xl shadow-sm border-0 mt-4'
              title={
                <Text type='tertiary' className='text-sm'>
                  {t('奖励规则')}
                </Text>
              }
            >
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <Badge dot type='success' />
                  <Text type='tertiary' className='text-sm'>
                    {t('邀请好友注册并充值，您可获得对应比例的返利积分')}
                  </Text>
                </div>
                <div className='flex items-start gap-2'>
                  <Badge dot type='success' />
                  <Text type='tertiary' className='text-sm'>
                    {t(
                      '返利将在好友充值后冻结，过待结算天数后自动到账您的可用余额',
                    )}
                  </Text>
                </div>
                <div className='flex items-start gap-2'>
                  <Badge dot type='success' />
                  <Text type='tertiary' className='text-sm'>
                    {t('您可将可用余额随时划转到账户主余额用于消费')}
                  </Text>
                </div>
              </div>
            </Card>
          </Spin>
        </Layout.Content>
      </Layout>

      {/* 划转弹窗 */}
      <Modal
        title={
          <div className='flex items-center'>
            <CreditCard className='mr-2' size={18} />
            {t('划转邀请额度')}
          </div>
        }
        visible={openTransfer}
        onOk={submitTransfer}
        onCancel={() => setOpenTransfer(false)}
        confirmLoading={transferring}
        maskClosable={false}
        centered
      >
        <div className='space-y-4'>
          <div>
            <Text strong className='block mb-2'>
              {t('可用邀请额度')}
            </Text>
            <Input
              value={renderQuota(aff.aff_quota || 0)}
              disabled
              className='!rounded-lg'
            />
          </div>
          <div>
            <Text strong className='block mb-2'>
              {t('划转额度')} · {t('最低') + renderQuota(getQuotaPerUnit())}
            </Text>
            <InputNumber
              min={getQuotaPerUnit()}
              max={aff.aff_quota || 0}
              value={transferAmount}
              onChange={(v) => setTransferAmount(v)}
              className='w-full !rounded-lg'
            />
          </div>
        </div>
      </Modal>

      {/* 我邀请的用户列表 */}
      <Modal
        title={
          <div className='flex items-center'>
            <Users className='mr-2' size={18} />
            {t('我邀请的用户')}
          </div>
        }
        visible={openInvitedUsers}
        onCancel={() => setOpenInvitedUsers(false)}
        footer={null}
        width={640}
        maskClosable
        centered
      >
        <Table
          columns={[
            {
              title: t('用户 ID'),
              dataIndex: 'id',
              width: 90,
            },
            {
              title: t('用户名'),
              dataIndex: 'username',
              render: (v, row) => v || `#${row.id}`,
            },
            {
              title: t('状态'),
              dataIndex: 'status',
              width: 90,
              render: (v) =>
                v === 1 ? (
                  <Tag color='green'>{t('已启用')}</Tag>
                ) : v === 2 ? (
                  <Tag color='red'>{t('已禁用')}</Tag>
                ) : (
                  <Tag>{v}</Tag>
                ),
            },
            {
              title: t('注册时间'),
              dataIndex: 'created_at',
              render: (v) => (v ? timestamp2string(v) : '-'),
            },
          ]}
          dataSource={invitedUsers}
          loading={invitedUsersLoading}
          rowKey='id'
          pagination={{
            currentPage: invitedUsersPage,
            pageSize: PAGE_SIZE,
            total: invitedUsersTotal,
            onPageChange: (p) => setInvitedUsersPage(p),
          }}
          empty={<Empty description={t('暂无邀请用户')} />}
        />
      </Modal>
    </div>
  );
};

export default InviteRewardsPage;
