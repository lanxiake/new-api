import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAffStats,
  getAffInvitees,
  getAffRebates,
  transferAffQuota,
  type AffRebateStatus,
} from './api'

// 邀请页统计概览
export function useAffStats() {
  return useQuery({
    queryKey: ['aff-stats'],
    queryFn: getAffStats,
    staleTime: 30_000,
  })
}

// 邀请记录（被邀请人列表）
export function useAffInvitees(page: number, pageSize = 10) {
  return useQuery({
    queryKey: ['aff-invitees', page, pageSize],
    queryFn: () => getAffInvitees(page, pageSize),
    staleTime: 30_000,
  })
}

// 返佣明细
export function useAffRebates(
  page: number,
  pageSize = 10,
  status?: AffRebateStatus
) {
  return useQuery({
    queryKey: ['aff-rebates', page, pageSize, status],
    queryFn: () => getAffRebates(page, pageSize, status),
    staleTime: 30_000,
  })
}

// 划转
export function useTransferAffQuota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (quota: number) => transferAffQuota(quota),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aff-stats'] })
    },
  })
}
