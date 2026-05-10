import { useTranslation } from 'react-i18next'
import {
  Coins as IconCoin,
  Clock3 as IconClockHour3,
  CheckCircle2 as IconCircleCheck,
  Users as IconUsersGroup,
  UserPlus as IconUserPlus,
  BarChart3 as IconChartBar,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatQuotaWithCurrency } from '@/lib/currency'
import { SectionPageLayout } from '@/components/layout'
import { useAffReport } from './hooks'

export function AdminAffReport() {
  const { t } = useTranslation()
  const { data, isLoading } = useAffReport()

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Invitation Rebate Report')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('Overview of invitation rebate statistics across all users')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Content>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <StatCard
            icon={<IconCoin className='h-4 w-4' />}
            label={t('Total Rebate')}
            value={
              isLoading
                ? '...'
                : formatQuotaWithCurrency(data?.stats.total_rebate ?? 0)
            }
          />
          <StatCard
            icon={<IconCircleCheck className='h-4 w-4 text-emerald-500' />}
            label={t('Settled Rebate')}
            value={
              isLoading
                ? '...'
                : formatQuotaWithCurrency(data?.stats.settled_rebate ?? 0)
            }
          />
          <StatCard
            icon={<IconClockHour3 className='h-4 w-4 text-amber-500' />}
            label={t('Pending Rebate')}
            value={
              isLoading
                ? '...'
                : formatQuotaWithCurrency(data?.stats.pending_rebate ?? 0)
            }
          />
          <StatCard
            icon={<IconUsersGroup className='h-4 w-4' />}
            label={t('Total Inviters')}
            value={isLoading ? '...' : String(data?.stats.total_inviters ?? 0)}
          />
          <StatCard
            icon={<IconUserPlus className='h-4 w-4' />}
            label={t('Total Invitees')}
            value={isLoading ? '...' : String(data?.stats.total_invitees ?? 0)}
          />
          <StatCard
            icon={<IconChartBar className='h-4 w-4' />}
            label={t('Total Records')}
            value={isLoading ? '...' : String(data?.stats.total_records ?? 0)}
          />
        </div>

        <div className='bg-card mt-6 rounded-lg border'>
          <div className='border-b px-4 py-3'>
            <h3 className='text-base font-semibold'>{t('Top 10 Inviters')}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-16'>{t('Rank')}</TableHead>
                <TableHead>{t('Username')}</TableHead>
                <TableHead className='text-right'>
                  {t('Total Rebate')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className='text-muted-foreground py-8 text-center'
                  >
                    {t('Loading...')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                (data?.top_inviters ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className='text-muted-foreground py-8 text-center'
                    >
                      {t('No data')}
                    </TableCell>
                  </TableRow>
                )}
              {(data?.top_inviters ?? []).map((row, idx) => (
                <TableRow key={row.inviter_id}>
                  <TableCell className='font-medium'>{idx + 1}</TableCell>
                  <TableCell>{row.username}</TableCell>
                  <TableCell className='text-right font-medium text-emerald-600'>
                    {formatQuotaWithCurrency(row.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className='bg-card rounded-lg border p-4'>
      <div className='text-muted-foreground mb-2 flex items-center gap-2 text-sm'>
        {icon}
        <span>{label}</span>
      </div>
      <div className='text-2xl font-semibold tracking-tight'>{value}</div>
    </div>
  )
}
