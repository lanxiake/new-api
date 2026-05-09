import * as React from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useUpdateOption } from '../hooks/use-update-option'

const mtbotSchema = z.object({
  MtbotEnabled: z.boolean(),
  MtbotTopupSecret: z.string(),
  MtbotTopupURL: z.string(),
})

export type MtbotSettingsValues = z.infer<typeof mtbotSchema>

interface Props {
  defaultValues: MtbotSettingsValues
}

export function MtbotSettingsSection({ defaultValues }: Props) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const initialRef = React.useRef(defaultValues)
  const defaultsSignature = React.useMemo(
    () => JSON.stringify(defaultValues),
    [defaultValues]
  )

  const form = useForm({
    resolver: zodResolver(mtbotSchema),
    defaultValues,
  })

  React.useEffect(() => {
    const parsed = JSON.parse(defaultsSignature) as MtbotSettingsValues
    initialRef.current = parsed
    form.reset(parsed)
  }, [defaultsSignature, form])

  const onSave = async () => {
    const values = form.getValues()
    const initial = initialRef.current
    const updates: Array<{ key: string; value: string | boolean }> = []

    if (values.MtbotEnabled !== initial.MtbotEnabled) {
      updates.push({ key: 'MtbotEnabled', value: values.MtbotEnabled })
    }
    if (values.MtbotTopupSecret && values.MtbotTopupSecret !== initial.MtbotTopupSecret) {
      updates.push({ key: 'MtbotTopupSecret', value: values.MtbotTopupSecret })
    }
    if (values.MtbotTopupURL && values.MtbotTopupURL !== initial.MtbotTopupURL) {
      updates.push({ key: 'MtbotTopupURL', value: values.MtbotTopupURL })
    }

    if (updates.length === 0) return

    for (const update of updates) {
      await updateOption.mutateAsync(update)
    }
  }

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-medium'>{t('Mtbot Alipay Gateway')}</h3>
        <p className='text-muted-foreground text-sm'>
          {t('Configuration for Mtbot Alipay direct recharge')}
        </p>
      </div>

      <Alert>
        <AlertDescription>
          {t(
            'When enabled, users can jump directly to the Mtbot Alipay recharge page from the wallet. The signing key must match TOPUP_SIGN_SECRET on the Mtbot server.'
          )}
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form className='space-y-4' data-no-autosubmit='true'>
          <FormField
            control={form.control}
            name='MtbotEnabled'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>
                    {t('Enable Mtbot Alipay direct recharge')}
                  </FormLabel>
                  <FormDescription>
                    {t('Allow users to recharge via Mtbot Alipay')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className='grid gap-6 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='MtbotTopupSecret'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('HMAC-SHA256 signing key')}</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder={t('Leave blank to keep current value')}
                      autoComplete='new-password'
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Must match TOPUP_SIGN_SECRET on the Mtbot server. Not shown after saving.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='MtbotTopupURL'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Recharge entry URL')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='https://www.mtbot.top/api/pay/topup'
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('Leave blank to use the default address')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type='button'
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onSave()
            }}
            disabled={updateOption.isPending}
          >
            {updateOption.isPending ? t('Saving...') : t('Save Mtbot settings')}
          </Button>
        </form>
      </Form>
    </div>
  )
}
