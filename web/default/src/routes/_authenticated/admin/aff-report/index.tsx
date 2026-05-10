import { createFileRoute } from '@tanstack/react-router'
import { AdminAffReport } from '@/features/admin-aff-report'

export const Route = createFileRoute('/_authenticated/admin/aff-report/')({
  component: AdminAffReport,
})
