import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/supabase/helpers'
import { OnboardingWizard } from '@/components/modules/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const ctx = await getAuthContext()

  if (!ctx) redirect('/login')
  if (ctx.organization.onboarding_completed) redirect('/inicio')

  return (
    <OnboardingWizard
      organization={ctx.organization}
      profile={ctx.profile}
    />
  )
}
