// Append new i18n keys to web/classic/src/i18n/locales/{zh,en,zh-CN}.json
// Usage: node scripts/append-classic-i18n.mjs

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const LOCALES = path.join(ROOT, 'web', 'classic', 'src', 'i18n', 'locales');

// New zh keys -> { zh-value, en-value }
// key === zh-value (按 classic 约定)
const NEW = [
  // Sidebar & nav
  ['邀请奖励', '邀请奖励', 'Invite Rewards'],
  ['邀请返利', '邀请返利', 'Invitation Rebate'],

  // Invite Rewards page (most already exist; add the new ones)
  ['邀请好友注册并充值，您可获得相应比例的返利', '邀请好友注册并充值，您可获得相应比例的返利', 'Invite friends to register and top up, you will receive a percentage rebate'],
  ['可用余额', '可用余额', 'Available Balance'],
  ['待结算', '待结算', 'Pending'],
  ['历史总计', '历史总计', 'Lifetime Total'],
  ['邀请人数', '邀请人数', 'Invitees'],
  ['我的邀请链接', '我的邀请链接', 'My Invite Link'],
  ['链接', '链接', 'Link'],
  ['返利比例', '返利比例', 'Rebate Ratio'],
  ['待结算天数', '待结算天数', 'Settle Wait Days'],
  ['邀请记录', '邀请记录', 'Invite Records'],
  ['返利明细', '返利明细', 'Rebate Details'],
  ['暂无邀请记录', '暂无邀请记录', 'No invite records yet'],
  ['暂无返利记录', '暂无返利记录', 'No rebate records yet'],
  ['被邀请人', '被邀请人', 'Invitee'],
  ['累计返利', '累计返利', 'Total Rebate'],
  ['被邀请人 ID', '被邀请人 ID', 'Invitee ID'],
  ['充值金额', '充值金额', 'Topup Quota'],
  ['返利金额', '返利金额', 'Rebate Quota'],
  ['比例', '比例', 'Ratio'],
  ['状态', '状态', 'Status'],
  ['产生时间', '产生时间', 'Created At'],
  ['应到账时间', '应到账时间', 'Settle At'],
  ['已到账', '已到账', 'Settled'],
  ['待到账', '待到账', 'Pending'],
  ['已取消', '已取消', 'Cancelled'],
  ['获取邀请信息失败', '获取邀请信息失败', 'Failed to fetch invite info'],
  ['邀请链接尚未生成', '邀请链接尚未生成', 'Invite link not generated yet'],
  ['奖励规则', '奖励规则', 'Reward Rules'],
  ['邀请好友注册并充值，您可获得对应比例的返利积分', '邀请好友注册并充值，您可获得对应比例的返利积分', 'Invite friends to register and top up, you earn corresponding rebate'],
  ['返利将在好友充值后冻结，过待结算天数后自动到账您的可用余额', '返利将在好友充值后冻结，过待结算天数后自动到账您的可用余额', 'Rebates are frozen after invitee tops up and unlocked into your available balance after the settle wait days'],
  ['您可将可用余额随时划转到账户主余额用于消费', '您可将可用余额随时划转到账户主余额用于消费', 'You can transfer available balance to main account at any time'],
  ['划转成功', '划转成功', 'Transfer succeeded'],
  ['划转失败', '划转失败', 'Transfer failed'],
  ['划转失败，请稍后重试', '划转失败，请稍后重试', 'Transfer failed, please try again later'],

  // Admin settings/report
  ['邀请注册与返利', '邀请注册与返利', 'Invite Registration & Rebate'],
  ['配置邀请注册门槛与好友充值返利比例', '配置邀请注册门槛与好友充值返利比例', 'Configure invite registration requirement and rebate ratio'],
  ['注册必须填写邀请码', '注册必须填写邀请码', 'Require Invite Code for Registration'],
  ['开启充值返利', '开启充值返利', 'Enable Topup Rebate'],
  ['返利比例 (0-1)', '返利比例 (0-1)', 'Rebate Ratio (0-1)'],
  ['如 0.10 表示 10%', '如 0.10 表示 10%', 'e.g. 0.10 means 10%'],
  ['好友充值后多少天解冻', '好友充值后多少天解冻', 'Days after invitee topup to settle'],
  ['保存邀请返利设置', '保存邀请返利设置', 'Save Invite & Rebate Settings'],
  ['邀请返利报表', '邀请返利报表', 'Invitation Rebate Report'],
  ['总返利', '总返利', 'Total Rebate'],
  ['已结算', '已结算', 'Settled'],
  ['邀请人数（独立）', '邀请人数（独立）', 'Total Inviters'],
  ['被邀请人数', '被邀请人数', 'Total Invitees'],
  ['返利记录数', '返利记录数', 'Total Records'],
  ['Top 10 邀请人', 'Top 10 邀请人', 'Top 10 Inviters'],
  ['排名', '排名', 'Rank'],
  ['用户名', '用户名', 'Username'],
  ['暂无数据', '暂无数据', 'No data'],

  // Register page
  ['邀请码（必填）', '邀请码（必填）', 'Invite Code (Required)'],
  ['邀请码（选填）', '邀请码（选填）', 'Invite Code (Optional)'],
  ['请输入邀请码', '请输入邀请码', 'Enter invite code'],
  ['邀请码已通过链接锁定', '邀请码已通过链接锁定', 'Invite code locked from link'],
  ['当前系统仅支持邀请注册，请填写邀请码', '当前系统仅支持邀请注册，请填写邀请码', 'Registration requires a valid invite code'],
  ['邀请码无效，请检查后再试', '邀请码无效，请检查后再试', 'Invalid invite code'],
];

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

function ensureKeys(filePath, lang) {
  if (!fs.existsSync(filePath)) {
    console.log(`skip (missing): ${filePath}`);
    return;
  }
  const obj = loadJson(filePath);
  if (!obj.translation) obj.translation = {};
  let added = 0;
  for (const [key, zh, en] of NEW) {
    const value = lang === 'en' ? en : zh;
    if (obj.translation[key] === undefined) {
      obj.translation[key] = value;
      added++;
    }
  }
  saveJson(filePath, obj);
  console.log(`${path.basename(filePath)}: added ${added} keys`);
}

ensureKeys(path.join(LOCALES, 'zh.json'), 'zh');
ensureKeys(path.join(LOCALES, 'zh-CN.json'), 'zh');
ensureKeys(path.join(LOCALES, 'zh-TW.json'), 'zh');
ensureKeys(path.join(LOCALES, 'en.json'), 'en');
ensureKeys(path.join(LOCALES, 'ja.json'), 'en');
ensureKeys(path.join(LOCALES, 'fr.json'), 'en');
ensureKeys(path.join(LOCALES, 'ru.json'), 'en');
ensureKeys(path.join(LOCALES, 'vi.json'), 'en');
