import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SectionPageLayout } from '@/components/layout'
import {
  getSystemOptions,
  updateSystemOption,
} from '@/features/system-settings/api'

interface InviteSettings {
  AffRegisterRequired: boolean
  AffRebateEnabled: boolean
  AffRebateRatio: string
  AffRebateWaitDays: string
}

export function AdminAffSettings() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<InviteSettings>({
    AffRegisterRequired: false,
    AffRebateEnabled: false,
    AffRebateRatio: '0.10',
    AffRebateWaitDays: '30',
  })

  useEffect(() => {
    getSystemOptions()
      .then((res) => {
        if (!res?.success || !res.data) return
        const map: Record<string, string> = {}
        for (const item of res.data) {
          map[item.key] = item.value
        }
        setSettings({
          AffRegisterRequired: map.AffRegisterRequired === 'true',
          AffRebateEnabled: map.AffRebateEnabled === 'true',
          AffRebateRatio: map.AffRebateRatio ?? '0.10',
          AffRebateWaitDays: map.AffRebateWaitDays ?? '30',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async (key: keyof InviteSettings, value: boolean | string) => {
    setSaving(true)
    try {
      const res = await updateSystemOption({ key, value: String(value) })
      if (res.success) {
        toast.success(t('Setting updated successfully'))
        setSettings((s) => ({ ...s, [key]: value as never }))
      } else {
        toast.error(res.message || t('Failed to update setting'))
      }
    } catch (e) {
      toast.error((e as Error).message || t('Failed to update setting'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Invitation & Rebate Settings')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('Configure invitation registration and topup rebate behavior')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Content>
        <div className='bg-card max-w-2xl space-y-6 rounded-lg border p-6'>
          {/* Toggle: invite required */}
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1'>
              <Label className='text-sm font-medium'>
                {t('Require Invitation Code for Registration')}
              </Label>
              <p className='text-muted-foreground text-xs'>
                {t(
                  'When enabled, new users must provide a valid invitation code to register'
                )}
              </p>
            </div>
            <Switch
              disabled={loading || saving}
              checked={settings.AffRegisterRequired}
              onCheckedChange={(v) => save('AffRegisterRequired', v)}
            />
          </div>

          {/* Toggle: rebate enabled */}
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1'>
              <Label className='text-sm font-medium'>
                {t('Enable Topup Rebate')}
              </Label>
              <p className='text-muted-foreground text-xs'>
                {t(
                  'When enabled, every topup of an invitee triggers rebate to the inviter'
                )}
              </p>
            </div>
            <Switch
              disabled={loading || saving}
              checked={settings.AffRebateEnabled}
              onCheckedChange={(v) => save('AffRebateEnabled', v)}
            />
          </div>

          {/* Rebate ratio */}
          <div className='space-y-2'>
            <Label htmlFor='aff-ratio' className='text-sm font-medium'>
              {t('Rebate Ratio')}
            </Label>
            <div className='flex items-center gap-2'>
              <Input
                id='aff-ratio'
                type='number'
                step='0.01'
                min='0'
                max='1'
                value={settings.AffRebateRatio}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, AffRebateRatio: e.target.value }))
                }
                className='max-w-[200px]'
              />
              <Button
                size='sm'
                disabled={loading || saving}
                onClick={() => save('AffRebateRatio', settings.AffRebateRatio)}
              >
                {t('Save')}
              </Button>
            </div>
            <p className='text-muted-foreground text-xs'>
              {t('Range 0-1, e.g. 0.10 means 10%')}
            </p>
          </div>

          {/* Wait days */}
          <div className='space-y-2'>
            <Label htmlFor='aff-wait' className='text-sm font-medium'>
              {t('Settle Wait Days')}
            </Label>
            <div className='flex items-center gap-2'>
              <Input
                id='aff-wait'
                type='number'
                step='1'
                min='0'
                max='365'
                value={settings.AffRebateWaitDays}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    AffRebateWaitDays: e.target.value,
                  }))
                }
                className='max-w-[200px]'
              />
              <Button
                size='sm'
                disabled={loading || saving}
                onClick={() =>
                  save('AffRebateWaitDays', settings.AffRebateWaitDays)
                }
              >
                {t('Save')}
              </Button>
            </div>
            <p className='text-muted-foreground text-xs'>
              {t('Days to wait before pending rebate is settled')}
            </p>
          </div>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
