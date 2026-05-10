import { useQuery } from '@tanstack/react-query'
import { getAffReport } from './api'

export function useAffReport() {
  return useQuery({
    queryKey: ['aff-report'],
    queryFn: getAffReport,
    staleTime: 60_000,
  })
}
