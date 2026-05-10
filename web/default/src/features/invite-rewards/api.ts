import { api } from '@/lib/api'

// ============================================================================
// Types
// ============================================================================

export interface AffStats {
  aff_code: string
  aff_quota: number
  aff_pending_quota: number
  aff_history_quota: number
  aff_count: number
  rebate_ratio: number
  rebate_wait_days: number
  rebate_enabled: boolean
}

export interface AffInviteeRow {
  invitee_id: number
  username: string
  total_rebate: number
}

export type AffRebateStatus = 'pending' | 'settled' | 'cancelled'

export interface AffRebateRow {
  id: number
  invitee_id: number
  topup_id: number
  topup_quota: number
  rebate_quota: number
  rebate_ratio: number
  status: AffRebateStatus
  created_at: number
  settle_at: number
  settled_at: number
}

export interface PageResponse<T> {
  page: number
  page_size: number
  total: number
  items: T[]
}

interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
}

// ============================================================================
// API Functions
// ============================================================================

export async function getAffStats(): Promise<AffStats> {
  const res = await api.get<ApiEnvelope<AffStats>>('/api/user/aff/stats')
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message ?? 'Failed to fetch aff stats')
  }
  return res.data.data
}

export async function getAffInvitees(
  page: number,
  pageSize: number
): Promise<PageResponse<AffInviteeRow>> {
  const res = await api.get<ApiEnvelope<PageResponse<AffInviteeRow>>>(
    '/api/user/aff/invitees',
    { params: { p: page, page_size: pageSize } }
  )
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message ?? 'Failed to fetch invitees')
  }
  return res.data.data
}

export async function getAffRebates(
  page: number,
  pageSize: number,
  status?: AffRebateStatus
): Promise<PageResponse<AffRebateRow>> {
  const res = await api.get<ApiEnvelope<PageResponse<AffRebateRow>>>(
    '/api/user/aff/rebates',
    {
      params: {
        p: page,
        page_size: pageSize,
        ...(status ? { status } : {}),
      },
    }
  )
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message ?? 'Failed to fetch rebates')
  }
  return res.data.data
}

export async function transferAffQuota(quota: number): Promise<void> {
  const res = await api.post<ApiEnvelope<unknown>>('/api/user/aff_transfer', {
    quota,
  })
  if (!res.data.success) {
    throw new Error(res.data.message ?? 'Transfer failed')
  }
}

export async function checkAffCode(code: string): Promise<boolean> {
  const res = await api.get<ApiEnvelope<{ valid: boolean }>>(
    '/api/user/aff/check',
    { params: { code } }
  )
  return res.data.data?.valid === true
}
