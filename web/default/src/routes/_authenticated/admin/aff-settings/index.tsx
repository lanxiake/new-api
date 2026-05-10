import { createFileRoute } from '@tanstack/react-router'
import { AdminAffSettings } from '@/features/admin-aff-settings'

export const Route = createFileRoute('/_authenticated/admin/aff-settings/')({
  component: AdminAffSettings,
})
