import { api } from '@/lib/api'

export interface AffReportStats {
  total_rebate: number
  pending_rebate: number
  settled_rebate: number
  total_inviters: number
  total_invitees: number
  total_records: number
}

export interface AffReportTopRow {
  inviter_id: number
  username: string
  total: number
}

export interface AffReportData {
  stats: AffReportStats
  top_inviters: AffReportTopRow[]
}

interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
}

export async function getAffReport(): Promise<AffReportData> {
  const res = await api.get<ApiEnvelope<AffReportData>>('/api/user/aff/report')
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message ?? 'Failed to fetch aff report')
  }
  return res.data.data
}
