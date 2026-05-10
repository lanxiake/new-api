import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Copy as IconCopy,
  Users as IconUsers,
  Clock3 as IconClockHour3,
  CheckCircle2 as IconCircleCheck,
  TrendingUp as IconTrendingUp,
  BarChart3 as IconChartBar,
  Gift as IconGift,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { formatQuotaWithCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

import { SectionPageLayout } from '@/components/layout'
import {
  useAffStats,
  useAffInvitees,
  useAffRebates,
  useTransferAffQuota,
} from './hooks'
import type { AffRebateRow } from './api'

export function InviteRewards() {
  const { t } = useTranslation()
  const { data: stats, isLoading: statsLoading } = useAffStats()

  const inviteLink = useMemo(() => {
    if (!stats?.aff_code) return ''
    return `${window.location.origin}/sign-up?aff=${stats.aff_code}`
  }, [stats?.aff_code])

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Invite Rewards')}</SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('Invite friends to earn extra rewards')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Content>
        <div className='grid gap-4 md:grid-cols-3'>
          <div className='space-y-4 md:col-span-2'>
            <StatsHero stats={stats} loading={statsLoading} />
            <InviteLinkBar link={inviteLink} />
            <ListSection />
          </div>
          <div className='md:col-span-1'>
            <RewardRules ratio={stats?.rebate_ratio ?? 0} waitDays={stats?.rebate_wait_days ?? 30} />
          </div>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}

// ============================================================================
// Stats Hero
// ============================================================================

interface HeroProps {
  stats:
    | {
        aff_quota: number
        aff_pending_quota: number
        aff_history_quota: number
        aff_count: number
      }
    | undefined
  loading: boolean
}

function StatsHero({ stats, loading }: HeroProps) {
  const { t } = useTranslation()
  return (
    <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 p-6 text-white shadow-lg'>
      <div className='mb-5 flex items-start justify-between'>
        <div className='flex items-center gap-2'>
          <IconGift className='h-5 w-5' />
          <h3 className='text-base font-semibold'>{t('Earnings Summary')}</h3>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled
            className='border-white/30 bg-white/10 text-white hover:bg-white/20'
            title={t('Coming soon')}
          >
            {t('Withdraw')}
          </Button>
          <TransferDialog
            availableQuota={stats?.aff_quota ?? 0}
            triggerLabel={t('Transfer to Balance')}
          />
        </div>
      </div>
      <div className='grid grid-cols-2 gap-6 sm:grid-cols-4'>
        <HeroItem
          icon={<IconCircleCheck className='h-4 w-4 opacity-80' />}
          label={t('Available Earnings')}
          value={loading ? '...' : formatQuotaWithCurrency(stats?.aff_quota ?? 0)}
        />
        <HeroItem
          icon={<IconClockHour3 className='h-4 w-4 opacity-80' />}
          label={t('Pending')}
          value={loading ? '...' : formatQuotaWithCurrency(stats?.aff_pending_quota ?? 0)}
        />
        <HeroItem
          icon={<IconTrendingUp className='h-4 w-4 opacity-80' />}
          label={t('Total Earnings')}
          value={loading ? '...' : formatQuotaWithCurrency(stats?.aff_history_quota ?? 0)}
        />
        <HeroItem
          icon={<IconUsers className='h-4 w-4 opacity-80' />}
          label={t('Invitees')}
          value={loading ? '...' : String(stats?.aff_count ?? 0)}
        />
      </div>
    </div>
  )
}

function HeroItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-1.5 text-xs opacity-90'>
        {icon}
        <span>{label}</span>
      </div>
      <div className='text-2xl font-semibold tracking-tight'>{value}</div>
    </div>
  )
}

// ============================================================================
// Invite Link Bar
// ============================================================================

function InviteLinkBar({ link }: { link: string }) {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()

  return (
    <div className='bg-card flex items-center gap-3 rounded-lg border p-4'>
      <span className='text-muted-foreground shrink-0 text-sm'>{t('Invite Link')}</span>
      <Input readOnly value={link} className='flex-1 bg-muted/40' />
      <Button onClick={() => copyToClipboard(link)} disabled={!link}>
        <IconCopy className='mr-1 h-4 w-4' />
        {t('Copy')}
      </Button>
    </div>
  )
}

// ============================================================================
// Tabs: Invitees / Rebates
// ============================================================================

function ListSection() {
  const { t } = useTranslation()
  return (
    <Tabs defaultValue='invitees' className='w-full'>
      <TabsList>
        <TabsTrigger value='invitees'>
          <IconUsers className='mr-1 h-4 w-4' />
          {t('Invitation Records')}
        </TabsTrigger>
        <TabsTrigger value='rebates'>
          <IconChartBar className='mr-1 h-4 w-4' />
          {t('Rebate Details')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value='invitees'>
        <InviteesTab />
      </TabsContent>
      <TabsContent value='rebates'>
        <RebatesTab />
      </TabsContent>
    </Tabs>
  )
}

function InviteesTab() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { data, isLoading } = useAffInvitees(page, pageSize)

  return (
    <div className='bg-card rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('User')}</TableHead>
            <TableHead className='text-right'>{t('Total Contribution')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={2} className='text-muted-foreground py-8 text-center'>
                {t('Loading...')}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (data?.items ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className='text-muted-foreground py-8 text-center'>
                {t('No data')}
              </TableCell>
            </TableRow>
          )}
          {(data?.items ?? []).map((row) => (
            <TableRow key={row.invitee_id}>
              <TableCell>{row.username}</TableCell>
              <TableCell className='text-right font-medium text-emerald-600'>
                {formatQuotaWithCurrency(row.total_rebate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        onChange={setPage}
      />
    </div>
  )
}

function RebatesTab() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { data, isLoading } = useAffRebates(page, pageSize)

  return (
    <div className='bg-card rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Rebate Amount')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead>{t('Created Time')}</TableHead>
            <TableHead>{t('Settle Time')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4} className='text-muted-foreground py-8 text-center'>
                {t('Loading...')}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (data?.items ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className='text-muted-foreground py-8 text-center'>
                {t('No data')}
              </TableCell>
            </TableRow>
          )}
          {(data?.items ?? []).map((row: AffRebateRow) => (
            <TableRow key={row.id}>
              <TableCell className='font-medium text-emerald-600'>
                {formatQuotaWithCurrency(row.rebate_quota)}
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell className='text-muted-foreground text-sm'>
                {formatTs(row.created_at)}
              </TableCell>
              <TableCell className='text-muted-foreground text-sm'>
                {row.status === 'settled' && row.settled_at > 0
                  ? formatTs(row.settled_at)
                  : t('{{time}} (estimated)', { time: formatTs(row.settle_at) })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        onChange={setPage}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: AffRebateRow['status'] }) {
  const { t } = useTranslation()
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    settled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  }
  const labels: Record<string, string> = {
    pending: t('Pending'),
    settled: t('Settled'),
    cancelled: t('Cancelled'),
  }
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
        styles[status] ?? ''
      )}
    >
      {labels[status] ?? status}
    </span>
  )
}

function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (n: number) => void
}) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  return (
    <div className='flex items-center justify-between border-t px-3 py-2 text-sm'>
      <span className='text-muted-foreground'>
        {t('Total {{count}}', { count: total })}
      </span>
      <div className='flex items-center gap-2'>
        <Button
          size='sm'
          variant='outline'
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          {t('Previous')}
        </Button>
        <span className='text-muted-foreground'>
          {page} / {totalPages}
        </span>
        <Button
          size='sm'
          variant='outline'
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          {t('Next')}
        </Button>
      </div>
    </div>
  )
}

function formatTs(ts: number): string {
  if (!ts || ts <= 0) return '-'
  const d = new Date(ts * 1000)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ============================================================================
// Reward Rules
// ============================================================================

function RewardRules({ ratio, waitDays }: { ratio: number; waitDays: number }) {
  const { t } = useTranslation()
  const ratioPct = Math.round(ratio * 10000) / 100

  const items = [
    t('Current rebate ratio: {{ratio}}%', { ratio: ratioPct }),
    t('Invite friends to register, earn rewards when they top up'),
    t('Rewards enter pending, auto-unlock after {{days}} days', { days: waitDays }),
    t('Transfer turns rewards into your account balance'),
    t('Withdraw to Alipay/WeChat (coming soon)'),
    t('More invitees, more rewards'),
  ]

  return (
    <div className='bg-card h-full rounded-lg border p-5'>
      <h3 className='mb-4 text-base font-semibold'>{t('Reward Rules')}</h3>
      <ul className='space-y-2.5'>
        {items.map((it, idx) => (
          <li key={idx} className='flex items-start gap-2 text-sm'>
            <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500' />
            <span className='text-muted-foreground'>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ============================================================================
// Transfer Dialog
// ============================================================================

function TransferDialog({
  triggerLabel,
  availableQuota,
}: {
  triggerLabel: string
  availableQuota: number
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const transfer = useTransferAffQuota()

  const handleSubmit = async () => {
    const q = parseInt(amount, 10)
    if (isNaN(q) || q <= 0) {
      toast.error(t('Please enter a valid amount'))
      return
    }
    if (q > availableQuota) {
      toast.error(t('Insufficient available earnings'))
      return
    }
    try {
      await transfer.mutateAsync(q)
      toast.success(t('Transfer successful'))
      setOpen(false)
      setAmount('')
    } catch (e) {
      toast.error((e as Error).message || t('Transfer failed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant='outline'
            size='sm'
            className='border-white/30 bg-white/15 text-white hover:bg-white/25'
          >
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Transfer to Balance')}</DialogTitle>
          <DialogDescription>
            {t('Available earnings: {{amount}}', {
              amount: formatQuotaWithCurrency(availableQuota),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className='py-2'>
          <Input
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('Amount in quota')}
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={transfer.isPending}>
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
